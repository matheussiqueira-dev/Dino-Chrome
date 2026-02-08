import assert from "node:assert/strict";
import test from "node:test";
import { LeaderboardService } from "../src/services/leaderboard.service.js";

class InMemoryRepository {
  constructor() {
    this.entries = [];
  }

  async list(limit = 10) {
    return [...this.entries]
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);
  }

  async create(entry) {
    const value = {
      id: String(this.entries.length + 1),
      createdAt: new Date().toISOString(),
      ...entry,
    };

    this.entries.push(value);
    return value;
  }

  async clear() {
    this.entries = [];
  }
}

test("LeaderboardService.submitScore salva payload validado", async () => {
  const repository = new InMemoryRepository();
  const service = new LeaderboardService(repository);

  const result = await service.submitScore({
    playerName: "  Matheus   Dev  ",
    score: 345,
    difficulty: "hard",
    controlMode: "keyboard",
  });

  assert.equal(result.message, "Score salvo com sucesso");
  assert.equal(result.entry.score, 345);
  assert.equal(result.entry.playerName, "Matheus Dev");
  assert.equal(repository.entries.length, 1);
});

test("LeaderboardService.getLeaderboard respeita limite", async () => {
  const repository = new InMemoryRepository();
  const service = new LeaderboardService(repository);

  await repository.create({ playerName: "A", score: 10, difficulty: "easy", controlMode: "keyboard" });
  await repository.create({ playerName: "B", score: 20, difficulty: "easy", controlMode: "keyboard" });
  await repository.create({ playerName: "C", score: 30, difficulty: "easy", controlMode: "keyboard" });

  const result = await service.getLeaderboard({ limit: "2" });

  assert.equal(result.entries.length, 2);
  assert.equal(result.entries[0].score, 30);
  assert.equal(result.entries[1].score, 20);
});

test("LeaderboardService.reset remove entradas", async () => {
  const repository = new InMemoryRepository();
  const service = new LeaderboardService(repository);

  await repository.create({ playerName: "A", score: 1, difficulty: "easy", controlMode: "keyboard" });
  const result = await service.reset();

  assert.equal(result.message, "Leaderboard resetado");
  assert.equal(repository.entries.length, 0);
});