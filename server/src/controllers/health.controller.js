export function getHealth(request, response) {
  response.json({
    status: "ok",
    service: "orion-run-api",
    now: new Date().toISOString(),
    requestId: request.requestId,
  });
}