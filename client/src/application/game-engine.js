import { GAME_CONFIG, CONTROL_MODE } from "../config/game-config.js";
import { clamp, randomBetween } from "../core/math.js";
import { createObstacle } from "../domain/obstacle-factory.js";
import { intersects } from "../domain/collision.js";
import { Player } from "../domain/player.js";

export class GameEngine {
  constructor({ renderer, ui, keyboardInput, gestureController, leaderboardApi, prefsStore }) {
    this.renderer = renderer;
    this.ui = ui;
    this.keyboardInput = keyboardInput;
    this.gestureController = gestureController;
    this.leaderboardApi = leaderboardApi;
    this.prefsStore = prefsStore;

    this.player = new Player(GAME_CONFIG.player);
    this.animationFrameId = null;
    this.loopBound = this.loop.bind(this);

    this.state = {
      running: false,
      paused: false,
      ended: false,
      score: 0,
      bestScore: 0,
      speed: GAME_CONFIG.difficulty.normal.speed,
      spawnTimer: 0,
      obstacles: [],
      difficulty: "normal",
      controlMode: CONTROL_MODE.KEYBOARD,
      playerName: "Player",
      startedAt: 0,
      lastTime: 0,
    };
  }

  async init() {
    this.keyboardInput.attach();

    this.gestureController.setCallbacks({
      onStatus: (status) => this.ui.setStatus(status),
      onGesture: (gesture) => this.ui.setGesture(gesture),
    });

    const highContrast = this.prefsStore.getHighContrast();
    const reducedMotion = this.prefsStore.getReducedMotion();
    const playerName = this.prefsStore.getPlayerName();
    this.state.bestScore = this.prefsStore.getBestScore();

    this.ui.setStartOptions({
      playerName,
      highContrast,
      reducedMotion,
    });

    this.ui.applyHighContrast(highContrast);
    this.ui.applyReducedMotion(reducedMotion);
    this.renderer.setReducedMotion(reducedMotion);

    this.ui.setBestScore(this.state.bestScore);
    this.ui.setStatus("Pronto");
    this.ui.setGesture("Nenhum");
    this.ui.setScore(0);

    this.ui.bindEvents({
      onStartKeyboard: () => this.start(CONTROL_MODE.KEYBOARD),
      onStartCamera: () => this.start(CONTROL_MODE.GESTURE),
      onRestart: () => this.restart(),
      onSaveScore: () => this.saveScore(),
      onRefreshLeaderboard: () => this.refreshLeaderboard(),
      onToggleHighContrast: (enabled) => this.handleHighContrastChange(enabled),
      onToggleReducedMotion: (enabled) => this.handleReducedMotionChange(enabled),
    });

    await this.refreshLeaderboard();
  }

  handleHighContrastChange(enabled) {
    this.ui.applyHighContrast(enabled);
    this.prefsStore.setHighContrast(enabled);
  }

  handleReducedMotionChange(enabled) {
    this.ui.applyReducedMotion(enabled);
    this.renderer.setReducedMotion(enabled);
    this.prefsStore.setReducedMotion(enabled);
  }

  async start(requestedMode) {
    const options = this.ui.getStartOptions();

    this.state.playerName = options.playerName || "Player";
    this.prefsStore.setPlayerName(this.state.playerName);

    this.handleHighContrastChange(options.highContrast);
    this.handleReducedMotionChange(options.reducedMotion);

    let controlMode = requestedMode;

    if (requestedMode === CONTROL_MODE.GESTURE) {
      const cameraStarted = await this.gestureController.start(this.ui.getCameraVideoElement());

      if (!cameraStarted) {
        controlMode = CONTROL_MODE.KEYBOARD;
        this.ui.setStatus("Camera indisponivel. Teclado ativo");
      }
    } else {
      this.gestureController.stop();
      this.ui.setGesture("Nenhum");
      this.ui.setStatus("Controle por teclado");
    }

    this.resetRuntime({
      controlMode,
      difficulty: options.difficulty,
    });

    this.ui.hideStart();
    this.ui.hideGameOver();
    this.ui.setPauseBadge(false);

    this.state.running = true;
    this.state.paused = false;
    this.state.ended = false;
    this.state.startedAt = performance.now();
    this.state.lastTime = this.state.startedAt;

    if (controlMode === CONTROL_MODE.GESTURE) {
      this.ui.setStatus("Controle por gestos ativo");
    }

    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
    }

