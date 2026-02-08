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
  return {
    nodeEnv: process.env.NODE_ENV ?? "development",
    port: parseNumber(process.env.PORT, 8080),
    adminApiKey: process.env.ADMIN_API_KEY ?? "orion-admin-dev-key",
    corsOrigin: process.env.CORS_ORIGIN ?? "*",
    leaderboardPath: process.env.LEADERBOARD_FILE ?? path.join(projectRoot, "server/data/leaderboard.json"),
    leaderboardMaxEntries: parseNumber(process.env.LEADERBOARD_MAX_ENTRIES, 100),
    requestBodyLimit: process.env.REQUEST_BODY_LIMIT ?? "32kb",
    projectRoot,
    clientPath: path.join(projectRoot, "client"),
  };
}