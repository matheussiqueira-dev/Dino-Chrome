function parseErrorPayload(payload) {
  if (payload?.error?.message) {
    return payload.error.message;
  }

  return "Falha de comunicacao com API";
}

function createApiError(status, payload) {
  const error = new Error(parseErrorPayload(payload));
  error.status = status;
  return error;
}

export class LeaderboardApi {
  constructor(baseUrl = "/api/v1") {
    this.baseUrl = baseUrl;
  }

  async getLeaderboard(limit = 10) {
    const response = await fetch(`${this.baseUrl}/leaderboard?limit=${limit}`);

    if (!response.ok) {
      let payload = null;
      try {
        payload = await response.json();
      } catch {
        payload = null;
      }
      throw createApiError(response.status, payload);
    }

    return response.json();
  }

  async submitScore(entry) {
    const response = await fetch(`${this.baseUrl}/leaderboard`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
      },
      body: JSON.stringify(entry),
    });

    if (!response.ok) {
      let payload = null;
      try {
        payload = await response.json();
      } catch {
        payload = null;
      }
      throw createApiError(response.status, payload);
    }

    return response.json();
  }
}