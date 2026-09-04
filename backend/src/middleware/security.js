import mongoSanitizeLib from "express-mongo-sanitize";
import hppLib from "hpp";
import rateLimit from "express-rate-limit";

// Strips keys starting with $ or containing "." from req.body/query/params —
// blocks NoSQL operator injection like { "email": { "$gt": "" } }
export const mongoSanitize = mongoSanitizeLib();

// Blocks HTTP Parameter Pollution, e.g. ?role=Admin&role=SalesExecutive resolving
// to an array and slipping past a naive equality check
export const hpp = hppLib();

// Small recursive sanitizer that strips <script> tags and inline event handlers
// from string fields in body/query, without pulling in the deprecated xss-clean
// package (which has known prototype-pollution issues in its dependency chain).
const stripScripts = (value) => {
  if (typeof value === "string") {
    return value
      .replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, "")
      .replace(/on\w+\s*=\s*"[^"]*"/gi, "")
      .replace(/on\w+\s*=\s*'[^']*'/gi, "");
  }
  if (Array.isArray(value)) return value.map(stripScripts);
  if (value && typeof value === "object") {
    for (const key of Object.keys(value)) value[key] = stripScripts(value[key]);
    return value;
  }
  return value;
};

export const xssClean = (req, res, next) => {
  if (req.body) req.body = stripScripts(req.body);
  if (req.query) req.query = stripScripts(req.query);
  if (req.params) req.params = stripScripts(req.params);
  next();
};

// Lightweight CSRF mitigation: for state-changing requests, reject if the Origin
// header is present but doesn't match an allowed origin. Cookie-based auth (rather
// than a bearer token in a header) is what makes CSRF a relevant risk here, since
// browsers attach cookies automatically to cross-site requests.
export const verifyOrigin = (req, res, next) => {
  const stateChanging = ["POST", "PUT", "PATCH", "DELETE"].includes(req.method);
  if (!stateChanging) return next();

  const origin = req.headers.origin;
  if (!origin) return next(); // no Origin header = not a browser cross-site request (e.g. curl, server-to-server)

  const allowedOrigins = (process.env.CLIENT_URL || "http://localhost:5173")
    .split(",")
    .map((o) => o.trim());

  if (allowedOrigins.includes(origin)) return next();

  res.status(403);
  return next(new Error("Request blocked: origin not allowed"));
};

// Baseline limiter for all /api traffic; auth routes layer a stricter limiter on top
export const generalApiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 300,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: "Too many requests, please slow down" },
});

export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: "Too many attempts, please try again later" },
});
