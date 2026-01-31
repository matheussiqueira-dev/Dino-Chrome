const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");

const ui = {
  score: document.getElementById("score"),
  finalScore: document.getElementById("final-score"),
  gesture: document.getElementById("gesture"),
  status: document.getElementById("status"),
  startScreen: document.getElementById("start-screen"),
  gameoverScreen: document.getElementById("gameover-screen"),
  startCamera: document.getElementById("start-camera"),
  startKeyboard: document.getElementById("start-keyboard"),
  restart: document.getElementById("restart"),
  cameraPanel: document.getElementById("camera-panel"),
  cameraVideo: document.getElementById("camera"),
};

const config = {
  gravity: 0.9,
  jumpVelocity: 15,
  groundHeight: 120,
  speed: 5,
  speedCap: 11.5,
  speedIncrease: 0.0025,
  spawnMin: 2.3,
  spawnMax: 3.6,
  scoreRate: 10,
};

const state = {
  running: false,
  lastTime: 0,
  score: 0,
  best: 0,
  speed: config.speed,
  spawnTimer: 0,
  obstacles: [],
  stars: [],
  usingCamera: false,
  cameraRunner: null,
};

const player = {
  x: 140,
  y: 0,
  width: 56,
  height: 78,
  crouchHeight: 52,
  vy: 0,
  onGround: true,
  isCrouching: false,
};

const gestureState = {
  raw: "none",
  stable: "none",
  buffer: [],
  lastStable: "none",
  holdUntil: 0,
  lastJumpAt: 0,
  jumpCooldown: 450,
};

const inputState = {
  jumpQueued: false,
  crouchActive: false,
};

function resizeCanvas() {
  const ratio = window.devicePixelRatio || 1;
  canvas.width = Math.floor(window.innerWidth * ratio);
  canvas.height = Math.floor(window.innerHeight * ratio);
  canvas.style.width = `${window.innerWidth}px`;
  canvas.style.height = `${window.innerHeight}px`;
  ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
  initStars();
}

window.addEventListener("resize", resizeCanvas);
resizeCanvas();

function initStars() {
  const count = Math.floor(window.innerWidth / 20);
  state.stars = Array.from({ length: count }, () => ({
    x: Math.random() * window.innerWidth,
    y: Math.random() * window.innerHeight * 0.5,
    r: Math.random() * 1.5 + 0.5,
    speed: Math.random() * 0.4 + 0.2,
  }));
}

function rand(min, max) {
  return Math.random() * (max - min) + min;
}

function resetGame() {
  state.score = 0;
  state.speed = config.speed;
  state.spawnTimer = rand(config.spawnMin, config.spawnMax);
  state.obstacles = [];
  gestureState.buffer = [];
  gestureState.raw = "none";
  gestureState.stable = "none";
  gestureState.lastStable = "none";
  player.y = 0;
  player.vy = 0;
  player.onGround = true;
  player.isCrouching = false;
  inputState.jumpQueued = false;
  inputState.crouchActive = false;
  updateGestureUI("Aguardando");
}

function startGame() {
  if (state.running) {
    return;
  }
  resetGame();
  state.running = true;
  state.lastTime = performance.now();
  ui.gameoverScreen.classList.add("hidden");
  ui.startScreen.classList.add("hidden");
  requestAnimationFrame(loop);
}

function endGame() {
  state.running = false;
  ui.finalScore.textContent = Math.floor(state.score).toString();
  ui.gameoverScreen.classList.remove("hidden");
}

function loop(timestamp) {
  if (!state.running) {
    return;
  }
  const dt = Math.min((timestamp - state.lastTime) / 1000, 0.033);
  state.lastTime = timestamp;
  update(dt);
  render();
  requestAnimationFrame(loop);
}

function update(dt) {
  state.score += dt * config.scoreRate;
  ui.score.textContent = Math.floor(state.score).toString();
  state.speed = Math.min(config.speedCap, state.speed + config.speedIncrease * dt * 60);

  updateGestureInput();

  state.spawnTimer -= dt;
  if (state.spawnTimer <= 0) {
    spawnObstacle();
    const difficultyFactor = 1 - (state.speed - config.speed) / (config.speedCap - config.speed + 0.01);
    state.spawnTimer = rand(config.spawnMin * difficultyFactor, config.spawnMax * difficultyFactor);
  }

  updatePlayer(dt);
  updateObstacles(dt);
  updateStars(dt);
  checkCollisions();
}

function updatePlayer(dt) {
  const frameScale = dt * 60;
  if (inputState.crouchActive && player.onGround) {
    player.isCrouching = true;
  } else if (!inputState.crouchActive) {
    player.isCrouching = false;
  }

  if (inputState.jumpQueued && player.onGround) {
    player.vy = config.jumpVelocity;
    player.onGround = false;
    inputState.jumpQueued = false;
  }

  player.vy -= config.gravity * frameScale;
  player.y += player.vy * frameScale;

  if (player.y <= 0) {
    player.y = 0;
    player.vy = 0;
    player.onGround = true;
  }
}

