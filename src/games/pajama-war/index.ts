import * as Phaser from "phaser";
import type { GameHostContext, GameInstance, GameModule, StartOptions } from "@/games/types";
import { ARENAS } from "./arenas";
import { H, W } from "./config";
import { ArenaScene } from "./scenes/ArenaScene";
import { BootScene } from "./scenes/BootScene";
import { SelectScene } from "./scenes/SelectScene";
import { loadStats } from "./storage";

const SCENES = ["arena", "select"] as const;

function mount(ctx: GameHostContext): GameInstance {
  ctx.onProgress(0, "art");
  const game = new Phaser.Game({
    type: Phaser.AUTO,
    parent: ctx.parent,
    width: W,
    height: H,
    backgroundColor: "#1d1830",
    transparent: false,
    scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH },
    render: { antialias: true, roundPixels: false, powerPreference: "high-performance" },
    input: { keyboard: { target: ctx.keyboardTarget }, touch: { capture: true }, activePointers: 4 },
    banner: false,
    audio: { noAudio: true },
    disableContextMenu: true,
    scene: [BootScene, ArenaScene, SelectScene],
    callbacks: {
      preBoot: (g) => {
        g.registry.set("ctx", ctx);
        g.registry.set("level", 0);
        g.registry.set("kid", null);
      },
      postBoot: () => ctx.onProgress(0.05, "art"),
    },
  });

  const current = () => SCENES.find((key) => game.scene.isActive(key) || game.scene.isPaused(key)) ?? null;

  const open = (key: "arena" | "select", data?: object) => {
    for (const k of SCENES) {
      if (game.scene.isPaused(k)) game.scene.resume(k);
      if (k !== key && (game.scene.isActive(k) || game.scene.isSleeping(k))) game.scene.stop(k);
    }
    const scene = game.scene.getScene(key);
    if (game.scene.isActive(key)) scene.scene.restart(data);
    else game.scene.start(key, data);
  };

  const fight = () => open("arena", { mode: "play" });
  const pick = () => open("select");

  return {
    start(options?: StartOptions) {
      const level = Phaser.Math.Clamp(options?.level ?? 0, 0, ARENAS.length - 1);
      game.registry.set("level", level);
      if (!game.registry.get("kid")) game.registry.set("kid", loadStats().lastKid);
      if (options?.next && game.registry.get("kid")) fight();
      else pick();
    },
    pause() {
      const key = current();
      if (key && game.scene.isActive(key)) game.scene.pause(key);
    },
    resume() {
      const key = current();
      if (key && game.scene.isPaused(key)) game.scene.resume(key);
    },
    restart() {
      if (game.registry.get("kid")) fight();
      else pick();
    },
    alt() {
      pick();
    },
    setHighScore() {},
    destroy() {
      game.destroy(true);
    },
  };
}

const pajamaWar: GameModule = { mount };

export default pajamaWar;
