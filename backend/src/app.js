import express from "express";
import cookieParser from "cookie-parser";
import morgan from "morgan";
import swaggerUi from "swagger-ui-express";

import swaggerSpec from "./config/swagger.js";
import helmetConfig from "./config/helmet.js";
import corsConfig from "./config/cors.js";
import {
  mongoSanitize,
  hpp,
  xssClean,
  verifyOrigin,
  generalApiLimiter,
  authLimiter,
} from "./middleware/security.js";
import { notFound, errorHandler } from "./middleware/errorHandler.js";

import publicRoutes from "./routes/public.routes.js";
import adminRoutes from "./routes/admin.routes.js";
import salesExecutiveRoutes from "./routes/salesExecutive.routes.js";

const app = express();

// Needed for correct client IPs / rate limiting when deployed behind Render's proxy
app.set("trust proxy", 1);

// ---------- Security headers ----------
app.use(helmetConfig);

// ---------- CORS ----------
app.use(corsConfig);

// ---------- Body parsing (size limits blunt payload-based DoS) ----------
app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true, limit: "1mb" }));
app.use(cookieParser());

// ---------- Injection & pollution protection ----------
app.use(mongoSanitize); // strips NoSQL operator injection ($gt, $where, etc.)
app.use(hpp); // blocks HTTP Parameter Pollution (?role=a&role=b style attacks)
app.use(xssClean); // strips script/HTML payloads from string fields

// ---------- CSRF mitigation for state-changing requests ----------
app.use("/api", verifyOrigin);

// ---------- Logging ----------
app.use(morgan(process.env.NODE_ENV === "production" ? "combined" : "dev"));

// ---------- Rate limiting (baseline; auth routes layer a stricter limit) ----------
app.use("/api", generalApiLimiter);
app.use("/api/auth/login", authLimiter);
app.use("/api/auth/register", authLimiter);

// ---------- API docs ----------
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// ---------- Health check ----------
app.get("/api/health", (req, res) => res.json({ success: true, message: "API is running" }));

// ---------- API routes ----------
// Each file already defines its own sub-paths (e.g. /auth/login, /leads/:id),
// so all three mount at the same /api root — final URLs are unchanged from before
// (e.g. POST /api/auth/login, GET /api/leads, PUT /api/users/:id).
app.use("/api", publicRoutes);
app.use("/api", adminRoutes);
app.use("/api", salesExecutiveRoutes);

// ---------- Fallback 404 for unmatched API routes ----------
app.use(notFound);

// ---------- Global error handler ----------
// Never leak stack traces to the client in production; details go to server logs only.
app.use(errorHandler);

export default app;
