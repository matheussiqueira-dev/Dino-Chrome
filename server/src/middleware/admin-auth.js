import { HttpError } from "../errors/http-error.js";

export function authorizeAdmin(adminApiKey) {
  return function adminAuthMiddleware(request, _response, next) {
    const providedKey = request.headers["x-admin-key"];

    if (!providedKey || providedKey !== adminApiKey) {
      return next(new HttpError(401, "Nao autorizado"));
    }

    return next();
  };
}