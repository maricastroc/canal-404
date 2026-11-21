import type * as Phaser from "phaser";
import { ART_FILES } from "./artManifest";
import type { PropDef } from "../sim/types";
import type { Layout } from "./layout";

export type ArtMode = "final" | "draft";


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
    case "doily":
    case "clothesline":
    case "laundryShelf":
    case "pawPrints":
    case "tableRug":
    case "braidRug":
    case "passadeira":
    case "calendar":
    case "pans":
    case "spices":
    case "smallDoor":
    case "hood":
      return `${kind}-${dims}`;
    case "plates":
    case "herbs":
    case "garlic":
    case "apron":
    case "broom":
    case "hoop":
    case "portrait":
    case "figurines":
    case "penduloClock":
    case "basketYarn":
    case "slippersPair":
    case "onions":
    case "teaTray":
    case "umbrellaStand":
    case "fernStand":
    case "toaster":
    case "radio":
    case "thermos":
    case "breadbox":
    case "jars":
    case "blender":
    case "fruit":
    case "namePlate":
    case "dogBowls":
    case "leash":
    case "ironingBoard":
    case "boneToy":
    case "tennisBall":
    case "catTree":
    case "ovalMirror":
    case "crookedFrame":
    case "pennant":
    case "turntable":
    case "popcorn":
    case "popcornBowl":
    case "remote":
    case "scarf":
    case "poster404":
    case "vhsStack":
    case "bucketMop":
    case "catBowl":
    case "toyMouse":
    case "hangingFern":
    case "spill":
    case "yarnBall":
      return kind;
    case "oval":
      return `oval-${Number(v ?? 0).toString(16)}-${dims}`;
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

export function propArtName(p: PropDef) {
  const w = p.w ?? 1;
  const h = p.h ?? 1;
  if (p.kind === "stairs") return p.f === 0 ? `prop-stairs-up-${w}` : "stairs";
  if (p.kind === "bed") return "bed";
  return `prop-${p.kind}-${w}x${h}`;
}

export function wallArtTheme(pattern: "stripes" | "azulejo" | "damask") {
  return pattern === "azulejo" ? "kitchen" : pattern === "damask" ? "living" : "hall";
}
