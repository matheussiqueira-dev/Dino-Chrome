import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, "../../..");

function parseNumber(value, fallback) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

export function loadEnv() {
  const nodeEnv = process.env.NODE_ENV ?? "development";
  // Sem chave, a rota DELETE /api/v1/leaderboard nao e registrada.
  const adminApiKey = process.env.ADMIN_API_KEY?.trim() || null;

  if (nodeEnv === "production" && !adminApiKey) {
    throw new Error("ADMIN_API_KEY e obrigatoria quando NODE_ENV=production");
  }

  return {
    nodeEnv,
    port: parseNumber(process.env.PORT, 8080),
    adminApiKey,
    corsOrigin: process.env.CORS_ORIGIN ?? "*",
    leaderboardPath: process.env.LEADERBOARD_FILE ?? path.join(projectRoot, "server/data/leaderboard.json"),
    leaderboardMaxEntries: parseNumber(process.env.LEADERBOARD_MAX_ENTRIES, 100),
    rateLimitWindowMs: parseNumber(process.env.RATE_LIMIT_WINDOW_MS, 60000),
    rateLimitMax: parseNumber(process.env.RATE_LIMIT_MAX, 20),
    requestBodyLimit: process.env.REQUEST_BODY_LIMIT ?? "32kb",
    projectRoot,
    clientPath: path.join(projectRoot, "client"),
  };
}