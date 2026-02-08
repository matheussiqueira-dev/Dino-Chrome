import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";

function sortEntries(entries) {
  return [...entries].sort((a, b) => {
    if (a.score !== b.score) {
      return b.score - a.score;
    }

    return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
  });
}

export class FileLeaderboardRepository {
  constructor(filePath, maxEntries = 100) {
    this.filePath = filePath;
    this.maxEntries = maxEntries;
    this.writeQueue = Promise.resolve();
  }

  async ensureFile() {
    const directory = path.dirname(this.filePath);
    await mkdir(directory, { recursive: true });

    try {
      await readFile(this.filePath, "utf-8");
    } catch {
      await writeFile(this.filePath, "[]", "utf-8");
    }
  }

  async list(limit = 10) {
    const entries = await this.readAll();
    return sortEntries(entries).slice(0, limit);
  }

  async create(entry) {
    const now = new Date().toISOString();
    const persistedEntry = {
      id: randomUUID(),
      playerName: entry.playerName,
      score: entry.score,
      difficulty: entry.difficulty,
      controlMode: entry.controlMode,
      durationMs: entry.durationMs ?? null,
      createdAt: now,
    };

    const currentEntries = await this.readAll();
    currentEntries.push(persistedEntry);
    const sorted = sortEntries(currentEntries).slice(0, this.maxEntries);

    await this.writeAll(sorted);

    return persistedEntry;
  }

  async clear() {
    await this.writeAll([]);
  }

  async readAll() {
    await this.ensureFile();
    const raw = await readFile(this.filePath, "utf-8");

    try {
      const data = JSON.parse(raw);
      return Array.isArray(data) ? data : [];
    } catch {
      return [];
    }
  }

  async writeAll(entries) {
    const payload = `${JSON.stringify(entries, null, 2)}\n`;

    this.writeQueue = this.writeQueue.then(async () => {
      await writeFile(this.filePath, payload, "utf-8");
    });

    await this.writeQueue;
  }
}