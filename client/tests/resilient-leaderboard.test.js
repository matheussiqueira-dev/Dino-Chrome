import assert from "node:assert/strict";
import test from "node:test";
import { isApiUnavailable, ResilientLeaderboard } from "../src/infrastructure/api/resilient-leaderboard.js";

function httpError(status) {
  const error = new Error(`HTTP ${status}`);
  error.status = status;
  return error;
}

function fakeLocal() {
  const added = [];
  return {
    added,
    list: (limit) => [{ playerName: "Local", score: 1 }].slice(0, limit),
    add: (entry) => {
      added.push(entry);
      return { ...entry, id: "local-1" };
    },
  };
}

test("isApiUnavailable cobre rede, 404 e 5xx, mas nao 4xx de validacao ou 429", () => {
  assert.equal(isApiUnavailable(new TypeError("fetch failed")), true);
  assert.equal(isApiUnavailable(httpError(404)), true);
  assert.equal(isApiUnavailable(httpError(503)), true);
  assert.equal(isApiUnavailable(httpError(422)), false);
  assert.equal(isApiUnavailable(httpError(429)), false);
});

test("usa a API quando ela responde", async () => {
  const local = fakeLocal();
  const leaderboard = new ResilientLeaderboard({
    remote: {
      getLeaderboard: async () => ({ entries: [{ playerName: "Api", score: 5 }] }),
      submitScore: async (entry) => ({ entry: { ...entry, id: "api-1" } }),
    },
    local,
  });

  assert.deepEqual(await leaderboard.getLeaderboard(10), { entries: [{ playerName: "Api", score: 5 }], source: "remote" });
  const saved = await leaderboard.submitScore({ playerName: "Ana", score: 3 });
  assert.equal(saved.source, "remote");
  assert.equal(local.added.length, 0);
});

test("cai para o ranking local quando a API nao esta disponivel", async () => {
  const local = fakeLocal();
  const leaderboard = new ResilientLeaderboard({
    remote: {
      getLeaderboard: async () => { throw new TypeError("fetch failed"); },
      submitScore: async () => { throw httpError(404); },
    },
    local,
  });

  const listed = await leaderboard.getLeaderboard(10);
  assert.equal(listed.source, "local");
  assert.equal(listed.entries[0].playerName, "Local");

  const saved = await leaderboard.submitScore({ playerName: "Ana", score: 3 });
  assert.equal(saved.source, "local");
  assert.equal(saved.entry.id, "local-1");
});

test("propaga erro de validacao e limite de taxa sem salvar localmente", async () => {
  const local = fakeLocal();
  const leaderboard = new ResilientLeaderboard({
    remote: {
      getLeaderboard: async () => { throw httpError(429); },
      submitScore: async () => { throw httpError(422); },
    },
    local,
  });

  await assert.rejects(() => leaderboard.getLeaderboard(10), /HTTP 429/);
  await assert.rejects(() => leaderboard.submitScore({ playerName: "Ana", score: 3 }), /HTTP 422/);
  assert.equal(local.added.length, 0);
});
