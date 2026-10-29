import { GameEngine } from "./application/game-engine.js";
import { prefsStore } from "./core/prefs-store.js";
import { LeaderboardApi } from "./infrastructure/api/leaderboard-api.js";
import { ResilientLeaderboard } from "./infrastructure/api/resilient-leaderboard.js";
import { GestureController } from "./infrastructure/gesture/gesture-controller.js";
import { KeyboardInput } from "./infrastructure/input/keyboard-input.js";
import { LocalLeaderboardStore } from "./infrastructure/storage/local-leaderboard-store.js";
import { CanvasRenderer } from "./presentation/canvas/renderer.js";
import { UIController } from "./presentation/ui/ui-controller.js";

const ui = new UIController();
const canvas = document.getElementById("game-canvas");
const renderer = new CanvasRenderer(canvas);
const keyboardInput = new KeyboardInput();
const gestureController = new GestureController();
function getLocalStorage() {
  try {
    return window.localStorage;
  } catch {
    return null;
  }
}

const leaderboardApi = new ResilientLeaderboard({
  remote: new LeaderboardApi("/api/v1"),
  local: new LocalLeaderboardStore(getLocalStorage()),
});

const gameEngine = new GameEngine({
  renderer,
  ui,
  keyboardInput,
  gestureController,
  leaderboardApi,
  prefsStore,
});

gameEngine.init();