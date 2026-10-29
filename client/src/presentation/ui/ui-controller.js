import { toLeaderboardRows } from "../../domain/local-leaderboard.js";

export class UIController {
  constructor() {
    this.elements = {
      score: document.getElementById("score-value"),
      best: document.getElementById("best-value"),
      status: document.getElementById("status-value"),
      gesture: document.getElementById("gesture-value"),
      finalScore: document.getElementById("final-score"),
      startScreen: document.getElementById("start-screen"),
      gameOverScreen: document.getElementById("gameover-screen"),
      pauseBadge: document.getElementById("pause-badge"),
      startKeyboardButton: document.getElementById("start-keyboard-btn"),
      startCameraButton: document.getElementById("start-camera-btn"),
      restartButton: document.getElementById("restart-btn"),
      saveScoreButton: document.getElementById("save-score-btn"),
      refreshLeaderboardButton: document.getElementById("refresh-leaderboard-btn"),
      leaderboardList: document.getElementById("leaderboard-list"),
      playerNameInput: document.getElementById("player-name"),
      difficultySelect: document.getElementById("difficulty"),
      highContrastToggle: document.getElementById("high-contrast-toggle"),
      reducedMotionToggle: document.getElementById("reduced-motion-toggle"),
      cameraVideo: document.getElementById("camera-preview"),
    };

    this.previousText = new Map();
  }

  bindEvents(handlers) {
    this.elements.startKeyboardButton.addEventListener("click", handlers.onStartKeyboard);
    this.elements.startCameraButton.addEventListener("click", handlers.onStartCamera);
    this.elements.restartButton.addEventListener("click", handlers.onRestart);
    this.elements.saveScoreButton.addEventListener("click", handlers.onSaveScore);
    this.elements.refreshLeaderboardButton.addEventListener("click", handlers.onRefreshLeaderboard);

    this.elements.highContrastToggle.addEventListener("change", (event) => {
      handlers.onToggleHighContrast(Boolean(event.target.checked));
    });

    this.elements.reducedMotionToggle.addEventListener("change", (event) => {
      handlers.onToggleReducedMotion(Boolean(event.target.checked));
    });
  }

  setScore(score) {
    this.setText(this.elements.score, String(Math.floor(score)));
  }

  setBestScore(bestScore) {
    this.setText(this.elements.best, String(Math.floor(bestScore)));
  }

  setStatus(status) {
    this.setText(this.elements.status, status);
  }

  setGesture(gesture) {
    this.setText(this.elements.gesture, gesture);
  }

  showStart() {
    this.elements.startScreen.classList.remove("hidden");
  }

  hideStart() {
    this.elements.startScreen.classList.add("hidden");
  }

  showGameOver(score) {
    this.elements.finalScore.textContent = String(Math.floor(score));
    this.elements.gameOverScreen.classList.remove("hidden");
  }

  hideGameOver() {
    this.elements.gameOverScreen.classList.add("hidden");
    this.setSaveButtonLoading(false);
  }

  setPauseBadge(visible) {
    this.elements.pauseBadge.classList.toggle("hidden", !visible);
  }

  setSaveButtonLoading(isLoading) {
    this.elements.saveScoreButton.disabled = isLoading;
    this.elements.saveScoreButton.textContent = isLoading ? "Salvando..." : "Salvar no ranking";
  }

  renderLeaderboard(entries) {
    const list = this.elements.leaderboardList;
    list.replaceChildren();

    const rows = entries.length
      ? toLeaderboardRows(entries)
      : [{ rank: "-", name: "Sem scores", meta: "Jogue para entrar no ranking", score: "0" }];

    rows.forEach((row) => {
      const item = document.createElement("li");
      item.className = "leaderboard-item";

      const rank = document.createElement("span");
      rank.className = "rank";
      rank.textContent = row.rank;

      const details = document.createElement("div");
      const name = document.createElement("div");
      name.className = "name";
      name.textContent = row.name;
      const meta = document.createElement("div");
      meta.className = "meta";
      meta.textContent = row.meta;
      details.append(name, meta);

      const score = document.createElement("strong");
      score.className = "score";
      score.textContent = row.score;

      item.append(rank, details, score);
      list.appendChild(item);
    });
  }

  getStartOptions() {
    return {
      playerName: this.elements.playerNameInput.value.trim(),
      difficulty: this.elements.difficultySelect.value,
      highContrast: this.elements.highContrastToggle.checked,
      reducedMotion: this.elements.reducedMotionToggle.checked,
    };
  }

  setStartOptions(options) {
    this.elements.playerNameInput.value = options.playerName;
    this.elements.highContrastToggle.checked = options.highContrast;
    this.elements.reducedMotionToggle.checked = options.reducedMotion;
  }

  applyHighContrast(enabled) {
    document.body.classList.toggle("theme-high-contrast", enabled);
  }

  applyReducedMotion(enabled) {
    document.body.classList.toggle("reduce-motion", enabled);
  }

  getCameraVideoElement() {
    return this.elements.cameraVideo;
  }

  setText(element, value) {
    if (this.previousText.get(element) === value) {
      return;
    }

    this.previousText.set(element, value);
    element.textContent = value;
  }
}