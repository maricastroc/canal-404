import type * as Phaser from "phaser";
import { ArrowDown, ArrowLeft, ArrowRight, ArrowUp, BookOpen, ChevronDown, ChevronLeft, ChevronRight, ChevronUp, CircleX, EighthNote, Eye, Hourglass, Lightbulb, ListOrdered, PawPrint, RotateCcw, RotateCw, Star, Undo2, X, type IconNode } from "lucide";
import { loadIcons, type IconSpec } from "../../kit/icons";

const TEXTURE = 96;
const BIG = 160;
const INK = "#1d1830";
const SUN = "#ffe39a";

function shrunk(icon: IconNode, fill: string): IconNode {
  return icon.map(([tag, attrs]) => [tag, { ...attrs, transform: "translate(1.2 1.2) scale(0.9)", ...(tag === "circle" ? { fill } : {}) }]);
}

function solidPupil(icon: IconNode): IconNode {
  return icon.map(([tag, attrs]) => [tag, tag === "circle" ? { ...attrs, fill: INK, stroke: INK } : attrs]);
}

type Entry = Omit<IconSpec, "key" | "size"> & { size?: number };

const ICONS = {
  wait: { icon: Hourglass, strokeWidth: 2.4, fill: SUN },
  undo: { icon: Undo2, strokeWidth: 2.8 },
  hint: { icon: Lightbulb, strokeWidth: 2.4, fill: "#ffc83d" },
  restart: { icon: RotateCcw, strokeWidth: 2.8 },
  rules: { icon: BookOpen, strokeWidth: 2.4, fill: "#c8f0b4" },
  moves: { icon: ListOrdered, strokeWidth: 2.6 },
  view: { icon: Eye, strokeWidth: 2.6, fill: "#fbf5e6" },
  close: { icon: X, strokeWidth: 3 },
  watched: { icon: solidPupil(Eye), strokeWidth: 2.2, color: "#b8690c", fill: "#fffbe8", size: BIG },
  paw: { icon: PawPrint, strokeWidth: 2.4, color: "#1d1830", fill: "#ffd39a", size: BIG },
  padUp: { icon: ChevronUp, strokeWidth: 3.6, size: BIG },
  padRight: { icon: ChevronRight, strokeWidth: 3.6, size: BIG },
  padDown: { icon: ChevronDown, strokeWidth: 3.6, size: BIG },
  padLeft: { icon: ChevronLeft, strokeWidth: 3.6, size: BIG },
  arrowUp: { icon: ArrowUp, strokeWidth: 3.2, size: BIG },
  arrowRight: { icon: ArrowRight, strokeWidth: 3.2, size: BIG },
  arrowDown: { icon: ArrowDown, strokeWidth: 3.2, size: BIG },
  arrowLeft: { icon: ArrowLeft, strokeWidth: 3.2, size: BIG },
  exitUp: { icon: ArrowUp, strokeWidth: 2.8, color: "#fbf5e6" },
  exitRight: { icon: ArrowRight, strokeWidth: 2.8, color: "#fbf5e6" },
  exitLeft: { icon: ArrowLeft, strokeWidth: 2.8, color: "#fbf5e6" },
  star: { icon: Star, strokeWidth: 2.2, fill: "#ffc83d", size: BIG },
  starEmpty: { icon: Star, strokeWidth: 2.2, size: BIG },
  more: { icon: ChevronDown, strokeWidth: 3.6, color: "#c94785" },
  note: { icon: shrunk(EighthNote, SUN), strokeWidth: 2.8, color: SUN, size: BIG },
  noteEdge: { icon: shrunk(EighthNote, INK), strokeWidth: 6, size: BIG },
  toss: { icon: RotateCw, strokeWidth: 2.8 },
  near: { icon: CircleX, strokeWidth: 2.4, fill: "#ff9d8a" },
} satisfies Record<string, Entry>;

export type NightIcon = keyof typeof ICONS;

export const ARROW_ICONS = ["arrowUp", "arrowRight", "arrowDown", "arrowLeft"] as const satisfies readonly NightIcon[];

export const PAD_ICONS = ["padUp", "padRight", "padDown", "padLeft"] as const satisfies readonly NightIcon[];

export const STAR_ORIGIN_Y = 0.522;

export const STAR_SPAN = 2.3;

export function iconKey(name: NightIcon) {
  return `pb-icon-${name}`;
}

export function loadNightIcons(scene: Phaser.Scene) {
  const specs: IconSpec[] = (Object.keys(ICONS) as NightIcon[])
    .filter((name) => !scene.textures.exists(iconKey(name)))
    .map((name) => {
      const { size, ...spec }: Entry = ICONS[name];
      return { color: INK, ...spec, key: iconKey(name), size: size ?? TEXTURE };
    });
  if (specs.length) loadIcons(scene, specs);
}
