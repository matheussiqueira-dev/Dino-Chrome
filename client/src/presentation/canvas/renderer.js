import { GAME_CONFIG } from "../../config/game-config.js";
import { randomBetween } from "../../core/math.js";

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

export class CanvasRenderer {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext("2d");
    this.width = 0;
    this.height = 0;
    this.stars = [];
    this.reduceMotion = false;
    this.resizeObserver = null;

    this.handleResize = this.handleResize.bind(this);
    window.addEventListener("resize", this.handleResize);
    this.handleResize();
  }

  destroy() {
    window.removeEventListener("resize", this.handleResize);
  }

  setReducedMotion(enabled) {
    this.reduceMotion = enabled;
    this.buildStars();
  }

  handleResize() {
    const ratio = window.devicePixelRatio || 1;
    const bounds = this.canvas.getBoundingClientRect();

    this.width = Math.max(320, Math.floor(bounds.width));
    this.height = Math.max(300, Math.floor(bounds.height));

    this.canvas.width = Math.floor(this.width * ratio);
    this.canvas.height = Math.floor(this.height * ratio);
    this.ctx.setTransform(ratio, 0, 0, ratio, 0, 0);

    this.buildStars();
  }

  buildStars() {
    const density = this.reduceMotion ? GAME_CONFIG.world.starDensity / 2 : GAME_CONFIG.world.starDensity;
    const count = Math.floor((this.width / density) * 2.5);

    this.stars = Array.from({ length: count }, () => ({
      x: randomBetween(0, this.width),
      y: randomBetween(0, this.height * 0.62),
      size: randomBetween(1.2, 3.3),
      speed: randomBetween(0.12, 0.54),
      alpha: randomBetween(0.3, 0.9),
    }));
  }

  updateParallax(speed, dt) {
    if (this.reduceMotion) {
      return;
    }

    const drift = speed * 0.09 * dt * 60;

    this.stars.forEach((star) => {
      star.x -= drift * star.speed;
      if (star.x < -10) {
        star.x = this.width + randomBetween(0, 40);
        star.y = randomBetween(0, this.height * 0.62);
      }
    });
  }

  getGroundY() {
    return this.height - GAME_CONFIG.canvas.groundHeight;
  }

  render(snapshot) {
    const { player, obstacles, speed } = snapshot;
    const groundY = this.getGroundY();

    this.ctx.clearRect(0, 0, this.width, this.height);
    this.drawSky();
    this.drawStars();
    this.drawGround(groundY, speed);
    this.drawObstacles(obstacles, groundY);
    this.drawPlayer(player, groundY);
  }

  drawSky() {
    const gradient = this.ctx.createLinearGradient(0, 0, 0, this.height);
    gradient.addColorStop(0, "#dce8ff");
    gradient.addColorStop(0.55, "#edf3ff");
    gradient.addColorStop(1, "#f8faff");
    this.ctx.fillStyle = gradient;
    this.ctx.fillRect(0, 0, this.width, this.height);

    const haze = this.ctx.createRadialGradient(this.width * 0.82, this.height * 0.15, 20, this.width * 0.82, this.height * 0.15, 240);
    haze.addColorStop(0, "rgba(255, 205, 160, 0.45)");
    haze.addColorStop(1, "rgba(255, 205, 160, 0)");
    this.ctx.fillStyle = haze;
    this.ctx.fillRect(0, 0, this.width, this.height);
  }

  drawStars() {
    this.ctx.save();
    this.stars.forEach((star) => {
      this.ctx.fillStyle = `rgba(39, 70, 158, ${star.alpha})`;
      this.ctx.beginPath();
      this.ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
      this.ctx.fill();
    });
    this.ctx.restore();
  }

  drawGround(groundY, speed) {
    this.ctx.save();

    const groundGradient = this.ctx.createLinearGradient(0, groundY, 0, this.height);
    groundGradient.addColorStop(0, "#d2e0ff");
    groundGradient.addColorStop(1, "#c0d2fb");
    this.ctx.fillStyle = groundGradient;
    this.ctx.fillRect(0, groundY, this.width, GAME_CONFIG.canvas.groundHeight);

    this.ctx.strokeStyle = "rgba(13, 66, 177, 0.42)";
    this.ctx.lineWidth = 2;
    this.ctx.beginPath();
    this.ctx.moveTo(0, groundY + 10);
    this.ctx.lineTo(this.width, groundY + 10);
    this.ctx.stroke();

    this.ctx.setLineDash([10, 12]);
    this.ctx.strokeStyle = "rgba(255, 142, 60, 0.44)";
    this.ctx.beginPath();
    this.ctx.moveTo(-(performance.now() * 0.04 * speed) % 20, groundY + 34);
    this.ctx.lineTo(this.width, groundY + 34);
    this.ctx.stroke();

    this.ctx.restore();
  }

  drawPlayer(player, groundY) {
    const height = player.currentHeight;
    const y = groundY - height - player.y;

    this.ctx.save();
    this.ctx.fillStyle = "rgba(17, 87, 239, 0.9)";
    roundedRect(this.ctx, player.x, y, GAME_CONFIG.player.width, height, 16);
    this.ctx.fill();

    this.ctx.fillStyle = "rgba(255,255,255,0.98)";
    roundedRect(this.ctx, player.x + 30, y + 14, 12, 10, 4);
    this.ctx.fill();

    this.ctx.fillStyle = "rgba(255, 156, 74, 0.86)";
    roundedRect(this.ctx, player.x - 8, y + height - 12, 14, 8, 4);
    this.ctx.fill();

    this.ctx.restore();
  }

  drawObstacles(obstacles, groundY) {
    this.ctx.save();

    obstacles.forEach((obstacle) => {
      const y = groundY - obstacle.height - obstacle.yOffset;

      this.ctx.fillStyle = obstacle.type === "low" ? "rgba(255, 141, 59, 0.86)" : "rgba(31, 66, 146, 0.75)";
      roundedRect(this.ctx, obstacle.x, y, obstacle.width, obstacle.height, 10);
      this.ctx.fill();

      this.ctx.fillStyle = "rgba(255, 255, 255, 0.5)";
      roundedRect(this.ctx, obstacle.x + 5, y + 6, obstacle.width * 0.24, obstacle.height * 0.18, 5);
      this.ctx.fill();
    });

    this.ctx.restore();
  }
}