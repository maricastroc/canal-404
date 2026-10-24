import * as Phaser from "phaser";
import type { GameHostContext, GameInstance, GameModule } from "@/games/types";
import { H, W } from "./config";
import { BootScene } from "./scenes/BootScene";
import { PlayScene } from "./scenes/PlayScene";

function mount(ctx: GameHostContext): GameInstance {
  ctx.onProgress(0, "art");
  const game = new Phaser.Game({
    type: Phaser.AUTO,
    parent: ctx.parent,
    width: W,
    height: H,
    backgroundColor: "#8fd4f7",
    transparent: false,
    scale: {
      mode: Phaser.Scale.FIT,
      autoCenter: Phaser.Scale.CENTER_BOTH,
    },
    render: { antialias: true, roundPixels: false, powerPreference: "high-performance" },
    input: {
      keyboard: { target: ctx.keyboardTarget },
      touch: { capture: true },
      activePointers: 2,
    },
    physics: {
      default: "matter",
      matter: {
        gravity: { x: 0, y: 1.35 },
        autoUpdate: false,
        enableSleeping: false,
        debug: false,
      },
    },
    banner: false,
    audio: { noAudio: true },
    disableContextMenu: true,
    scene: [BootScene, PlayScene],
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

  const play = () => game.scene.getScene("play") as PlayScene | null;

  return {
    start() {
      play()?.begin();
    },
    pause() {
      if (game.scene.isActive("play")) game.scene.pause("play");
    },
    resume() {
      if (game.scene.isPaused("play")) game.scene.resume("play");
    },
    restart() {
      game.registry.set("autostart", true);
      const scene = play();
      if (game.scene.isPaused("play")) game.scene.resume("play");
      scene?.scene.restart();
    },
    setHighScore(value: number) {
      game.registry.set("highScore", value);
      play()?.setHighScore(value);
    },
    destroy() {
      game.destroy(true);
    },
  };
}

const deadEndStreet: GameModule = { mount };

export default deadEndStreet;
