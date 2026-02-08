export class LeaderboardController {
  constructor(service) {
    this.service = service;
    this.list = this.list.bind(this);
    this.create = this.create.bind(this);
    this.reset = this.reset.bind(this);
  }

  async list(request, response) {
    const data = await this.service.getLeaderboard(request.query);
    response.json(data);
  }

  async create(request, response) {
    const data = await this.service.submitScore(request.body);
    response.status(201).json(data);
  }

  async reset(_request, response) {
    const data = await this.service.reset();
    response.json(data);
  }
}