import * as Phaser from "phaser";
import { ArrowBigDown, ArrowBigUp, ArrowLeft, ArrowRight, Check, ChevronDown, ChevronLeft, ChevronRight, ChevronUp, Ghost, Lock, RotateCcw, RotateCw, TrendingUp, Trophy } from "lucide";
import type { GameHostContext } from "@/games/types";
import { loadIcons } from "../../kit/icons";
import { reportFailedLoads } from "../../kit/load";
import { artFiles } from "./cart";
import { CAST_FILES } from "./cast";
import { PROP_FILES } from "./props";
import { SAMPLE_FILES, SAMPLE_RES } from "./sample";
import { loadKeyArrows } from "../../kit/keyArrows";

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
    loadKeyArrows(this);
    loadIcons(this, [
      { key: "dd-ico-ccw", icon: RotateCcw, size: 128, strokeWidth: 3.2 },
      { key: "dd-ico-cw", icon: RotateCw, size: 128, strokeWidth: 3.2 },
      { key: "dd-ico-crouch", icon: ArrowBigDown, size: 128, strokeWidth: 2.4 },
      { key: "dd-ico-jump", icon: ArrowBigUp, size: 128, strokeWidth: 2.4 },
      { key: "dd-ico-ramp", icon: TrendingUp, size: 128, strokeWidth: 3.2 },
      { key: "dd-ico-ccw-light", icon: RotateCcw, size: 128, color: "#fbf5e6", strokeWidth: 2.2 },
      { key: "dd-ico-cw-light", icon: RotateCw, size: 128, color: "#fbf5e6", strokeWidth: 2.2 },
      { key: "dd-ico-trend-up", icon: ChevronUp, size: 64, color: "#7fe0c4", strokeWidth: 3.4 },
      { key: "dd-ico-trend-down", icon: ChevronDown, size: 64, color: "#ff7a4a", strokeWidth: 3.4 },
      { key: "dd-ico-edge-left", icon: ChevronLeft, size: 64, strokeWidth: 3.4 },
      { key: "dd-ico-edge-right", icon: ChevronRight, size: 64, strokeWidth: 3.4 },
      { key: "dd-ico-charged", icon: ArrowBigUp, size: 64, color: "#ff7a1a", fill: "#ff7a1a", strokeWidth: 2 },
      { key: "dd-ico-key-left", icon: ArrowLeft, size: 96, strokeWidth: 3 },
      { key: "dd-ico-key-right", icon: ArrowRight, size: 96, strokeWidth: 3 },
      { key: "dd-ico-trophy", icon: Trophy, size: 96, strokeWidth: 2.6 },
      { key: "dd-ico-ghost", icon: Ghost, size: 128, fill: "#fbf5e6", strokeWidth: 2.4 },
      { key: "dd-ico-check", icon: Check, size: 96, strokeWidth: 3.6 },
      { key: "dd-ico-lock", icon: Lock, size: 96, strokeWidth: 2.8 },
    ]);
    reportFailedLoads(this, ctx.onError);
  }

  create() {
    const ctx = this.registry.get("ctx") as GameHostContext;
    ctx.onProgress(1, "scene");
    this.scene.start("garage", this.registry.get("attract"));
    ctx.onReady();
  }
}
