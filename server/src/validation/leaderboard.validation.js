import { z } from "zod";
import { HttpError } from "../errors/http-error.js";

const difficultyValues = ["easy", "normal", "hard"];
const controlModeValues = ["keyboard", "gesture"];

const submitScoreSchema = z.object({
  playerName: z
    .string()
    .trim()
    .min(2, "playerName deve ter no minimo 2 caracteres")
    .max(20, "playerName deve ter no maximo 20 caracteres")
    .regex(/^[a-zA-Z0-9_\-\s]+$/, "playerName contem caracteres invalidos"),
  score: z.int().min(0).max(999999),
  durationMs: z.int().min(0).max(3600000).optional(),
  difficulty: z.enum(difficultyValues).default("normal"),
  controlMode: z.enum(controlModeValues).default("keyboard"),
});

const leaderboardQuerySchema = z.object({
  limit: z
    .string()
    .optional()
    .transform((value) => (value ? Number(value) : 10))
    .refine((value) => Number.isInteger(value) && value >= 1 && value <= 50, {
      message: "limit deve ser um inteiro entre 1 e 50",
    }),
});

function formatZodErrors(error) {
  return error.issues.map((issue) => ({
    field: issue.path.join("."),
    message: issue.message,
  }));
}

export function validateSubmitScore(payload) {
  const parsed = submitScoreSchema.safeParse(payload);

  if (!parsed.success) {
    throw new HttpError(422, "Payload invalido", formatZodErrors(parsed.error));
  }

  return parsed.data;
}

export function validateLeaderboardQuery(payload) {
  const parsed = leaderboardQuerySchema.safeParse(payload);

  if (!parsed.success) {
    throw new HttpError(422, "Query invalida", formatZodErrors(parsed.error));
  }

  return parsed.data;
}