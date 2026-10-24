import * as Phaser from "phaser";
import type { GameHostContext, GameInstance, GameModule, StartOptions } from "@/games/types";
import { GRAVITY_Y, H, W } from "./config";
import { LEVELS } from "./levels";
import { BootScene } from "./scenes/BootScene";
import { LabScene } from "./scenes/LabScene";

function mount(ctx: GameHostContext): GameInstance {
  ctx.onProgress(0, "arte");
  const game = new Phaser.Game({
    type: Phaser.AUTO,
    parent: ctx.parent,
    width: W,
    height: H,
    backgroundColor: "#c5bce3",
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
        gravity: { x: 0, y: GRAVITY_Y },
        restingThresh: 2,
        restingThreshTangent: Math.sqrt(6),
        autoUpdate: false,
        enableSleeping: false,
        debug: false,
      },
    },
    banner: false,
    audio: { noAudio: true },
    disableContextMenu: true,
    scene: [BootScene, LabScene],
    callbacks: {
      preBoot: (g) => {
        g.registry.set("ctx", ctx);
        g.registry.set("level", 0);
      },
      postBoot: () => {
        ctx.onProgress(0.05, "arte");
      },
    },
  });

  const lab = () => game.scene.getScene("lab") as LabScene | null;

  const restartScene = () => {
    game.registry.set("autostart", true);
    if (game.scene.isPaused("lab")) game.scene.resume("lab");
    lab()?.scene.restart();
  };

  return {
    start(options?: StartOptions) {
      const level = Phaser.Math.Clamp(options?.level ?? 0, 0, LEVELS.length - 1);
      const scene = lab();
      if (scene && scene.isAttract && scene.currentLevel === level) {
        scene.begin();
        return;
      }
      game.registry.set("level", level);
      restartScene();
    },
    pause() {
      if (game.scene.isActive("lab")) game.scene.pause("lab");
    },
    resume() {
      if (game.scene.isPaused("lab")) game.scene.resume("lab");
    },
    restart() {
      restartScene();
    },
    setHighScore() {},
    destroy() {
      game.destroy(true);
    },
  };
}

const laboratorio: GameModule = { mount };

export default laboratorio;
