import cors from "cors";

// Comma-separated list in env so we can allow both local dev and the deployed
// Vercel frontend at once, e.g. CLIENT_URL="http://localhost:5173,https://crm.vercel.app"
const allowedOrigins = (process.env.CLIENT_URL || "http://localhost:5173")
  .split(",")
  .map((o) => o.trim());

const corsConfig = cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (curl, Postman, server-to-server health checks)
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error(`CORS blocked: origin '${origin}' is not allowed`));
    }
  },
  credentials: true, // required so the httpOnly auth cookie is sent/received
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
});

export default corsConfig;
