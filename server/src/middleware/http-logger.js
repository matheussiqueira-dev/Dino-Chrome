import pinoHttp from "pino-http";

export function createHttpLogger(env) {
  const isDev = env.nodeEnv !== "production";

  return pinoHttp({
    level: isDev ? "debug" : "info",
    redact: ["req.headers.authorization", "req.headers.cookie", "req.headers.x-admin-key"],
    transport: isDev
      ? {
          target: "pino-pretty",
          options: {
            colorize: true,
            translateTime: "SYS:standard",
            ignore: "pid,hostname"
          }
        }
      : undefined,
    serializers: {
      req(request) {
        return {
          id: request.requestId,
          method: request.method,
          url: request.url,
        };
      },
      res(response) {
        return {
          statusCode: response.statusCode,
        };
      },
    },
    customProps(request) {
      return {
        requestId: request.requestId,
      };
    },
  });
}