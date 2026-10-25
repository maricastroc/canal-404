import * as Phaser from "phaser";
import { Crosshair, Heart, HeartPulse, Play, Timer, Trophy, Zap } from "lucide";
import type { GameHostContext } from "@/games/types";
import { loadIcons } from "../../kit/icons";
import { KIDS, POSES } from "../config";

const BASE = "/assets/pajama-war/";
export const KID_RES = 1.5;

const PROPS: [string, number, number][] = [
  ["bed-pink", 340, 400],
  ["bed-blue", 340, 400],
  ["nightstand", 150, 160],
  ["lamp", 120, 160],
  ["toy-chest", 230, 190],
  ["beanbag", 210, 160],
  ["rug-round", 580, 272],
  ["window-night", 320, 290],
  ["poster-rocket", 170, 220],
  ["wall-shelf", 290, 150],
  ["teddy", 110, 120],
  ["blocks", 130, 110],
  ["ball", 72, 72],
  ["boombox", 160, 110],
  ["slippers", 120, 70],
  ["books", 110, 80],
  ["sofa", 480, 270],
  ["cushion-a", 88, 86],
  ["cushion-b", 88, 86],
  ["armchair", 230, 230],
  ["tv", 300, 330],
  ["coffee-table", 330, 170],
  ["floor-lamp", 140, 340],
  ["plant-big", 170, 250],
  ["bookshelf", 280, 360],
  ["rug-living", 660, 310],
  ["window-city", 330, 290],
  ["frame-family", 210, 170],
  ["frame-boat", 170, 150],
  ["cat-sleep", 180, 112],
  ["cat-alert", 180, 112],
  ["cat-run", 180, 112],
  ["tent", 460, 330],
  ["tree", 470, 570],
  ["tire-swing", 120, 260],
  ["screen", 280, 360],
  ["grill", 160, 190],
  ["picnic", 540, 230],
  ["cooler", 160, 130],
  ["stump", 130, 100],
  ["gnome", 90, 130],
  ["bush", 300, 190],
  ["fence", 200, 172],
  ["moon", 200, 200],
  ["lantern", 80, 110],
  ["pillow", 104, 76],
  ["feather", 48, 22],
];

export class BootScene extends Phaser.Scene {
  constructor() {
    super("boot");
  }

  preload() {
    const ctx = this.registry.get("ctx") as GameHostContext;
    this.load.on("progress", (value: number) => ctx.onProgress(value, "art"));
    for (const kid of KIDS) {
      for (const pose of POSES) this.load.svg(`kid-${kid}-${pose}`, `${BASE}kid-${kid}-${pose}.svg`, { width: 300 * KID_RES, height: 224 * KID_RES });
      for (const face of ["normal", "happy", "ouch", "dizzy"]) this.load.svg(`face-${kid}-${face}`, `${BASE}face-${kid}-${face}.svg`, { width: 200, height: 222 });
    }
    for (const [key, width, height] of PROPS) this.load.svg(key, `${BASE}${key}.svg`, { width: width * 1.25, height: height * 1.25 });
    loadIcons(this, [
      { key: "icon-heart-on", icon: Heart, size: 40, color: "#1d1830", fill: "#ef4f43", strokeWidth: 2.4 },
      { key: "icon-heart-off", icon: Heart, size: 40, color: "#7d6fb0", fill: "#3a3157", strokeWidth: 2.4 },
      { key: "icon-timer", icon: Timer, size: 44, color: "#ffc83d", strokeWidth: 2.6 },
      { key: "icon-speed", icon: Zap, size: 34, color: "#1d1830", strokeWidth: 2.6 },
      { key: "icon-attack", icon: Crosshair, size: 34, color: "#1d1830", strokeWidth: 2.6 },
      { key: "icon-regen", icon: HeartPulse, size: 34, color: "#1d1830", strokeWidth: 2.6 },
      { key: "icon-play", icon: Play, size: 40, color: "#1d1830", fill: "#1d1830", strokeWidth: 2.4 },
      { key: "icon-trophy", icon: Trophy, size: 30, color: "#1d1830", strokeWidth: 2.6 },
    ]);
  }

  create() {
    const ctx = this.registry.get("ctx") as GameHostContext;
    ctx.onProgress(1, "scene");
    this.scene.start("arena", { mode: "attract" });
  }
}
