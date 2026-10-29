import assert from "node:assert/strict";
import test from "node:test";
import {
  addLocalEntry,
  normalizeEntry,
  normalizePlayerName,
  toLeaderboardRows,
} from "../src/domain/local-leaderboard.js";
import { LocalLeaderboardStore } from "../src/infrastructure/storage/local-leaderboard-store.js";

function memoryStorage(initial = {}) {
  const data = new Map(Object.entries(initial));
  return {
    getItem: (key) => (data.has(key) ? data.get(key) : null),
    setItem: (key, value) => data.set(key, String(value)),
    raw: data,
  };
}

const at = (iso) => new Date(iso);

test("normalizePlayerName aceita nomes validos e recusa invalidos", () => {
  assert.equal(normalizePlayerName("  Ana   Paula "), "Ana Paula");
  assert.equal(normalizePlayerName("A"), null);
  assert.equal(normalizePlayerName("x".repeat(21)), null);
  assert.equal(normalizePlayerName("<b>Ana</b>"), null);
  assert.equal(normalizePlayerName(42), null);
});

test("addLocalEntry ordena por score e desempata pelo mais antigo", () => {
  let entries = [];
  entries = addLocalEntry(entries, { playerName: "Bia", score: 50 }, { now: at("2026-01-02T00:00:00Z") }).entries;
  entries = addLocalEntry(entries, { playerName: "Caio", score: 80 }, { now: at("2026-01-03T00:00:00Z") }).entries;
  entries = addLocalEntry(entries, { playerName: "Duda", score: 50 }, { now: at("2026-01-04T00:00:00Z") }).entries;

  assert.deepEqual(entries.map((entry) => entry.playerName), ["Caio", "Bia", "Duda"]);
});

test("addLocalEntry mantem no maximo 10 entradas", () => {
  let entries = [];
  for (let score = 0; score < 15; score += 1) {
    entries = addLocalEntry(entries, { playerName: `P${score}`, score }, { now: at("2026-01-01T00:00:00Z") }).entries;
  }

  assert.equal(entries.length, 10);
  assert.equal(entries[0].score, 14);
  assert.equal(entries.at(-1).score, 5);
});

test("addLocalEntry recusa nome invalido", () => {
  assert.throws(() => addLocalEntry([], { playerName: "<img>", score: 10 }), /Nome deve ter/);
});

test("normalizeEntry descarta score invalido e corrige enums desconhecidos", () => {
  assert.equal(normalizeEntry({ playerName: "Ana", score: -1 }), null);
  assert.equal(normalizeEntry({ playerName: "Ana", score: 1.5 }), null);
  const entry = normalizeEntry({ playerName: "Ana", score: 3, difficulty: "x", controlMode: "y", createdAt: "invalida" });
  assert.equal(entry.difficulty, "normal");
  assert.equal(entry.controlMode, "keyboard");
  assert.equal(entry.createdAt, new Date(0).toISOString());
});

test("toLeaderboardRows preserva marcacao do nome como texto literal", () => {
  const rows = toLeaderboardRows([
    { playerName: "<img src=x onerror=alert(1)>", score: 12.9, difficulty: "hard", controlMode: "gesture", createdAt: "2026-02-01T12:00:00Z" },
  ]);

  assert.equal(rows[0].name, "<img src=x onerror=alert(1)>");
  assert.equal(rows[0].rank, "1");
  assert.equal(rows[0].score, "12");
  assert.match(rows[0].meta, /^hard • gesture • /);
});

test("LocalLeaderboardStore persiste, lista e ignora dados corrompidos", () => {
  const storage = memoryStorage({ "orion.localLeaderboard": "{nao-json" });
  const store = new LocalLeaderboardStore(storage);

  assert.deepEqual(store.list(), []);
  store.add({ playerName: "Ana", score: 30 }, at("2026-03-01T00:00:00Z"));
  store.add({ playerName: "Leo", score: 90 }, at("2026-03-02T00:00:00Z"));

  assert.deepEqual(store.list().map((entry) => entry.playerName), ["Leo", "Ana"]);
  assert.equal(store.list(1).length, 1);

  storage.setItem("orion.localLeaderboard", JSON.stringify([{ playerName: "<script>", score: 999 }, { playerName: "Ok", score: 1 }]));
  assert.deepEqual(store.list().map((entry) => entry.playerName), ["Ok"]);
});

test("LocalLeaderboardStore sem armazenamento falha de forma explicita", () => {
  const store = new LocalLeaderboardStore(null);
  assert.deepEqual(store.list(), []);
  assert.throws(() => store.add({ playerName: "Ana", score: 1 }), /Armazenamento local/);
});
