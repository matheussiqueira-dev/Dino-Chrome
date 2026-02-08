import { HttpError } from "../errors/http-error.js";

export function notFoundHandler(request, response, next) {
  next(new HttpError(404, `Rota nao encontrada: ${request.method} ${request.originalUrl}`));
}

export function errorHandler(error, request, response, _next) {
  const statusCode = error.statusCode ?? 500;
  const payload = {
    error: {
      code: statusCode,
      message: statusCode >= 500 ? "Erro interno no servidor" : error.message,
      requestId: request.requestId,
    },
  };

  if (statusCode < 500 && error.details) {
    payload.error.details = error.details;
  }

  request.log.error(
    {
      err: error,
      requestId: request.requestId,
      statusCode,
    },
    "request_failed"
  );

  response.status(statusCode).json(payload);
}