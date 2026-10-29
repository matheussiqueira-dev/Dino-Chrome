import { Router } from "express";
import { authorizeAdmin } from "../middleware/admin-auth.js";
import { createRateLimiter } from "../middleware/rate-limit.js";

export function createLeaderboardRouter(controller, env) {
  const router = Router();
  const writeLimiter = createRateLimiter({
    windowMs: env.rateLimitWindowMs ?? 60000,
    max: env.rateLimitMax ?? 20,
  });

  router.get("/", controller.list);
  router.post("/", writeLimiter, controller.create);
  if (env.adminApiKey) {
    router.delete("/", writeLimiter, authorizeAdmin(env.adminApiKey), controller.reset);
  }

  return router;
}