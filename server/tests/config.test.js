import assert from "node:assert/strict";
import test from "node:test";
import { parseCorsOrigins } from "../src/config/env.js";
import { isSameSecret } from "../src/middleware/admin-auth.js";

test("parseCorsOrigins usa lista vazia por padrao", () => {
  assert.deepEqual(parseCorsOrigins(undefined), []);
  assert.deepEqual(parseCorsOrigins("  "), []);
});

test("parseCorsOrigins aceita lista separada por virgula e curinga explicito", () => {
  assert.deepEqual(parseCorsOrigins("https://a.example, https://b.example,"), ["https://a.example", "https://b.example"]);
  assert.equal(parseCorsOrigins("*"), "*");
});

test("isSameSecret compara credenciais sem aceitar valores ausentes", () => {
  assert.equal(isSameSecret("segredo", "segredo"), true);
  assert.equal(isSameSecret("segredo-", "segredo"), false);
  assert.equal(isSameSecret("", "segredo"), false);
  assert.equal(isSameSecret(undefined, "segredo"), false);
  assert.equal(isSameSecret(["segredo"], "segredo"), false);
});