    this.animationFrameId = requestAnimationFrame(this.loopBound);
  }

  async restart() {
    if (!this.state.ended) {
      return;
    }

    await this.start(this.state.controlMode);
  }

  resetRuntime({ controlMode, difficulty }) {
    const profile = GAME_CONFIG.difficulty[difficulty] ?? GAME_CONFIG.difficulty.normal;

    this.state.controlMode = controlMode;
    this.state.difficulty = difficulty;
    this.state.score = 0;
    this.state.speed = profile.speed;
    this.state.obstacles = [];
    this.state.spawnTimer = randomBetween(GAME_CONFIG.obstacle.spawnMin, GAME_CONFIG.obstacle.spawnMax);

    this.player.reset();
    this.ui.setScore(0);
  }

  loop(timestamp) {
    if (!this.state.running) {
      return;
    }

    if (this.keyboardInput.consumePauseToggle()) {
      this.togglePause();
    }

    const deltaSeconds = Math.min((timestamp - this.state.lastTime) / 1000, 0.035);
    this.state.lastTime = timestamp;

    if (!this.state.paused) {
      this.update(deltaSeconds);
    }

    this.render();
    this.animationFrameId = requestAnimationFrame(this.loopBound);
  }

  togglePause() {
    if (!this.state.running || this.state.ended) {
      return;
    }

    this.state.paused = !this.state.paused;
    this.ui.setPauseBadge(this.state.paused);
    this.ui.setStatus(this.state.paused ? "Jogo pausado" : "Jogo em execucao");
  }

  update(dt) {
    this.consumeInputs();

    const difficultyProfile = GAME_CONFIG.difficulty[this.state.difficulty] ?? GAME_CONFIG.difficulty.normal;
    this.state.score += dt * GAME_CONFIG.scoring.pointsPerSecond * difficultyProfile.scoreMultiplier;
    this.ui.setScore(this.state.score);

    this.state.speed = clamp(
      this.state.speed + GAME_CONFIG.world.speedIncrease * dt * 60,
      difficultyProfile.speed,
      GAME_CONFIG.world.speedCap
    );

    this.player.update(dt);

    this.state.spawnTimer -= dt;
    if (this.state.spawnTimer <= 0) {
      this.state.obstacles.push(
        createObstacle(this.renderer.width, GAME_CONFIG.obstacle, difficultyProfile.obstacleBias)
      );

      const speedFactor = (this.state.speed - difficultyProfile.speed) / (GAME_CONFIG.world.speedCap - difficultyProfile.speed + 0.001);
      const minSpawn = GAME_CONFIG.obstacle.spawnMin * clamp(1 - speedFactor * 0.5, 0.58, 1.15);
      const maxSpawn = GAME_CONFIG.obstacle.spawnMax * clamp(1 - speedFactor * 0.4, 0.64, 1.2);
      this.state.spawnTimer = randomBetween(minSpawn, maxSpawn);
    }

    const displacement = this.state.speed * dt * 60;
    this.state.obstacles.forEach((obstacle) => {
      obstacle.x -= displacement;
    });
    this.state.obstacles = this.state.obstacles.filter((obstacle) => obstacle.x + obstacle.width > -40);

    this.renderer.updateParallax(this.state.speed, dt);

    this.checkCollision();
  }

  consumeInputs() {
    const isKeyboardMode = this.state.controlMode === CONTROL_MODE.KEYBOARD;

    if (this.keyboardInput.consumeJump()) {
      this.player.queueJump();
    }

    if (isKeyboardMode) {
      this.player.setCrouch(this.keyboardInput.isCrouching());
      return;
    }

    const crouchSignal = this.gestureController.isCrouchSignal();
    this.player.setCrouch(crouchSignal || this.keyboardInput.isCrouching());

    if (this.gestureController.consumeJumpSignal(this.player.isOnGround)) {
      this.player.queueJump();
    }
  }

  checkCollision() {
    const groundY = this.renderer.getGroundY();
    const playerHitbox = this.player.getHitbox(groundY);

    for (const obstacle of this.state.obstacles) {
      const obstacleHitbox = {
        x: obstacle.x,
        y: groundY - obstacle.height - obstacle.yOffset,
        width: obstacle.width,
        height: obstacle.height,
      };

      if (intersects(playerHitbox, obstacleHitbox)) {
        this.finishGame();
        break;
      }
    }
  }

  finishGame() {
    this.state.running = false;
    this.state.paused = false;
    this.state.ended = true;

    const finalScore = Math.floor(this.state.score);
    if (finalScore > this.state.bestScore) {
      this.state.bestScore = finalScore;
      this.prefsStore.setBestScore(finalScore);
      this.ui.setBestScore(finalScore);
    }

    this.ui.setPauseBadge(false);
    this.ui.setStatus("Partida encerrada");
    this.ui.showGameOver(finalScore);
  }

  render() {
    this.renderer.render({
      player: this.player,
      obstacles: this.state.obstacles,
      speed: this.state.speed,
    });
  }

  async saveScore() {
    if (!this.state.ended) {
      return;
    }

    this.ui.setSaveButtonLoading(true);

    try {
      await this.leaderboardApi.submitScore({
        playerName: this.state.playerName,
        score: Math.floor(this.state.score),
        difficulty: this.state.difficulty,
        controlMode: this.state.controlMode,
        durationMs: Math.floor(performance.now() - this.state.startedAt),
      });

      this.ui.setStatus("Score salvo no ranking");
      await this.refreshLeaderboard();
    } catch (error) {
      this.ui.setStatus(`Falha ao salvar score: ${error.message}`);
    } finally {
      this.ui.setSaveButtonLoading(false);
    }
  }

  async refreshLeaderboard() {
    try {
      const data = await this.leaderboardApi.getLeaderboard(10);
      this.ui.renderLeaderboard(data.entries ?? []);
    } catch (error) {
      this.ui.setStatus(`Ranking indisponivel: ${error.message}`);
      this.ui.renderLeaderboard([]);
    }
  }
}