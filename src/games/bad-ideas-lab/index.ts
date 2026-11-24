import * as Phaser from "phaser";
import type { GameHostContext, GameInstance, GameModule, StartOptions } from "@/games/types";
import { LEVELS } from "./levels";
import { BootScene } from "./scenes/BootScene";
import { measureFrame } from "./scenes/frame";
import { LabScene } from "./scenes/LabScene";
import { destroyGame } from "../kit/game";

function mount(ctx: GameHostContext): GameInstance {
  ctx.onProgress(0, "art");
  const frame = measureFrame(ctx.parent, LEVELS[0]);
  const game = new Phaser.Game({
    type: Phaser.AUTO,
    parent: ctx.parent,
    width: frame.width,
    height: frame.height,
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
    banner: false,
    audio: { noAudio: true },
    disableContextMenu: true,
    scene: [BootScene, LabScene],
    callbacks: {
      preBoot: (g) => {
        g.registry.set("ctx", ctx);
        g.registry.set("frame", frame);
        g.registry.set("level", 0);
      },
      postBoot: () => {
        ctx.onProgress(0.05, "art");
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
      destroyGame(game);
    },
  };
}

const badIdeasLab: GameModule = { mount };

export default badIdeasLab;
