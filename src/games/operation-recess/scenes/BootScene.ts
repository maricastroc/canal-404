import * as Phaser from "phaser";
import { ArrowBigUp, ArrowLeft, ArrowRight, ChevronLeft, ChevronRight, Flag, Heart, Sword } from "lucide";
import type { GameHostContext } from "@/games/types";
import { loadIcons } from "../../kit/icons";

const BASE = "/assets/operation-recess/";

const SCENERY = [
  "lockers-a",
  "lockers-b",
  "lockers-c",
  "lockers-d",
  "window-yard",
  "door-class-a",
  "door-class-b",
  "door-class-c",
  "poster-virtue",
  "poster-norun",
  "poster-obey",
  "poster-laugh",
  "poster-recess",
  "banner-silence",
  "banner-protest",
  "banner-discipline",
  "paper-pile",
  "paper",
  "ceiling-lamp",
  "lamp-warm",
  "extinguisher",
  "vent",
  "crack",
  "mop-cart",
  "bench-hall",
  "tree-big",
  "trees-far",
  "building-b",
  "kiosk",
  "stairs-bg",
  "picnic-table",
  "hoop",
  "fence-tile",
  "protest-sign",
  "backpack",
  "jump-rope",
  "grass-tuft",
  "lamp-post",
  "flag",
  "column",
  "window-tall",
  "curtain",
  "signpost",
  "principal-a",
  "principal-b",
  "principal-c",
  "bust",
  "banner-order",
  "banner-obey",
  "plant-big",
  "stairs-office",
  "door-admin-a",
  "door-admin-b",
  "big-desk",
  "rules-board",
  "file-cabinet",
  "trophy-shelf",
  "hall-light",
  "honor-roll",
  "door-plain",
  "pennants",
];

const HERO = ["idle", "run-a", "run-b", "jump", "fall", "attack-a", "attack-b", "hurt", "cheer"];
const MON: Record<string, string[]> = {
  common: ["walk-a", "walk-b", "windup", "attack", "hurt"],
  whistle: ["walk-a", "walk-b", "puff", "blow", "hurt"],
  shield: ["walk-a", "walk-b", "block", "bash", "open", "hurt"],
};
const BOSS = ["idle", "puff", "blow", "stomp", "charge", "raise", "slam", "dizzy", "hurt", "beaten"];
const KIDS = ["deco-a", "deco-b", "mila-a", "mila-b", "lina-a", "lina-b"];

const PROPS: [key: string, width: number, height: number][] = [
  ["locker-bank", 250, 242],
  ["locker-bank-b", 250, 242],
  ["door", 160, 252],
  ["board", 260, 170],
  ["poster-quiet", 140, 180],
  ["poster-run", 140, 180],
  ["clock", 100, 100],
  ["fountain", 120, 150],
  ["bin", 100, 116],
  ["boxes", 170, 160],
  ["cone", 90, 130],
  ["puddle", 240, 40],
  ["tree", 320, 420],
  ["bench", 250, 100],
  ["goal", 280, 190],
  ["ball", 76, 76],
  ["building", 900, 420],
  ["cloud", 220, 110],
  ["plant", 110, 180],
  ["portrait", 160, 190],
  ["trophy-case", 240, 230],
  ["desk", 250, 130],
  ["office-door", 220, 300],
  ["tape", 240, 60],
  ["cart", 250, 110],
  ["snack", 72, 60],
  ["sticker", 64, 64],
  ["bell", 90, 210],
  ["bell-on", 90, 210],
  ["slash", 220, 200],
  ["pow", 120, 120],
  ["dust", 64, 50],
  ["wave", 90, 120],
  ["big-wave", 150, 220],
  ["shock", 200, 90],
  ["confetti", 20, 12],
  ["spark", 30, 30],
];

export class BootScene extends Phaser.Scene {
  constructor() {
    super("boot");
  }

  preload() {
    const ctx = this.registry.get("ctx") as GameHostContext;
    this.load.on("progress", (value: number) => ctx.onProgress(value, "art"));
    for (const p of HERO) this.load.svg(`hero-${p}`, `${BASE}hero-${p}.svg`, { width: 300, height: 214 });
    for (const [kind, poses] of Object.entries(MON)) {
      for (const p of poses) {
        this.load.svg(`mon-${kind}-${p}`, `${BASE}mon-${kind}-${p}.svg`, { width: 260, height: 256 });
        if (kind === "shield") this.load.svg(`mon-${kind}-${p}-l`, `${BASE}mon-${kind}-${p}-l.svg`, { width: 260, height: 256 });
      }
    }
    for (const p of BOSS) this.load.svg(`boss-${p}`, `${BASE}boss-${p}.svg`, { width: 380, height: 446 });
    for (const k of KIDS) this.load.svg(`kid-${k}`, `${BASE}kid-${k}.svg`, { width: 150, height: 212 });
    for (const [key, width, height] of PROPS) this.load.svg(key, `${BASE}${key}.svg`, { width, height });
    for (const key of SCENERY) this.load.svg(key, `${BASE}${key}.svg`);
    loadIcons(this, [
      { key: "icon-left", icon: ChevronLeft, size: 80, strokeWidth: 3 },
      { key: "icon-right", icon: ChevronRight, size: 80, strokeWidth: 3 },
      { key: "icon-jump", icon: ArrowBigUp, size: 84, color: "#1d1830", strokeWidth: 2.6 },
      { key: "icon-attack", icon: Sword, size: 90, color: "#1d1830", strokeWidth: 2.8 },
      { key: "icon-heart-on", icon: Heart, size: 44, color: "#1d1830", fill: "#ef4f43", strokeWidth: 2.4 },
      { key: "icon-heart-off", icon: Heart, size: 44, color: "#9a8fbf", strokeWidth: 2.4 },
      { key: "icon-flag", icon: Flag, size: 40, color: "#ffc83d", strokeWidth: 2.6 },
      { key: "chip-left", icon: ArrowLeft, size: 34, color: "#1d1830", strokeWidth: 3.2 },
      { key: "chip-right", icon: ArrowRight, size: 34, color: "#1d1830", strokeWidth: 3.2 },
      { key: "chip-pad-left", icon: ChevronLeft, size: 34, color: "#1d1830", strokeWidth: 3.4 },
      { key: "chip-pad-right", icon: ChevronRight, size: 34, color: "#1d1830", strokeWidth: 3.4 },
      { key: "chip-jump", icon: ArrowBigUp, size: 34, color: "#1d1830", strokeWidth: 3 },
      { key: "chip-attack", icon: Sword, size: 34, color: "#1d1830", strokeWidth: 3 },
    ]);
  }

  create() {
    const ctx = this.registry.get("ctx") as GameHostContext;
    ctx.onProgress(1, "scene");
    this.scene.start("stage");
  }
}
