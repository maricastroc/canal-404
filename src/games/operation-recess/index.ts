import * as Phaser from "phaser";
import type { GameHostContext, GameInstance, GameModule, StartOptions } from "@/games/types";
import { GRAVITY, H, W } from "./config";
import { LEVELS } from "./levels";
import { BootScene } from "./scenes/BootScene";
import { StageScene } from "./scenes/StageScene";

function mount(ctx: GameHostContext): GameInstance {
  ctx.onProgress(0, "art");
  const game = new Phaser.Game({
    type: Phaser.AUTO,
    parent: ctx.parent,
    width: W,
    height: H,
    backgroundColor: "#1d1830",
    transparent: false,
    scale: {
      mode: Phaser.Scale.FIT,
      autoCenter: Phaser.Scale.CENTER_BOTH,
    },
    render: { antialias: true, roundPixels: false, powerPreference: "high-performance" },
    input: {
      keyboard: { target: ctx.keyboardTarget },
      touch: { capture: true },
      activePointers: 4,
    },
    physics: {
      default: "arcade",
      arcade: { gravity: { x: 0, y: GRAVITY }, fps: 120, debug: false },
    },
    banner: false,
    audio: { noAudio: true },
    disableContextMenu: true,
    scene: [BootScene, StageScene],
    callbacks: {
      preBoot: (g) => {
        g.registry.set("ctx", ctx);
        g.registry.set("level", 0);
        g.registry.set("checkpoint", null);
        g.registry.set("resume", false);
      },
      postBoot: () => {
        ctx.onProgress(0.05, "art");
      },
    },
  });

  const stage = () => game.scene.getScene("stage") as StageScene | null;

  const restartScene = (resume: boolean) => {
    game.registry.set("autostart", true);
    game.registry.set("resume", resume);
    if (game.scene.isPaused("stage")) game.scene.resume("stage");
    stage()?.scene.restart();
  };

  return {
    start(options?: StartOptions) {
      const level = Phaser.Math.Clamp(options?.level ?? 0, 0, LEVELS.length - 1);
      const scene = stage();
      game.registry.set("resume", false);
      if (scene && scene.isAttract && scene.currentLevel === level) {
        game.registry.set("checkpoint", null);
        scene.begin();
        return;
      }
      game.registry.set("level", level);
      game.registry.set("checkpoint", null);
      restartScene(false);
    },
    pause() {
      if (game.scene.isActive("stage")) game.scene.pause("stage");
    },
    resume() {
      if (game.scene.isPaused("stage")) game.scene.resume("stage");
    },
    restart() {
      restartScene(true);
    },
    setHighScore() {},
    destroy() {
      game.destroy(true);
    },
  };
}

const operationRecess: GameModule = { mount };

export default operationRecess;
