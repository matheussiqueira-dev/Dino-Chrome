// Usa o ranking local quando a API nao existe ou nao responde.
// Erros de validacao (4xx) e limite de taxa continuam sendo mostrados ao jogador.
export function isApiUnavailable(error) {
  const status = error?.status;
  return status === undefined || status === 404 || status >= 500;
}

export class ResilientLeaderboard {
  constructor({ remote, local }) {
    this.remote = remote;
    this.local = local;
  }

  async getLeaderboard(limit = 10) {
    try {
      const data = await this.remote.getLeaderboard(limit);
      return { entries: data.entries ?? [], source: "remote" };
    } catch (error) {
      if (!isApiUnavailable(error)) {
        throw error;
      }
      return { entries: this.local.list(limit), source: "local" };
    }
  }

  async submitScore(entry) {
    try {
      const data = await this.remote.submitScore(entry);
      return { entry: data.entry, source: "remote" };
    } catch (error) {
      if (!isApiUnavailable(error)) {
        throw error;
      }
      return { entry: this.local.add(entry), source: "local" };
    }
  }
}
