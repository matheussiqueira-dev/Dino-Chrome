export class Player {
  constructor(config) {
    this.config = config;
    this.reset();
  }

  reset() {
    this.x = this.config.x;
    this.y = 0;
    this.velocityY = 0;
    this.isOnGround = true;
    this.isCrouching = false;
    this.jumpQueued = false;
    this.crouchRequested = false;
  }

  queueJump() {
    this.jumpQueued = true;
  }

  setCrouch(active) {
    this.crouchRequested = active;
  }

  update(dt) {
    const frameScale = dt * 60;

    if (this.crouchRequested && this.isOnGround) {
      this.isCrouching = true;
    }

    if (!this.crouchRequested) {
      this.isCrouching = false;
    }

    if (this.jumpQueued && this.isOnGround) {
      this.velocityY = this.config.jumpVelocity;
      this.isOnGround = false;
      this.jumpQueued = false;
    }

    this.velocityY -= this.config.gravity * frameScale;
    this.y += this.velocityY * frameScale;

    if (this.y <= 0) {
      this.y = 0;
      this.velocityY = 0;
      this.isOnGround = true;
    }
  }

  get currentHeight() {
    return this.isCrouching ? this.config.crouchHeight : this.config.height;
  }

  getHitbox(groundY) {
    return {
      x: this.x,
      y: groundY - this.currentHeight - this.y,
      width: this.config.width,
      height: this.currentHeight,
    };
  }
}