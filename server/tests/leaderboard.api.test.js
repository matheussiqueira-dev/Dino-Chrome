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
    corsOrigin: "*",
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
