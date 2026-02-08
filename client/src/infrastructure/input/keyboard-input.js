export class KeyboardInput {
  constructor() {
    this.jumpRequested = false;
    this.crouchActive = false;
    this.pauseRequested = false;
    this.boundKeyDown = this.onKeyDown.bind(this);
    this.boundKeyUp = this.onKeyUp.bind(this);
    this.attached = false;
  }

  attach() {
    if (this.attached) {
      return;
    }

    window.addEventListener("keydown", this.boundKeyDown);
    window.addEventListener("keyup", this.boundKeyUp);
    this.attached = true;
  }

  detach() {
    if (!this.attached) {
      return;
    }

    window.removeEventListener("keydown", this.boundKeyDown);
    window.removeEventListener("keyup", this.boundKeyUp);
    this.attached = false;
  }

  onKeyDown(event) {
    if (event.code === "Space" || event.code === "ArrowUp") {
      this.jumpRequested = true;
      event.preventDefault();
    }

    if (event.code === "ArrowDown") {
      this.crouchActive = true;
      event.preventDefault();
    }

    if (event.code === "KeyP" || event.code === "Escape") {
      this.pauseRequested = true;
    }
  }

  onKeyUp(event) {
    if (event.code === "ArrowDown") {
      this.crouchActive = false;
      event.preventDefault();
    }
  }

  consumeJump() {
    const requested = this.jumpRequested;
    this.jumpRequested = false;
    return requested;
  }

  consumePauseToggle() {
    const requested = this.pauseRequested;
    this.pauseRequested = false;
    return requested;
  }

  isCrouching() {
    return this.crouchActive;
  }
}