function spawnObstacle() {
  const type = Math.random() < 0.35 ? "low" : "high";
  const width = rand(30, 50);
  let height = rand(40, 70);
  let yOffset = 0;

  if (type === "low") {
    height = rand(26, 36);
    yOffset = rand(32, 46);
  }

  state.obstacles.push({
    x: window.innerWidth + rand(40, 120),
    width,
    height,
    yOffset,
    type,
  });
}

function updateObstacles(dt) {
  const speed = state.speed * dt * 60;
  state.obstacles.forEach((obs) => {
    obs.x -= speed;
  });
  state.obstacles = state.obstacles.filter((obs) => obs.x + obs.width > -40);
}

function updateStars(dt) {
  const drift = state.speed * 0.08 * dt * 60;
  state.stars.forEach((star) => {
    star.x -= drift * star.speed;
    if (star.x < -10) {
      star.x = window.innerWidth + rand(0, 40);
      star.y = Math.random() * window.innerHeight * 0.55;
    }
  });
}

function checkCollisions() {
  const groundY = window.innerHeight - config.groundHeight;
  const playerHeight = player.isCrouching ? player.crouchHeight : player.height;
  const playerBox = {
    x: player.x,
    y: groundY - playerHeight - player.y,
    w: player.width,
    h: playerHeight,
  };

  for (const obs of state.obstacles) {
    const obsBox = {
      x: obs.x,
      y: groundY - obs.height - obs.yOffset,
      w: obs.width,
      h: obs.height,
    };
    const hit =
      playerBox.x < obsBox.x + obsBox.w &&
      playerBox.x + playerBox.w > obsBox.x &&
      playerBox.y < obsBox.y + obsBox.h &&
      playerBox.y + playerBox.h > obsBox.y;

    if (hit) {
      endGame();
      break;
    }
  }
}

function render() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  drawStars();
  drawGround();
  drawObstacles();
  drawPlayer();
}

function drawStars() {
  ctx.save();
  ctx.fillStyle = "rgba(255,255,255,0.7)";
  state.stars.forEach((star) => {
    ctx.beginPath();
    ctx.arc(star.x, star.y, star.r, 0, Math.PI * 2);
    ctx.fill();
  });
  ctx.restore();
}

function drawGround() {
  const groundY = window.innerHeight - config.groundHeight;
  ctx.save();
  const gradient = ctx.createLinearGradient(0, groundY, 0, window.innerHeight);
  gradient.addColorStop(0, "rgba(12, 20, 36, 0.95)");
  gradient.addColorStop(1, "rgba(7, 10, 18, 0.98)");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, groundY, window.innerWidth, config.groundHeight);

  ctx.strokeStyle = "rgba(255, 138, 61, 0.4)";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(0, groundY + 12);
  ctx.lineTo(window.innerWidth, groundY + 12);
  ctx.stroke();

  ctx.strokeStyle = "rgba(41, 214, 200, 0.25)";
  ctx.setLineDash([12, 18]);
  ctx.beginPath();
  ctx.moveTo(0, groundY + 38);
  ctx.lineTo(window.innerWidth, groundY + 38);
  ctx.stroke();
  ctx.restore();
}

function drawPlayer() {
  const groundY = window.innerHeight - config.groundHeight;
  const height = player.isCrouching ? player.crouchHeight : player.height;
  const width = player.width;
  const x = player.x;
  const y = groundY - height - player.y;

  ctx.save();
  ctx.fillStyle = "rgba(41, 214, 200, 0.9)";
  roundedRect(ctx, x, y, width, height, 14);
  ctx.fill();

  ctx.fillStyle = "rgba(255,255,255,0.9)";
  ctx.fillRect(x + width * 0.6, y + height * 0.2, 6, 6);
  ctx.restore();
}

function drawObstacles() {
  const groundY = window.innerHeight - config.groundHeight;
  ctx.save();
  state.obstacles.forEach((obs) => {
    const x = obs.x;
    const y = groundY - obs.height - obs.yOffset;
    ctx.fillStyle = obs.type === "low" ? "rgba(255, 138, 61, 0.8)" : "rgba(230, 236, 242, 0.75)";
    roundedRect(ctx, x, y, obs.width, obs.height, 10);
    ctx.fill();
  });
  ctx.restore();
}

function roundedRect(context, x, y, width, height, radius) {
  const r = Math.min(radius, width / 2, height / 2);
  context.beginPath();
  context.moveTo(x + r, y);
  context.arcTo(x + width, y, x + width, y + height, r);
  context.arcTo(x + width, y + height, x, y + height, r);
  context.arcTo(x, y + height, x, y, r);
  context.arcTo(x, y, x + width, y, r);
  context.closePath();
}

function updateGestureInput() {
  if (!state.usingCamera) {
    return;
  }
  const now = performance.now();
  if (gestureState.stable === "closed") {
    inputState.crouchActive = true;
  } else {
    inputState.crouchActive = false;
  }

  if (
    gestureState.stable === "open" &&
    player.onGround &&
    now - gestureState.lastJumpAt > gestureState.jumpCooldown
  ) {
    inputState.jumpQueued = true;
    gestureState.lastJumpAt = now;
  }
  gestureState.lastStable = gestureState.stable;
}

