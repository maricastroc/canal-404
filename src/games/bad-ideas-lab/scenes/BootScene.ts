import * as Phaser from "phaser";
import type { GameHostContext } from "@/games/types";
import { loadIcons } from "../../kit/icons";
import { reportFailedLoads } from "../../kit/load";
import { ICON_SPECS } from "../icons";

const BASE = "/assets/bad-ideas-lab/";

const ASSETS: [key: string, file: string, width: number, height: number][] = [
  ["lab-bg", "lab-bg.svg", 1920, 1080],
  ["pipe", "pipe.svg", 196, 450],
  ["ramp", "ramp.svg", 200, 24],
  ["spring", "spring.svg", 100, 48],
  ["fan-body", "fan-body.svg", 96, 112],
  ["fan-blade", "fan-blade.svg", 28, 80],
  ["belt", "belt.svg", 240, 34],
  ["marble", "marble.svg", 44, 44],
  ["orange", "orange.svg", 52, 56],
  ["bell", "bell.svg", 100, 100],
  ["toaster", "toaster.svg", 160, 112],
  ["toast", "toast.svg", 70, 64],
  ["juicer", "juicer.svg", 190, 130],
  ["remote", "remote.svg", 110, 40],
  ["tv", "tv.svg", 220, 186],
  ["lina", "lina-lab.svg", 150, 220],
  ["lina-yay", "lina-yay.svg", 150, 220],
  ["lina-oops", "lina-oops.svg", 150, 220],
  ["lina-watch", "lina-watch.svg", 150, 220],
  ["lina-watch-eyes", "lina-watch-eyes.svg", 150, 220],
  ["lina-flinch", "lina-flinch.svg", 150, 220],
  ["lina-cover", "lina-cover.svg", 150, 220],
  ["lina-close", "lina-close.svg", 150, 220],
  ["lina-wow", "lina-wow.svg", 150, 220],
  ["bruno", "bruno-lab.svg", 150, 220],
  ["bruno-shock", "bruno-lab-shock.svg", 150, 220],
  ["feeder", "feeder.svg", 120, 48],
  ["hopper", "hopper.svg", 150, 200],
  ["bowl", "bowl.svg", 130, 50],
  ["kibble-full", "kibble-full.svg", 100, 40],
  ["cat-grumpy", "cat-grumpy.svg", 110, 110],
  ["record", "record.svg", 160, 112],
  ["pin", "pin.svg", 36, 92],
  ["pin-deck", "pin-deck.svg", 40, 130],
  ["panel", "panel.svg", 130, 210],
  ["bulb", "bulb.svg", 50, 60],
  ["smoke", "smoke.svg", 92, 64],
  ["boom", "boom.svg", 128, 120],
  ["target", "target.svg", 140, 140],
  ["cat-sleep", "cat-sleep.svg", 130, 70],
  ["cat-scared", "cat-scared.svg", 130, 100],
  ["star", "star.svg", 36, 36],
  ["puff", "puff.svg", 64, 50],
  ["spark", "spark.svg", 26, 26],
  ["drop", "drop.svg", 20, 26],
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
    loadIcons(this, ICON_SPECS);
    reportFailedLoads(this, ctx.onError);
  }

  create() {
    const ctx = this.registry.get("ctx") as GameHostContext;
    ctx.onProgress(1, "scene");
    this.scene.start("lab");
  }
}
