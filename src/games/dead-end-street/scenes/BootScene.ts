import * as Phaser from "phaser";
import { Angle, Check, Lock, Signal, SignalHigh, SignalLow, SignalMedium, SignalZero } from "lucide";
import { loadIcons, type IconSpec } from "@/games/kit/icons";
import type { GameHostContext } from "@/games/types";

const BASE = "/assets/dead-end-street/";

export const ASSETS: [key: string, file: string, width: number, height: number][] = [
  ["sky", "sky.svg", 1920, 1080],
  ["houses", "houses.svg", 1920, 1080],
  ["yard", "yard.svg", 1920, 1080],
  ["cloud-a", "cloud-a.svg", 280, 120],
  ["cloud-b", "cloud-b.svg", 210, 96],
  ["wagon", "wagon.svg", 280, 300],
  ["fork-front", "fork-front.svg", 280, 300],
  ["deco", "deco.svg", 140, 230],
  ["lina", "lina.svg", 140, 220],
  ["arlindo", "arlindo.svg", 150, 140],
  ["shoe", "shoe.svg", 84, 50],
  ["balloon", "balloon.svg", 70, 80],
  ["tire", "tire.svg", 84, 84],
  ["duck", "duck.svg", 76, 68],
  ["gnome", "gnome.svg", 66, 102],
  ["gnome-gold", "gnome-gold.svg", 66, 102],
  ["flamingo", "flamingo.svg", 72, 152],
  ["mailbox", "mailbox.svg", 96, 70],
  ["birdhouse", "birdhouse.svg", 80, 90],
  ["crate", "crate.svg", 80, 80],
  ["tire-flat", "tire-flat.svg", 140, 44],
  ["trash-can", "trash-can.svg", 80, 110],
  ["plank", "plank.svg", 272, 26],
  ["star", "star.svg", 36, 36],
  ["puff", "puff.svg", 64, 50],
  ["drop", "drop.svg", 20, 26],
  ["feather", "feather.svg", 22, 42],
  ["splinter", "splinter.svg", 26, 12],
  ["cat-sleep", "cat-sleep.svg", 130, 70],
  ["cat-scared", "cat-scared.svg", 130, 100],
  ["trash-can-open", "trash-can-open.svg", 80, 110],
  ["lid", "lid.svg", 84, 30],
  ["junk-banana", "junk-banana.svg", 36, 30],
  ["junk-fish", "junk-fish.svg", 40, 22],
  ["junk-can", "junk-can.svg", 22, 32],
  ["bird", "bird.svg", 56, 44],
  ["bird-down", "bird-down.svg", 56, 44],
  ["letter", "letter.svg", 38, 26],
  ["spark", "spark.svg", 26, 26],
  ["birdhouse-empty", "birdhouse-empty.svg", 80, 90],
];

const INK = "#1d1830";
const ICON_SIZE = 72;

export const ICONS: IconSpec[] = [
  { key: "icon-angle", icon: Angle, size: ICON_SIZE, color: INK, strokeWidth: 2.6 },
  { key: "icon-force-track", icon: Signal, size: ICON_SIZE, color: "#ffffff", strokeWidth: 2.6 },
  { key: "icon-force-0", icon: SignalZero, size: ICON_SIZE, color: INK, strokeWidth: 2.6 },
  { key: "icon-force-1", icon: SignalLow, size: ICON_SIZE, color: INK, strokeWidth: 2.6 },
  { key: "icon-force-2", icon: SignalMedium, size: ICON_SIZE, color: INK, strokeWidth: 2.6 },
  { key: "icon-force-3", icon: SignalHigh, size: ICON_SIZE, color: INK, strokeWidth: 2.6 },
  { key: "icon-force-4", icon: Signal, size: ICON_SIZE, color: INK, strokeWidth: 2.6 },
  { key: "icon-force-max-outline", icon: Signal, size: ICON_SIZE, color: INK, strokeWidth: 4.4 },
  { key: "icon-force-max", icon: Signal, size: ICON_SIZE, color: "#ef4f43", strokeWidth: 2.6 },
  { key: "icon-check-outline", icon: Check, size: ICON_SIZE, color: INK, strokeWidth: 6.4 },
  { key: "icon-check", icon: Check, size: ICON_SIZE, color: "#93cf4c", strokeWidth: 3.2 },
  { key: "icon-lock-outline", icon: Lock, size: ICON_SIZE, color: INK, strokeWidth: 6 },
  { key: "icon-lock", icon: Lock, size: ICON_SIZE, color: "#b9a6ef", strokeWidth: 2.8 },
];

export class BootScene extends Phaser.Scene {
  constructor() {
    super("boot");
  }

  preload() {
    const ctx = this.registry.get("ctx") as GameHostContext;
    this.load.on("progress", (value: number) => ctx.onProgress(value, "art"));
    for (const [key, file, width, height] of ASSETS) {
      this.load.svg(key, BASE + file, { width, height });
    }
    loadIcons(this, ICONS);
  }

  create() {
    const ctx = this.registry.get("ctx") as GameHostContext;
    ctx.onProgress(1, "scene");
    this.scene.start("play");
  }
}
