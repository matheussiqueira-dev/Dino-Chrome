const STORAGE_KEYS = {
  playerName: "orion.playerName",
  bestScore: "orion.bestScore",
  highContrast: "orion.highContrast",
  reducedMotion: "orion.reducedMotion",
};

function safeGet(key) {
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
}

function safeSet(key, value) {
  try {
    window.localStorage.setItem(key, value);
  } catch {
    // ignore storage failures in restricted environments
  }
}

export const prefsStore = {
  getPlayerName() {
    return safeGet(STORAGE_KEYS.playerName) ?? "Player";
  },

  setPlayerName(name) {
    safeSet(STORAGE_KEYS.playerName, name);
  },

  getBestScore() {
    const value = Number(safeGet(STORAGE_KEYS.bestScore));
    return Number.isFinite(value) && value >= 0 ? value : 0;
  },

  setBestScore(score) {
    safeSet(STORAGE_KEYS.bestScore, String(score));
  },

  getHighContrast() {
    return safeGet(STORAGE_KEYS.highContrast) === "true";
  },

  setHighContrast(enabled) {
    safeSet(STORAGE_KEYS.highContrast, String(Boolean(enabled)));
  },

  getReducedMotion() {
    return safeGet(STORAGE_KEYS.reducedMotion) === "true";
  },

  setReducedMotion(enabled) {
    safeSet(STORAGE_KEYS.reducedMotion, String(Boolean(enabled)));
  },
};