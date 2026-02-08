import { randomUUID } from "node:crypto";

export function attachRequestContext(request, response, next) {
  request.requestId = randomUUID();
  response.setHeader("x-request-id", request.requestId);
  next();
}