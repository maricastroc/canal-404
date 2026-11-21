import * as Phaser from "phaser";

export class NightUiScene extends Phaser.Scene {
  constructor() {
    super({ key: "night-ui", active: true });
  }

  reset() {
    this.tweens.killAll();
    this.time.removeAllEvents();
    this.children.removeAll(true);
  }
}