function updateGestureUI(label) {
  ui.gesture.textContent = label;
}

async function startCamera() {
  const hasMediaPipe = typeof Hands !== "undefined";
  if (!hasMediaPipe) {
    ui.status.textContent = "MediaPipe indisponivel";
    return false;
  }
  if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
    ui.status.textContent = "Camera nao suportada";
    return false;
  }
  if (!window.isSecureContext) {
    ui.status.textContent = "Acesso a camera requer https ou localhost";
    return false;
  }
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
    ui.cameraVideo.srcObject = stream;
    await ui.cameraVideo.play();
    setupHands();
    state.usingCamera = true;
    ui.status.textContent = "Camera ativa";
    return true;
  } catch (err) {
    ui.status.textContent = "Camera bloqueada";
    state.usingCamera = false;
    return false;
  }
}

function setupHands() {
  const hands = new Hands({
    locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/hands@0.4/${file}`,
  });
  hands.setOptions({
    maxNumHands: 1,
    modelComplexity: 0,
    minDetectionConfidence: 0.5,
    minTrackingConfidence: 0.5,
  });
  hands.onResults(onHandsResults);

  if (typeof Camera !== "undefined") {
    state.cameraRunner = new Camera(ui.cameraVideo, {
      onFrame: async () => {
        await hands.send({ image: ui.cameraVideo });
      },
      width: 640,
      height: 480,
    });
    state.cameraRunner.start();
    return;
  }

  let lastVideoTime = -1;
  const processFrame = async () => {
    if (!state.usingCamera) {
      return;
    }
    if (ui.cameraVideo.readyState < 2) {
      requestAnimationFrame(processFrame);
      return;
    }
    if (ui.cameraVideo.currentTime === lastVideoTime) {
      requestAnimationFrame(processFrame);
      return;
    }
    lastVideoTime = ui.cameraVideo.currentTime;
    await hands.send({ image: ui.cameraVideo });
    requestAnimationFrame(processFrame);
  };
  processFrame();
}

function onHandsResults(results) {
  if (!results.multiHandLandmarks || results.multiHandLandmarks.length === 0) {
    gestureState.raw = "none";
    ui.status.textContent = "Sem mao";
    updateGestureBuffer("none");
    return;
  }

  const landmarks = results.multiHandLandmarks[0];
  const gesture = classifyGesture(landmarks);
  gestureState.raw = gesture;
  ui.status.textContent = "Detectando";
  updateGestureBuffer(gesture);
}

function updateGestureBuffer(gesture) {
  const buffer = gestureState.buffer;
  buffer.push(gesture);
  if (buffer.length > 10) {
    buffer.shift();
  }
  const counts = buffer.reduce(
    (acc, value) => {
      acc[value] = (acc[value] || 0) + 1;
      return acc;
    },
    { open: 0, closed: 0, none: 0 }
  );

  let candidate = "none";
  if (counts.open >= 4) {
    candidate = "open";
  } else if (counts.closed >= 4) {
    candidate = "closed";
  } else if (counts.none >= 6) {
    candidate = "none";
  }

  const now = performance.now();
  if (candidate === "open" || candidate === "closed") {
    gestureState.stable = candidate;
    gestureState.holdUntil = now + 350;
  } else if (now >= gestureState.holdUntil) {
    gestureState.stable = "none";
  }

  if (gestureState.stable === "open") {
    updateGestureUI("Mao aberta");
  } else if (gestureState.stable === "closed") {
    updateGestureUI("Mao fechada");
  } else {
    updateGestureUI("Nenhum");
  }
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
    const tipDist = distance(landmarks[tip], wrist);
    const mcpDist = distance(landmarks[mcp], wrist);
    if (tipDist > mcpDist + palmSize * 0.2) {
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

function distance(a, b) {
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  return Math.hypot(dx, dy);
}

ui.startCamera.addEventListener("click", async () => {
  ui.status.textContent = "Inicializando";
  const ok = await startCamera();
  if (!ok) {
    ui.status.textContent = "Use teclado (camera indisponivel)";
  }
  startGame();
});

ui.startKeyboard.addEventListener("click", () => {
  state.usingCamera = false;
  ui.cameraPanel.style.display = "none";
  ui.status.textContent = "Controle por teclado";
  startGame();
});

ui.restart.addEventListener("click", () => {
  startGame();
});

window.addEventListener("keydown", (event) => {
  if (event.code === "Space" || event.code === "ArrowUp") {
    inputState.jumpQueued = true;
  }
  if (event.code === "ArrowDown") {
    inputState.crouchActive = true;
  }
});

window.addEventListener("keyup", (event) => {
  if (event.code === "ArrowDown") {
    inputState.crouchActive = false;
  }
});

updateGestureUI("Aguardando");
