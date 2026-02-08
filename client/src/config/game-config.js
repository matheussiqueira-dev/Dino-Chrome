export const GAME_CONFIG = {
  canvas: {
    groundHeight: 118,
  },
  player: {
    x: 130,
    width: 58,
    height: 82,
    crouchHeight: 56,
    jumpVelocity: 15,
    gravity: 0.86,
  },
  world: {
    speedCap: 13.5,
    speedIncrease: 0.0032,
    starDensity: 26,
  },
  scoring: {
    pointsPerSecond: 11,
  },
  obstacle: {
    spawnMin: 1.7,
    spawnMax: 3.3,
    minWidth: 28,
    maxWidth: 52,
    minTallHeight: 44,
    maxTallHeight: 84,
    minLowHeight: 24,
    maxLowHeight: 42,
  },
  gesture: {
    stableThreshold: 4,
    holdMs: 340,
    jumpCooldownMs: 420,
  },
  difficulty: {
    easy: {
      speed: 4.7,
      scoreMultiplier: 0.9,
      obstacleBias: 0.3,
    },
    normal: {
      speed: 5.7,
      scoreMultiplier: 1,
      obstacleBias: 0.42,
    },
    hard: {
      speed: 6.9,
      scoreMultiplier: 1.2,
      obstacleBias: 0.55,
    },
  },
};

export const CONTROL_MODE = {
  KEYBOARD: "keyboard",
  GESTURE: "gesture",
};