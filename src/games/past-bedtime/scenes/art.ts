import type * as Phaser from "phaser";
import { ART_FILES } from "./artManifest";
import type { Layout } from "./layout";

export type ArtMode = "final" | "draft";

export const ART_LEVELS: ReadonlySet<string> = new Set(["doorway", "hallway"]);

const BASE = "/assets/past-bedtime";

export const artKey = (name: string) => `pb-${name}`;

export function hasArt(name: string) {
  return name in ART_FILES;
}

export function loadArt(scene: Phaser.Scene) {
  for (const name of Object.keys(ART_FILES)) {
    const key = artKey(name);
    if (!scene.textures.exists(key)) scene.load.svg(key, `${BASE}/${name}.svg`, { scale: ART_FILES[name][4] });
  }
}

export function placeArt(scene: Phaser.Scene, name: string, layout: Layout, x: number, y: number, depth: number) {
  const box = ART_FILES[name];
  if (!box || !scene.textures.exists(artKey(name))) return null;
  const s = layout.tile;
  const [vx, vy, vw, vh] = box;
  return scene.add
    .image(layout.ox + x * s + (vx / 100) * s, layout.oy + y * s + (vy / 100) * s, artKey(name))
    .setOrigin(0, 0)
    .setDisplaySize((vw / 100) * s, (vh / 100) * s)
    .setDepth(depth);
}

export function centeredArt(scene: Phaser.Scene, name: string, unit: number) {
  const box = ART_FILES[name];
  const [vx, vy, vw, vh] = box;
  return scene.add
    .image(0, 0, artKey(name))
    .setOrigin(-vx / vw, -vy / vh)
    .setDisplaySize(vw * unit, vh * unit);
}

export function decorArtName(kind: string, w: number | undefined, h: number | undefined, v: string | number | undefined) {
  const dims = `${Math.round((w ?? 1) * 100)}x${Math.round((h ?? 1) * 100)}`;
  switch (kind) {
    case "door":
      return `door-${v === "bruno" ? "bruno" : "plain"}-${dims}`;
    case "doorLeaf":
      return `doorLeaf-${dims}`;
    case "frame":
      return `frame-${v ?? 0}-${dims}`;
    case "window":
      return v ? `window-${v}-${dims}` : `window-${dims}`;
    case "hooks":
    case "console":
    case "railing":
    case "runner":
      return `${kind}-${dims}`;
    case "rug":
      return v === 0x9a6a72 ? `rug-rose-${dims}` : `rug-${dims}`;
    case "jamb":
      return `jamb-${Math.round((h ?? 1) * 100)}`;
    case "kidDrawing":
      return `${kind}-${dims}`;
    case "lamp":
    case "switch":
    case "sock":
    case "comic":
    case "mouseHole":
    case "outlet":
    case "growthChart":
    case "toyShelf":
    case "sconce":
    case "alarmClock":
    case "basket":
      return kind;
    default:
      return "";
  }
}
