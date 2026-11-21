import * as Phaser from "phaser";
import type { GameHostContext, GameInstance, GameModule, StartOptions } from "@/games/types";
import { PHASES } from "./phases";
import { BootScene } from "./scenes/BootScene";
import { measureFrame } from "./scenes/frame";
import { PlayScene } from "./scenes/PlayScene";

function mount(ctx: GameHostContext): GameInstance {
  ctx.onProgress(0, "art");
  const frame = measureFrame(ctx.parent);
  const game = new Phaser.Game({
    type: Phaser.AUTO,
    parent: ctx.parent,
    width: frame.width,
    height: frame.height,
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
    banner: false,
    audio: { noAudio: true },
    disableContextMenu: true,
    scene: [BootScene, PlayScene],
    callbacks: {
      preBoot: (g) => {
        g.registry.set("ctx", ctx);
        g.registry.set("frame", frame);
        g.registry.set("phase", 0);
        g.registry.set("records", []);
      },
      postBoot: () => {
        ctx.onProgress(0.05, "art");
      },
    },
  });

  const play = () => game.scene.getScene("play") as PlayScene | null;

  const restartScene = () => {
    game.registry.set("autostart", true);
    const scene = play();
    if (game.scene.isPaused("play")) game.scene.resume("play");
    scene?.scene.restart();
  };

  return {
    start(options?: StartOptions) {
      const level = Phaser.Math.Clamp(options?.level ?? 0, 0, PHASES.length - 1);
      if (options?.records) game.registry.set("records", options.records.map((r) => ({ ...r })));
      const scene = play();
      if (scene && scene.isAttract && scene.phaseIndex === level) {
        if (options?.records) scene.setRecords(options.records);
        scene.begin();
        return;
      }
      game.registry.set("phase", level);
      restartScene();
    },
    pause() {
      if (game.scene.isActive("play")) game.scene.pause("play");
    },
    resume() {
      if (game.scene.isPaused("play")) game.scene.resume("play");
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

const deadEndStreet: GameModule = { mount };

export default deadEndStreet;
