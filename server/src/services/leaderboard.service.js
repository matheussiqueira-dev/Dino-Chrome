import { validateLeaderboardQuery, validateSubmitScore } from "../validation/leaderboard.validation.js";

export class LeaderboardService {
  constructor(repository) {
    this.repository = repository;
  }

  async getLeaderboard(rawQuery) {
    const query = validateLeaderboardQuery(rawQuery);
    const entries = await this.repository.list(query.limit);

    return {
      entries,
      total: entries.length,
      limit: query.limit,
    };
  }

  async submitScore(rawPayload) {
    const payload = validateSubmitScore(rawPayload);

    const cleanPayload = {
      ...payload,
      playerName: payload.playerName.replace(/\s+/g, " "),
    };

    const entry = await this.repository.create(cleanPayload);

    return {
      entry,
      message: "Score salvo com sucesso",
    };
  }

  async reset() {
    await this.repository.clear();

    return {
      message: "Leaderboard resetado",
    };
  }
}