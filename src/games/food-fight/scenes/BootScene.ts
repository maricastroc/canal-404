import * as Phaser from "phaser";
import { ArrowBigDown, Ban, Pointer } from "lucide";
import type { GameHostContext } from "@/games/types";
import { loadIcons } from "../../kit/icons";
import { RIVAL_KINDS, RIVAL_LOOKS } from "../config";

const BASE = "/assets/food-fight/";

const ASSETS: [key: string, file: string, width: number, height: number][] = [
  ["cafeteria-bg", "cafeteria-bg.svg", 1920, 1080],
  ["cafeteria-top", "cafeteria-top.svg", 1920, 110],
  ["our-table", "our-table.svg", 680, 210],
  ["rival-table", "rival-table.svg", 380, 170],
  ["deco-idle", "deco-idle.svg", 260, 330],
  ["deco-throw", "deco-throw.svg", 260, 330],
  ["deco-splat", "deco-splat.svg", 260, 330],
  ["deco-cheer", "deco-cheer.svg", 260, 330],
  ["mila-peek", "mila-peek.svg", 220, 240],
  ["mila-shout", "mila-shout.svg", 220, 240],
  ["mila-cheer", "mila-cheer.svg", 220, 240],
  ...RIVAL_KINDS.flatMap((kind) =>
    RIVAL_LOOKS.flatMap((look): [string, string, number, number][] => [
      [`rival-${kind}-${look}-up`, `rival-${kind}-${look}-up.svg`, 200, 250],
      [`rival-${kind}-${look}-windup`, `rival-${kind}-${look}-windup.svg`, 200, 250],
    ]),
  ),
  ...[0, 1, 2, 3].flatMap((i): [string, string, number, number][] => [
    [`lady-walk-${i}`, `lady-walk-${i}.svg`, 220, 520],
    [`lady-angry-${i}`, `lady-angry-${i}.svg`, 220, 520],
  ]),
  ...["cook-walk-0", "cook-walk-1", "cook-reach", "cook-carry-0", "cook-carry-1", "cook-huff-0", "cook-huff-1"].map((k): [string, string, number, number] => [k, `${k}.svg`, 280, 500]),
  ["pudding", "pudding.svg", 76, 62],
  ["sandwich", "sandwich.svg", 80, 54],
  ["apple", "apple.svg", 54, 60],
  ["grapes", "grapes.svg", 60, 64],
  ["banana", "banana.svg", 80, 48],
  ["splat-pudding", "splat-pudding.svg", 180, 130],
  ["splat-food", "splat-food.svg", 170, 120],
  ["splat-screen", "splat-screen.svg", 420, 300],
  ["napkin", "napkin.svg", 70, 64],
  ["bell", "bell.svg", 160, 130],
  ["clock", "clock.svg", 150, 150],
  ["star", "star.svg", 36, 36],
  ["spark", "spark.svg", 26, 26],
  ["tray", "tray.svg", 180, 124],
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
    loadIcons(this, [
      { key: "icon-duck", icon: ArrowBigDown, size: 160, color: "#1d1830", fill: "#fbf5e6", strokeWidth: 2.2 },
      { key: "icon-tap-outline", icon: Pointer, size: 160, color: "#1d1830", strokeWidth: 4 },
      { key: "icon-tap", icon: Pointer, size: 160, color: "#fbf5e6", strokeWidth: 1.8 },
      { key: "icon-ban", icon: Ban, size: 64, color: "#ef4f43", fill: "#fbf5e6", strokeWidth: 3.2 },
    ]);
  }

  create() {
    const ctx = this.registry.get("ctx") as GameHostContext;
    ctx.onProgress(1, "scene");
    this.scene.start("lunch");
  }
}
