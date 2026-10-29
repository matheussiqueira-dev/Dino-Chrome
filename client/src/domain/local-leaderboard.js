export const LOCAL_LEADERBOARD_LIMIT = 10;

const NAME_PATTERN = /^[a-zA-Z0-9_\-\s]+$/;
const DIFFICULTIES = new Set(["easy", "normal", "hard"]);
const CONTROL_MODES = new Set(["keyboard", "gesture"]);

export function normalizePlayerName(rawName) {
  if (typeof rawName !== "string") {
    return null;
  }

  const name = rawName.trim().replace(/\s+/g, " ");
  if (name.length < 2 || name.length > 20 || !NAME_PATTERN.test(name)) {
    return null;
  }

  return name;
}

export function normalizeEntry(raw) {
  if (!raw || typeof raw !== "object") {
    return null;
  }

  const playerName = normalizePlayerName(raw.playerName);
  const score = Number(raw.score);
  if (!playerName || !Number.isInteger(score) || score < 0 || score > 999999) {
    return null;
  }

  const createdAt = new Date(raw.createdAt);

  return {
    id: typeof raw.id === "string" ? raw.id : `${createdAt.getTime()}-${playerName}`,
    playerName,
    score,
    difficulty: DIFFICULTIES.has(raw.difficulty) ? raw.difficulty : "normal",
    controlMode: CONTROL_MODES.has(raw.controlMode) ? raw.controlMode : "keyboard",
    createdAt: Number.isNaN(createdAt.getTime()) ? new Date(0).toISOString() : createdAt.toISOString(),
  };
}

export function sortEntries(entries) {
  return [...entries].sort((a, b) => {
    if (a.score !== b.score) {
      return b.score - a.score;
    }

    return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
  });
}

export function addLocalEntry(entries, rawEntry, { now = new Date(), limit = LOCAL_LEADERBOARD_LIMIT } = {}) {
  const entry = normalizeEntry({ ...rawEntry, createdAt: now.toISOString() });
  if (!entry) {
    throw new Error("Nome deve ter de 2 a 20 letras, números, espaços, _ ou -");
  }

  const valid = entries.map(normalizeEntry).filter(Boolean);
  return { entry, entries: sortEntries([...valid, entry]).slice(0, limit) };
}

export function toLeaderboardRows(entries) {
  return entries.map((entry, index) => {
    const createdAt = new Date(entry.createdAt);
    const when = Number.isNaN(createdAt.getTime()) ? "-" : createdAt.toLocaleDateString("pt-BR");

    return {
      rank: String(index + 1),
      name: String(entry.playerName),
      meta: `${entry.difficulty} • ${entry.controlMode} • ${when}`,
      score: String(Math.floor(Number(entry.score) || 0)),
    };
  });
}
