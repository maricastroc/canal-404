import * as Phaser from "phaser";
import { BookOpen, CircleDot, Hand, Lightbulb, Map as MapIcon, MapPin, Star, Target, X } from "lucide";
import type { GameHostContext } from "@/games/types";
import { loadIcons } from "../../kit/icons";
import { CHAR_RES } from "../config";

const BASE = "/assets/off-air-vacation/";

const DECO = [
  "idle-f",
  "idle-k",
  "idle-s",
  "act-f",
  "act-k",
  "act-s",
  "cheer",
  "sit",
  ...["a", "b", "c", "d"].flatMap((step) => ["f", "k", "s"].map((dir) => `walk-${step}-${dir}`)),
];

const FOLK_FRAMES: Record<string, string[]> = {
  bigodes: ["normal", "look", "talk", "surprised", "happy"],
  marola: ["sad", "look", "talk", "normal", "talk-w", "happy", "look-w"],
  tilt: ["normal", "look", "talk", "sad", "happy", "surprised", "off"],
  marisa: ["normal", "look", "talk", "happy"],
  psiu: ["normal", "look", "talk", "happy", "sad"],
  lento: ["walk-a", "walk-b", "talk", "walk-a-nokey", "walk-b-nokey", "talk-nokey", "happy-nokey"],
  mascot: ["sleep", "surprised", "excited", "happy"],
  capi: ["normal", "look", "talk", "happy", "surprised", "shake-a", "shake-b"],
  clique: ["normal", "look", "talk", "happy", "sad", "surprised", "shoot"],
  cavuca: ["walk-a", "walk-b", "look", "talk", "happy", "surprised"],
  chiado: ["normal", "look", "happy", "surprised"],
  placar: ["normal", "look", "talk", "happy", "surprised", "sad"],
};

const FACES = [
  ...["bigodes", "marola", "tilt", "marisa", "psiu", "lento", "capi", "clique", "cavuca", "chiado", "placar"].flatMap((id) => ["normal", "talk", "happy", "surprised", "sad"].map((m) => `face-${id}-${m}`)),
  "face-deco-normal",
  "face-deco-happy",
  "face-deco-wow",
  "face-mascot-normal",
  "face-mascot-surprised",
];

const PROPS = `air-hockey arcade-carpet arcade-front arcade-wall beachball bed big-button boardwalk bottle cab-a cab-b cab-c cab-d cab-gold cables calendar
carousel-horse cartridge chair chandelier claw cliff clock column console counter crab-a crab-b curtain-open curtain deckchair desk-bell dish door-404-open
door-404 doormat duck elevator fall-pool fern flamingo-empty flamingo forest-floor frame-cat frame-sunset frame-tv glint grass gull-a gull-b hedge hibiscus
hotel island item-cartridge item-key item-net item-order item-poster item-remote item-token item-whistle juice-bar key-rack kiosk lantern-post lifeguard-chair
lobby-banner lobby-floor lobby-wall lobby-window-a lobby-window-b log lounge-a lounge-b luggage-cart map-island monitor-wall mug mushrooms neon-sign net-pole
nightstand palm-b palm pier pinball placard plant-small plant-tall pool poster-club poster-ghost poster-summer poster-surf poster-tilt prize-counter rock-a
rock-b room-floor room-wall rug-lobby ruin-arch sand sandcastle shed shell-big shells signpost sofa station-floor station-wall station-window statue-404 stone
stool stump suitcases flamingo-look flamingo-empty-look chips records poster-pijama surf-a surf-b surf-c tape-deck ticket-booth towel tree-a tree-b tree-c treehouse tv-lobby umbrella-a umbrella-b waterfall-tile wave-sign`
  .split(/\s+/)
  .filter(Boolean);

const ART_SCALE: Record<string, number> = {
  palm: 1.35,
  "palm-b": 1.35,
  kiosk: 1.3,
  "ticket-booth": 1.4,
  "surf-a": 1.15,
  "surf-b": 1.15,
  "surf-c": 1.15,
  pool: 0.82,
};

export class BootScene extends Phaser.Scene {
  constructor() {
    super("boot");
  }

  preload() {
    const ctx = this.registry.get("ctx") as GameHostContext;
    this.load.on("progress", (value: number) => ctx.onProgress(value, "art"));
    const svg = (key: string, scale = 1) => this.load.svg(key, `${BASE}${key}.svg`, { scale });
    for (const pose of DECO) svg(`deco-${pose}`, CHAR_RES);
    for (const [id, frames] of Object.entries(FOLK_FRAMES)) for (const f of frames) svg(`${id}-${f}`, CHAR_RES);
    for (const key of FACES) svg(key);
    for (const key of PROPS) svg(key, ART_SCALE[key] ?? 1);
    loadIcons(this, [
      { key: "ui-journal", icon: BookOpen, size: 52, color: "#1d1830", fill: "#ffc83d", strokeWidth: 2.4 },
      { key: "ui-map", icon: MapIcon, size: 52, color: "#1d1830", fill: "#93cf4c", strokeWidth: 2.4 },
      { key: "ui-hand", icon: Hand, size: 64, color: "#1d1830", fill: "#fbf5e6", strokeWidth: 2.4 },
      { key: "ui-close", icon: X, size: 48, color: "#1d1830", strokeWidth: 3 },
      { key: "ui-star", icon: Star, size: 48, color: "#1d1830", fill: "#ffc83d", strokeWidth: 2.2 },
      { key: "ui-dot", icon: CircleDot, size: 40, color: "#1d1830", fill: "#fbf5e6", strokeWidth: 2.4 },
      { key: "ui-pin", icon: MapPin, size: 56, color: "#1d1830", fill: "#ef4f43", strokeWidth: 2.2 },
      { key: "ui-target", icon: Target, size: 52, color: "#1d1830", fill: "#ffc83d", strokeWidth: 2.4 },
      { key: "ui-bulb", icon: Lightbulb, size: 44, color: "#1d1830", fill: "#9df0dc", strokeWidth: 2.4 },
    ]);
  }

  create() {
    const ctx = this.registry.get("ctx") as GameHostContext;
    ctx.onProgress(1, "scene");
    this.scene.start("world", { mode: "attract", area: "pool", spawn: "attract" });
  }
}
