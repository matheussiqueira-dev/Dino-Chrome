import { randomBetween } from "../core/math.js";

export function createObstacle(gameWidth, obstacleConfig, bias = 0.42, random = Math.random) {
  const type = random() < bias ? "low" : "tall";
  const width = randomBetween(obstacleConfig.minWidth, obstacleConfig.maxWidth, random);

  let height = randomBetween(obstacleConfig.minTallHeight, obstacleConfig.maxTallHeight, random);
  let yOffset = 0;

  if (type === "low") {
    height = randomBetween(obstacleConfig.minLowHeight, obstacleConfig.maxLowHeight, random);
    yOffset = randomBetween(28, 48, random);
  }

  return {
    type,
    width,
    height,
    yOffset,
    x: gameWidth + randomBetween(60, 140, random),
  };
}