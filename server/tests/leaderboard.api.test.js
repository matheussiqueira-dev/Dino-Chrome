import assert from "node:assert/strict";
import { mkdtemp, readFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { createApp } from "../src/app.js";
import { loadEnv } from "../src/config/env.js";

async function startTestServer(overrides = {}) {
  const tempDirectory = await mkdtemp(path.join(os.tmpdir(), "orion-run-test-"));
  const leaderboardPath = path.join(tempDirectory, "leaderboard.json");

  const env = {
    nodeEnv: "test",
    port: 0,
    adminApiKey: "test-admin-key",
    corsOrigins: [],
    leaderboardPath,
    leaderboardMaxEntries: 100,
    requestBodyLimit: "32kb",
    clientPath: path.resolve("client"),
    ...overrides,
  };

  const app = createApp(env);
  const server = app.listen(0);

  await new Promise((resolve) => server.once("listening", resolve));

  const address = server.address();
  const baseUrl = `http://127.0.0.1:${address.port}`;

  return {
    baseUrl,
    leaderboardPath,
    async close() {
      await new Promise((resolve, reject) => {
        server.close((error) => {
          if (error) {
            reject(error);
            return;
          }
          resolve();
        });
      });
    },
  };
}

test("health endpoint responde com status ok", async () => {
  const context = await startTestServer();

  try {
    const response = await fetch(`${context.baseUrl}/api/v1/health`);
    const data = await response.json();

    assert.equal(response.status, 200);
    assert.equal(data.status, "ok");
  } finally {
    await context.close();
  }
});

test("leaderboard endpoint cria e lista scores", async () => {
  const context = await startTestServer();

  try {
    const createResponse = await fetch(`${context.baseUrl}/api/v1/leaderboard`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
      },
      body: JSON.stringify({
        playerName: "Matheus",
        score: 120,
        difficulty: "normal",
        controlMode: "keyboard",
      }),
    });

    assert.equal(createResponse.status, 201);

    const listResponse = await fetch(`${context.baseUrl}/api/v1/leaderboard?limit=5`);
    const listData = await listResponse.json();

    assert.equal(listResponse.status, 200);
    assert.equal(listData.entries.length, 1);
    assert.equal(listData.entries[0].playerName, "Matheus");

    const stored = JSON.parse(await readFile(context.leaderboardPath, "utf-8"));
    assert.equal(stored.length, 1);
  } finally {
    await context.close();
  }
});

test("leaderboard valida payload e protege reset por autorizacao", async () => {
  const context = await startTestServer();

  try {
    const invalidResponse = await fetch(`${context.baseUrl}/api/v1/leaderboard`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
      },
      body: JSON.stringify({
        playerName: "X",
        score: -5,
      }),
    });

    assert.equal(invalidResponse.status, 422);

    const unauthorizedReset = await fetch(`${context.baseUrl}/api/v1/leaderboard`, {
      method: "DELETE",
    });

    assert.equal(unauthorizedReset.status, 401);

    const authorizedReset = await fetch(`${context.baseUrl}/api/v1/leaderboard`, {
      method: "DELETE",
      headers: {
        "x-admin-key": "test-admin-key",
      },
    });

    assert.equal(authorizedReset.status, 200);
  } finally {
    await context.close();
  }
});

test("leaderboard sem ADMIN_API_KEY nao expoe a rota de reset", async () => {
  const context = await startTestServer({ adminApiKey: null });

  try {
    const response = await fetch(`${context.baseUrl}/api/v1/leaderboard`, {
      method: "DELETE",
      headers: {
        "x-admin-key": "qualquer-chave",
      },
    });

    assert.equal(response.status, 404);
  } finally {
    await context.close();
  }
});

test("loadEnv exige ADMIN_API_KEY em producao", () => {
  const original = { NODE_ENV: process.env.NODE_ENV, ADMIN_API_KEY: process.env.ADMIN_API_KEY };

  try {
    process.env.NODE_ENV = "production";
    delete process.env.ADMIN_API_KEY;
    assert.throws(() => loadEnv(), /ADMIN_API_KEY/);

    process.env.ADMIN_API_KEY = "chave-gerada-no-teste";
    assert.equal(loadEnv().adminApiKey, "chave-gerada-no-teste");
  } finally {
    for (const [key, value] of Object.entries(original)) {
      if (value === undefined) {
        delete process.env[key];
      } else {
        process.env[key] = value;
      }
    }
  }
});

test("rotas de escrita respondem 429 acima do limite da janela", async () => {
  const context = await startTestServer({ rateLimitMax: 2, rateLimitWindowMs: 60000 });

  try {
    const submit = () => fetch(`${context.baseUrl}/api/v1/leaderboard`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ playerName: "Ana", score: 10 }),
    });

    assert.equal((await submit()).status, 201);
    assert.equal((await submit()).status, 201);

    const limited = await submit();
    assert.equal(limited.status, 429);
    assert.ok(Number(limited.headers.get("retry-after")) >= 1);

    const read = await fetch(`${context.baseUrl}/api/v1/leaderboard`);
    assert.equal(read.status, 200);
  } finally {
    await context.close();
  }
});

test("CORS recusa origem nao configurada e aceita a configurada", async () => {
  const context = await startTestServer({ corsOrigins: ["https://jogo.example"] });

  try {
    const foreign = await fetch(`${context.baseUrl}/api/v1/leaderboard`, {
      headers: { origin: "https://outro.example" },
    });
    assert.equal(foreign.headers.get("access-control-allow-origin"), null);

    const allowed = await fetch(`${context.baseUrl}/api/v1/leaderboard`, {
      headers: { origin: "https://jogo.example" },
    });
    assert.equal(allowed.headers.get("access-control-allow-origin"), "https://jogo.example");
  } finally {
    await context.close();
  }
});

test("CORS sem configuracao nao libera nenhuma origem externa", async () => {
  const context = await startTestServer();

  try {
    const response = await fetch(`${context.baseUrl}/api/v1/health`, {
      headers: { origin: "https://outro.example" },
    });
    assert.equal(response.headers.get("access-control-allow-origin"), null);
  } finally {
    await context.close();
  }
});

test("reset recusa credencial invalida de qualquer formato com 401", async () => {
  const context = await startTestServer();

  try {
    for (const key of ["x", "test-admin-ke", "test-admin-key-extra", "TEST-ADMIN-KEY", "a".repeat(512)]) {
      const response = await fetch(`${context.baseUrl}/api/v1/leaderboard`, {
        method: "DELETE",
        headers: { "x-admin-key": key },
      });
      assert.equal(response.status, 401, `chave ${key.slice(0, 20)} deveria ser recusada`);
    }
  } finally {
    await context.close();
  }
});
