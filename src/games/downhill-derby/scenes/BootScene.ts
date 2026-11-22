import * as Phaser from "phaser";
import { ArrowBigDown, ArrowBigUp, RotateCcw, RotateCw, TrendingUp } from "lucide";
import type { GameHostContext } from "@/games/types";
import { loadIcons } from "../../kit/icons";
import { artFiles } from "./cart";
import { CAST_FILES } from "./cast";
import { PROP_FILES } from "./props";
import { SAMPLE_FILES, SAMPLE_RES } from "./sample";

const BORROWED: [string, string][] = [
  ["lunch-lady", "food-fight/lunch-lady"],
  ["lunch-lady-angry", "food-fight/lunch-lady-angry"],
  ["arlindo", "dead-end-street/arlindo"],
  ["cat-sleep", "dead-end-street/cat-sleep"],
  ["cat-scared", "dead-end-street/cat-scared"],
  ["gnome", "dead-end-street/gnome"],
  ["mailbox", "dead-end-street/mailbox"],
  ["flamingo", "dead-end-street/flamingo"],
  ["tree-big", "operation-recess/tree-big"],
  ["cone-prop", "operation-recess/cone"],
];

export class BootScene extends Phaser.Scene {
  constructor() {
    super("boot");
  }

  preload() {
    const ctx = this.registry.get("ctx") as GameHostContext;
    const base = "/assets/downhill-derby";
    this.load.on(Phaser.Loader.Events.PROGRESS, (value: number) => ctx.onProgress(0.05 + value * 0.95, "art"));
    for (const f of artFiles()) this.load.svg(f.key, `${base}/${f.file}.svg`, { scale: f.scale });
    for (const f of ["dog-a", "dog-b", "dog-sit", "chicken-a", "chicken-b", "mascot-wave", "mascot-cheer"]) this.load.svg(f, `${base}/${f}.svg`, { scale: 1 });
    for (const [key, file] of [...BORROWED, ...CAST_FILES, ...PROP_FILES]) this.load.svg(key, `/assets/${file}.svg`, { scale: 1 });
    for (const [key, file] of SAMPLE_FILES) this.load.svg(key, `${base}/sample/${file}.svg`, { scale: SAMPLE_RES });
    loadIcons(this, [
      { key: "dd-ico-ccw", icon: RotateCcw, size: 128, strokeWidth: 3.2 },
      { key: "dd-ico-cw", icon: RotateCw, size: 128, strokeWidth: 3.2 },
      { key: "dd-ico-crouch", icon: ArrowBigDown, size: 128, strokeWidth: 2.4 },
      { key: "dd-ico-jump", icon: ArrowBigUp, size: 128, strokeWidth: 2.4 },
      { key: "dd-ico-ramp", icon: TrendingUp, size: 128, strokeWidth: 3.2 },
    ]);
  }

  create() {
    const ctx = this.registry.get("ctx") as GameHostContext;
    ctx.onProgress(1, "scene");
    this.scene.start("garage", this.registry.get("attract"));
    ctx.onReady();
  }
}
