import * as Phaser from "phaser";
import type { GameHostContext, GameInstance, GameModule } from "@/games/types";
import { H, W } from "./config";
import { BootScene } from "./scenes/BootScene";
import { LunchScene } from "./scenes/LunchScene";

function mount(ctx: GameHostContext): GameInstance {
  ctx.onProgress(0, "art");
  const game = new Phaser.Game({
    type: Phaser.AUTO,
    parent: ctx.parent,
    width: W,
    height: H,
    backgroundColor: "#c8eadf",
    transparent: false,
    scale: {
      mode: Phaser.Scale.FIT,
      autoCenter: Phaser.Scale.CENTER_BOTH,
    },
    render: { antialias: true, roundPixels: false, powerPreference: "high-performance" },
    input: {
      keyboard: { target: ctx.keyboardTarget },
      touch: { capture: true },
      activePointers: 3,
    },
    banner: false,
    audio: { noAudio: true },
    disableContextMenu: true,
    scene: [BootScene, LunchScene],
    callbacks: {
      preBoot: (g) => {
        g.registry.set("ctx", ctx);
        g.registry.set("highScore", ctx.highScore);
      },
      postBoot: () => {
        ctx.onProgress(0.05, "art");
      },
    },
  });

  const lunch = () => game.scene.getScene("lunch") as LunchScene | null;

  return {
    start() {
      lunch()?.begin();
    },
    pause() {
      if (game.scene.isActive("lunch")) game.scene.pause("lunch");
    },
    resume() {
      if (game.scene.isPaused("lunch")) game.scene.resume("lunch");
    },
    restart() {
      game.registry.set("autostart", true);
      if (game.scene.isPaused("lunch")) game.scene.resume("lunch");
      lunch()?.scene.restart();
    },
    setHighScore(value: number) {
      game.registry.set("highScore", value);
      lunch()?.setHighScore(value);
    },
    destroy() {
      game.destroy(true);
    },
  };
}

const foodFight: GameModule = { mount };

export default foodFight;
