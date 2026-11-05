import assert from "node:assert/strict";
import test from "node:test";
import { GAME_CONFIG } from "../src/config/game-config.js";
import { intersects } from "../src/domain/collision.js";
import { createObstacle } from "../src/domain/obstacle-factory.js";
import { Player } from "../src/domain/player.js";

const FRAME = 1 / 60;
const GROUND_Y = 400;

const stepUntilLanded = (player, maxFrames = 300) => {
  for (let frame = 0; frame < maxFrames; frame += 1) {
    player.update(FRAME);
    if (player.isOnGround) return frame + 1;
  }
  throw new Error("player never landed");
};

const box = (x, y, width = 10, height = 10) => ({ x, y, width, height });

test("Player comeca parado no chao", () => {
  const player = new Player(GAME_CONFIG.player);

  player.update(FRAME);

  assert.equal(player.y, 0);
  assert.equal(player.isOnGround, true);
  assert.equal(player.currentHeight, GAME_CONFIG.player.height);
});

test("Player pula e volta ao chao com velocidade zerada", () => {
  const player = new Player(GAME_CONFIG.player);

  player.queueJump();
  player.update(FRAME);
  assert.equal(player.isOnGround, false);
  assert.ok(player.y > 0);

  stepUntilLanded(player);
  assert.equal(player.y, 0);
  assert.equal(player.velocityY, 0);
});

test("Player nao ganha impulso com pulo pedido no ar", () => {
  const player = new Player(GAME_CONFIG.player);
  player.queueJump();
  player.update(FRAME);
  const velocityBefore = player.velocityY;

  player.queueJump();
  player.update(FRAME);

  assert.ok(player.velocityY < velocityBefore);
});

test("Player executa o pulo pedido no ar ao tocar o chao", () => {
  const player = new Player(GAME_CONFIG.player);
  player.queueJump();
  player.update(FRAME);
  player.queueJump();

  stepUntilLanded(player);
  player.update(FRAME);

  assert.equal(player.isOnGround, false);
});

test("agachar reduz a altura e soltar restaura", () => {
  const player = new Player(GAME_CONFIG.player);

  player.setCrouch(true);
  player.update(FRAME);
  assert.equal(player.currentHeight, GAME_CONFIG.player.crouchHeight);

  player.setCrouch(false);
  player.update(FRAME);
  assert.equal(player.currentHeight, GAME_CONFIG.player.height);
});

test("agachar no ar so vale depois de pousar", () => {
  const player = new Player(GAME_CONFIG.player);
  player.queueJump();
  player.update(FRAME);

  player.setCrouch(true);
  player.update(FRAME);
  assert.equal(player.isCrouching, false);

  stepUntilLanded(player);
  player.update(FRAME);
  assert.equal(player.isCrouching, true);
});

test("hitbox acompanha salto e altura atual", () => {
  const player = new Player(GAME_CONFIG.player);

  assert.deepEqual(player.getHitbox(GROUND_Y), {
    x: GAME_CONFIG.player.x,
    y: GROUND_Y - GAME_CONFIG.player.height,
    width: GAME_CONFIG.player.width,
    height: GAME_CONFIG.player.height,
  });

  player.setCrouch(true);
  player.update(FRAME);
  assert.equal(player.getHitbox(GROUND_Y).y, GROUND_Y - GAME_CONFIG.player.crouchHeight);

  player.setCrouch(false);
  player.update(FRAME);
  player.y = 30;
  assert.equal(player.getHitbox(GROUND_Y).y, GROUND_Y - GAME_CONFIG.player.height - 30);
});

test("reset limpa pulo pendente e agachamento", () => {
  const player = new Player(GAME_CONFIG.player);
  player.queueJump();
  player.setCrouch(true);

  player.reset();
  player.update(FRAME);

  assert.equal(player.y, 0);
  assert.equal(player.isCrouching, false);
});

test("intersects detecta sobreposicao, inclusive contencao", () => {
  assert.equal(intersects(box(0, 0), box(5, 5)), true);
  assert.equal(intersects(box(0, 0, 100, 100), box(10, 10)), true);
});

test("intersects trata bordas encostadas como sem colisao", () => {
  assert.equal(intersects(box(0, 0), box(10, 0)), false);
  assert.equal(intersects(box(0, 0), box(0, 10)), false);
  assert.equal(intersects(box(0, 0), box(50, 50)), false);
});

test("createObstacle gera obstaculo baixo abaixo do vies, com altura e recuo da faixa", () => {
  const obstacle = createObstacle(800, GAME_CONFIG.obstacle, 0.42, () => 0);

  assert.deepEqual(obstacle, {
    type: "low",
    width: GAME_CONFIG.obstacle.minWidth,
    height: GAME_CONFIG.obstacle.minLowHeight,
    yOffset: 28,
    x: 860,
  });
});

test("createObstacle gera obstaculo alto no chao acima do vies", () => {
  const obstacle = createObstacle(800, GAME_CONFIG.obstacle, 0.42, () => 0.5);

  assert.equal(obstacle.type, "tall");
  assert.equal(obstacle.yOffset, 0);
  assert.equal(obstacle.height, 64);
  assert.equal(obstacle.x, 900);
});

test("createObstacle respeita o vies de cada dificuldade", () => {
  const random = () => 0.5;

  assert.equal(
    createObstacle(800, GAME_CONFIG.obstacle, GAME_CONFIG.difficulty.easy.obstacleBias, random).type,
    "tall",
  );
  assert.equal(
    createObstacle(800, GAME_CONFIG.obstacle, GAME_CONFIG.difficulty.hard.obstacleBias, random).type,
    "low",
  );
});

test("createObstacle fica dentro dos limites configurados com o gerador padrao", () => {
  for (let i = 0; i < 200; i += 1) {
    const { width, x } = createObstacle(800, GAME_CONFIG.obstacle);

    assert.ok(width >= GAME_CONFIG.obstacle.minWidth && width < GAME_CONFIG.obstacle.maxWidth);
    assert.ok(x >= 860 && x < 940);
  }
});
