import helmet from "helmet";

// crossOriginResourcePolicy relaxed to "cross-origin" since the API is consumed
// by a separately-hosted frontend (Vercel) rather than served from the same origin.
const helmetConfig = helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" },
  contentSecurityPolicy: false, // this is a JSON API, not serving HTML — CSP not applicable
});

export default helmetConfig;
