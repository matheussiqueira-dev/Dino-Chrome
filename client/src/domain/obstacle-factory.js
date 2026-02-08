import { randomBetween } from "../core/math.js";

export function createObstacle(gameWidth, obstacleConfig, bias = 0.42) {
  const type = Math.random() < bias ? "low" : "tall";
  const width = randomBetween(obstacleConfig.minWidth, obstacleConfig.maxWidth);

  let height = randomBetween(obstacleConfig.minTallHeight, obstacleConfig.maxTallHeight);
  let yOffset = 0;

  if (type === "low") {
    height = randomBetween(obstacleConfig.minLowHeight, obstacleConfig.maxLowHeight);
    yOffset = randomBetween(28, 48);
  }

  return {
    type,
    width,
    height,
    yOffset,
    x: gameWidth + randomBetween(60, 140),
  };
}