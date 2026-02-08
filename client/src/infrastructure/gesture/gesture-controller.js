import { GAME_CONFIG } from "../../config/game-config.js";

function distance(a, b) {
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  return Math.hypot(dx, dy);
}

function classifyGesture(landmarks) {
  const wrist = landmarks[0];
  const middleMcp = landmarks[9];
  const palmSize = distance(wrist, middleMcp);
  const fingers = [
    [8, 5],
    [12, 9],
    [16, 13],
    [20, 17],
  ];

  let extended = 0;

  fingers.forEach(([tip, mcp]) => {
    const tipDistance = distance(landmarks[tip], wrist);
    const mcpDistance = distance(landmarks[mcp], wrist);

    if (tipDistance > mcpDistance + palmSize * 0.2) {
      extended += 1;
    }
  });

  if (extended >= 2) {
    return "open";
  }

  if (extended <= 1) {
    return "closed";
  }

  return "none";
}

export class GestureController {
  constructor() {
    this.buffer = [];
    this.stableGesture = "none";
    this.holdUntil = 0;
    this.lastJumpAt = 0;
    this.stream = null;
    this.cameraRunner = null;
    this.active = false;
    this.onStatus = () => {};
    this.onGesture = () => {};
    this.handsInstance = null;
  }

  setCallbacks(callbacks) {
    this.onStatus = callbacks.onStatus ?? this.onStatus;
    this.onGesture = callbacks.onGesture ?? this.onGesture;
  }

  async start(videoElement) {
    if (this.active) {
      return true;
    }

    if (typeof window.Hands === "undefined") {
      this.onStatus("MediaPipe indisponivel");
      return false;
    }

    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      this.onStatus("Camera nao suportada");
      return false;
    }

    if (!window.isSecureContext) {
      this.onStatus("Camera exige localhost ou https");
      return false;
    }

    try {
      this.onStatus("Inicializando camera");
      this.stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
      videoElement.srcObject = this.stream;
      await videoElement.play();
      this.setupHands(videoElement);
      this.active = true;
      this.onStatus("Camera ativa");
      return true;
    } catch {
      this.stop();
      this.onStatus("Acesso a camera bloqueado");
      return false;
    }
  }

  stop() {
    this.active = false;

    if (this.cameraRunner && typeof this.cameraRunner.stop === "function") {
      this.cameraRunner.stop();
    }

    if (this.stream) {
      this.stream.getTracks().forEach((track) => track.stop());
    }

    this.stream = null;
    this.cameraRunner = null;
    this.handsInstance = null;
    this.buffer = [];
    this.stableGesture = "none";
    this.onGesture("Nenhum");
  }

  setupHands(videoElement) {
    const hands = new window.Hands({
      locateFile(file) {
        return `https://cdn.jsdelivr.net/npm/@mediapipe/hands@0.4/${file}`;
      },
    });

    hands.setOptions({
      maxNumHands: 1,
      modelComplexity: 0,
      minDetectionConfidence: 0.5,
      minTrackingConfidence: 0.5,
    });

    hands.onResults((results) => {
      this.handleResults(results);
    });

    this.handsInstance = hands;

    if (typeof window.Camera !== "undefined") {
      this.cameraRunner = new window.Camera(videoElement, {
        onFrame: async () => {
          await hands.send({ image: videoElement });
        },
        width: 640,
        height: 480,
      });
      this.cameraRunner.start();
      return;
    }

    let lastVideoTime = -1;

    const fallbackLoop = async () => {
      if (!this.active) {
        return;
      }

      if (videoElement.readyState >= 2 && videoElement.currentTime !== lastVideoTime) {
        lastVideoTime = videoElement.currentTime;
        await hands.send({ image: videoElement });
      }

      requestAnimationFrame(fallbackLoop);
    };

    fallbackLoop();
  }

  handleResults(results) {
    if (!results.multiHandLandmarks || results.multiHandLandmarks.length === 0) {
      this.updateBuffer("none");
      this.onStatus("Nenhuma mao detectada");
      return;
    }

    const gesture = classifyGesture(results.multiHandLandmarks[0]);
    this.updateBuffer(gesture);
    this.onStatus("Rastreamento ativo");
  }

  updateBuffer(gesture) {
    this.buffer.push(gesture);
    if (this.buffer.length > 10) {
      this.buffer.shift();
    }

    const counts = this.buffer.reduce(
      (accumulator, item) => {
        accumulator[item] = (accumulator[item] ?? 0) + 1;
        return accumulator;
      },
      { open: 0, closed: 0, none: 0 }
    );

    let candidate = "none";

    if (counts.open >= GAME_CONFIG.gesture.stableThreshold) {
      candidate = "open";
    } else if (counts.closed >= GAME_CONFIG.gesture.stableThreshold) {
      candidate = "closed";
    } else if (counts.none >= 6) {
      candidate = "none";
    }

    const now = performance.now();

    if (candidate !== "none") {
      this.stableGesture = candidate;
      this.holdUntil = now + GAME_CONFIG.gesture.holdMs;
    } else if (now >= this.holdUntil) {
      this.stableGesture = "none";
    }

    if (this.stableGesture === "open") {
      this.onGesture("Mao aberta");
    } else if (this.stableGesture === "closed") {
      this.onGesture("Mao fechada");
    } else {
      this.onGesture("Nenhum");
    }
  }

  consumeJumpSignal(playerIsOnGround) {
    if (!this.active || this.stableGesture !== "open" || !playerIsOnGround) {
      return false;
    }

    const now = performance.now();

    if (now - this.lastJumpAt <= GAME_CONFIG.gesture.jumpCooldownMs) {
      return false;
    }

    this.lastJumpAt = now;
    return true;
  }

  isCrouchSignal() {
    return this.active && this.stableGesture === "closed";
  }
}