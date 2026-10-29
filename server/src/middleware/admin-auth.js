import { createHash, timingSafeEqual } from "node:crypto";
import { HttpError } from "../errors/http-error.js";

function digest(value) {
  return createHash("sha256").update(value, "utf8").digest();
}

export function isSameSecret(provided, expected) {
  if (typeof provided !== "string" || typeof expected !== "string" || provided.length === 0) {
    return false;
  }

  return timingSafeEqual(digest(provided), digest(expected));
}

export function authorizeAdmin(adminApiKey) {
  return function adminAuthMiddleware(request, _response, next) {
    if (!isSameSecret(request.headers["x-admin-key"], adminApiKey)) {
      return next(new HttpError(401, "Nao autorizado"));
    }

    return next();
  };
}
