import { Router } from "express";
import { authorizeAdmin } from "../middleware/admin-auth.js";

export function createLeaderboardRouter(controller, env) {
  const router = Router();

  router.get("/", controller.list);
  router.post("/", controller.create);
  router.delete("/", authorizeAdmin(env.adminApiKey), controller.reset);

  return router;
}