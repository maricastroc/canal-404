import * as Phaser from "phaser";
import type { GameHostContext, GameInstance, GameModule, StartOptions } from "@/games/types";
import { ARENAS } from "./arenas";
import { readChallenges } from "./challenges";
import { KIDS, type KidId } from "./config";
import { challengeGoals } from "./copy";
import { ArenaScene } from "./scenes/ArenaScene";
import { BootScene } from "./scenes/BootScene";
import { measureFrame } from "./scenes/frame";
import { SelectScene } from "./scenes/SelectScene";
import { loadStats } from "./storage";
import { destroyGame } from "../kit/game";

const SCENES = ["arena", "select"] as const;

function kidOf(character: string | undefined): KidId | null {
  return (KIDS as string[]).includes(character ?? "") ? (character as KidId) : null;
}

function mount(ctx: GameHostContext): GameInstance {
  ctx.onProgress(0, "art");
  const frame = measureFrame(ctx.parent);
  const game = new Phaser.Game({
    type: Phaser.AUTO,
    parent: ctx.parent,
    width: frame.width,
    height: frame.height,
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
        g.registry.set("frame", frame);
        g.registry.set("level", 0);
        g.registry.set("kid", null);
        g.registry.set("forcedKid", false);
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
      const forced = kidOf(options?.setup?.character);
      if (forced) {
        game.registry.set("kid", forced);
        game.registry.set("forcedKid", true);
        fight();
        return;
      }
      if (game.registry.get("forcedKid")) {
        game.registry.set("forcedKid", false);
        game.registry.set("kid", loadStats().lastKid);
      }
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
    levelGoals() {
      const stats = loadStats();
      return ARENAS.map((arena) => challengeGoals(readChallenges(stats, arena.id, arena.feats), ctx.locale).goals);
    },
    setHighScore() {},
    destroy() {
      destroyGame(game);
    },
  };
}

const pajamaWar: GameModule = { mount };

export default pajamaWar;
