import * as Phaser from "phaser";
import { NIGHT_UI_RESET } from "./phoneNotebook";

export class NightUiScene extends Phaser.Scene {
  constructor() {
    super({ key: "night-ui", active: true });
  }

  reset() {
    this.events.emit(NIGHT_UI_RESET);
    this.tweens.killAll();
    this.time.removeAllEvents();
    this.children.removeAll(true);
  }
}
