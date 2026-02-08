import { Router } from "express";
import { getHealth } from "../controllers/health.controller.js";

export function createHealthRouter() {
  const router = Router();
  router.get("/", getHealth);
  return router;
}