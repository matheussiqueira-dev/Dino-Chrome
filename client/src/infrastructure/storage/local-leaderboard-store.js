import { addLocalEntry, LOCAL_LEADERBOARD_LIMIT, normalizeEntry, sortEntries } from "../../domain/local-leaderboard.js";

const STORAGE_KEY = "orion.localLeaderboard";

export class LocalLeaderboardStore {
  constructor(storage) {
    this.storage = storage;
  }

  readAll() {
    try {
      const data = JSON.parse(this.storage?.getItem(STORAGE_KEY) ?? "[]");
      return Array.isArray(data) ? sortEntries(data.map(normalizeEntry).filter(Boolean)) : [];
    } catch {
      return [];
    }
  }

  list(limit = LOCAL_LEADERBOARD_LIMIT) {
    return this.readAll().slice(0, limit);
  }

  add(rawEntry, now = new Date()) {
    if (!this.storage) {
      throw new Error("Armazenamento local indisponível");
    }

    const { entry, entries } = addLocalEntry(this.readAll(), rawEntry, { now });

    try {
      this.storage.setItem(STORAGE_KEY, JSON.stringify(entries));
    } catch {
      throw new Error("Armazenamento local indisponível");
    }

    return entry;
  }
}
