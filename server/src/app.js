import path from "node:path";
import express from "express";
import { loadEnv } from "./config/env.js";
import { LeaderboardController } from "./controllers/leaderboard.controller.js";
import { createHttpLogger } from "./middleware/http-logger.js";
import { attachRequestContext } from "./middleware/request-context.js";
import { applySecurityMiddleware } from "./middleware/security.js";
import { errorHandler, notFoundHandler } from "./middleware/error-handler.js";
import { FileLeaderboardRepository } from "./repositories/file-leaderboard.repository.js";
import { createHealthRouter } from "./routes/health.routes.js";
import { createLeaderboardRouter } from "./routes/leaderboard.routes.js";
import { LeaderboardService } from "./services/leaderboard.service.js";

export function createApp(customEnv) {
  const env = customEnv ?? loadEnv();
  const app = express();

  const repository = new FileLeaderboardRepository(env.leaderboardPath, env.leaderboardMaxEntries);
  const service = new LeaderboardService(repository);
  const controller = new LeaderboardController(service);

  app.disable("x-powered-by");
  app.use(attachRequestContext);
  app.use(createHttpLogger(env));
  applySecurityMiddleware(app, env);

  app.get("/api/v1", (_request, response) => {
    response.json({
      service: "orion-run-api",
      version: "v1",
      routes: {
        health: "/api/v1/health",
        leaderboard: "/api/v1/leaderboard",
      },
    });
  });

  app.use("/api/v1/health", createHealthRouter());
  app.use("/api/v1/leaderboard", createLeaderboardRouter(controller, env));

  app.use(express.static(env.clientPath));

  app.get("/{*splat}", (request, response, next) => {
    if (request.path.startsWith("/api/")) {
      return next();
    }

    return response.sendFile(path.join(env.clientPath, "index.html"));
  });

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}