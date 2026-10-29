import compression from "compression";
import cors from "cors";
import express from "express";
import helmet from "helmet";

export function applySecurityMiddleware(app, env) {
  app.use(helmet({
    contentSecurityPolicy: {
      useDefaults: true,
      directives: {
        "script-src": ["'self'", "https://cdn.jsdelivr.net"],
        "style-src": ["'self'", "https://fonts.googleapis.com", "'unsafe-inline'"],
        "font-src": ["'self'", "https://fonts.gstatic.com"],
        "img-src": ["'self'", "data:"],
        "media-src": ["'self'", "blob:"]
      }
    },
    crossOriginResourcePolicy: { policy: "cross-origin" }
  }));

  const corsOrigins = env.corsOrigins ?? [];
  app.use(cors({
    // Sem CORS_ORIGIN, nenhuma origem externa recebe cabecalhos CORS.
    origin: corsOrigins === "*" ? "*" : corsOrigins.length > 0 ? corsOrigins : false,
    methods: ["GET", "POST"],
    maxAge: 86400
  }));

  app.use(compression());
  app.use(express.json({ limit: env.requestBodyLimit }));
}