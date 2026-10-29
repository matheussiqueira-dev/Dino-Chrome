import assert from "node:assert/strict";
import test from "node:test";
import { createRateLimiter } from "../src/middleware/rate-limit.js";

function runLimiter(limiter, ip = "10.0.0.1") {
  const headers = {};
  let forwardedError;
  const response = { setHeader: (name, value) => { headers[name] = value; } };
  limiter({ ip }, response, (error) => { forwardedError = error; });
  return { headers, error: forwardedError };
}

test("rate limiter permite ate o limite e responde 429 depois", () => {
  let clock = 0;
  const limiter = createRateLimiter({ windowMs: 1000, max: 2, now: () => clock });

  assert.equal(runLimiter(limiter).error, undefined);
  const second = runLimiter(limiter);
  assert.equal(second.error, undefined);
  assert.equal(second.headers["RateLimit-Remaining"], "0");

  const third = runLimiter(limiter);
  assert.equal(third.error.statusCode, 429);
  assert.equal(third.headers["Retry-After"], "1");

  assert.equal(runLimiter(limiter, "10.0.0.2").error, undefined);

  clock = 1000;
  assert.equal(runLimiter(limiter).error, undefined);
});

test("rate limiter limita a memoria descartando clientes antigos", () => {
  let clock = 0;
  const limiter = createRateLimiter({ windowMs: 1000, max: 1, now: () => clock, maxTrackedClients: 2 });

  runLimiter(limiter, "a");
  runLimiter(limiter, "b");
  assert.equal(runLimiter(limiter, "a").error.statusCode, 429);

  runLimiter(limiter, "c");
  assert.equal(runLimiter(limiter, "a").error, undefined, "cliente mais antigo foi descartado");

  clock = 1000;
  runLimiter(limiter, "d");
  assert.equal(runLimiter(limiter, "c").error, undefined, "janelas expiradas sao removidas");
});

test("rate limiter usa chave padrao quando o ip nao esta disponivel", () => {
  const limiter = createRateLimiter({ windowMs: 1000, max: 1, now: () => 0 });
  const response = { setHeader() {} };
  let error;
  limiter({}, response, () => {});
  limiter({}, response, (forwarded) => { error = forwarded; });
  assert.equal(error.statusCode, 429);
});
