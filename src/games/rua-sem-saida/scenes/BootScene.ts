import * as Phaser from "phaser";
import type { GameHostContext } from "@/games/types";

const BASE = "/games/rua-sem-saida/";

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
];

export class BootScene extends Phaser.Scene {
  constructor() {
    super("boot");
  }

  preload() {
    const ctx = this.registry.get("ctx") as GameHostContext;
    this.load.on("progress", (value: number) => ctx.onProgress(value, "arte"));
    for (const [key, file, width, height] of ASSETS) {
      this.load.svg(key, BASE + file, { width, height });
    }
  }

  create() {
    const ctx = this.registry.get("ctx") as GameHostContext;
    ctx.onProgress(1, "cena");
    this.scene.start("play");
  }
}
