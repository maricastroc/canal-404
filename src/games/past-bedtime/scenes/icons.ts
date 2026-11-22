import type * as Phaser from "phaser";
import { BookOpen, Eye, Hourglass, Lightbulb, ListOrdered, Undo2, X } from "lucide";
import { loadIcons, type IconSpec } from "../../kit/icons";

const TEXTURE = 96;

const ICONS = {
  wait: { icon: Hourglass, strokeWidth: 2.4, fill: "#ffe39a" },
  undo: { icon: Undo2, strokeWidth: 2.8 },
  hint: { icon: Lightbulb, strokeWidth: 2.4, fill: "#ffc83d" },
  rules: { icon: BookOpen, strokeWidth: 2.4, fill: "#c8f0b4" },
  moves: { icon: ListOrdered, strokeWidth: 2.6 },
  view: { icon: Eye, strokeWidth: 2.6, fill: "#fbf5e6" },
  close: { icon: X, strokeWidth: 3 },
} satisfies Record<string, Omit<IconSpec, "key" | "size">>;

export type NightIcon = keyof typeof ICONS;

export function iconKey(name: NightIcon) {
  return `pb-icon-${name}`;
}

export function loadNightIcons(scene: Phaser.Scene) {
  const specs: IconSpec[] = (Object.keys(ICONS) as NightIcon[]).filter((name) => !scene.textures.exists(iconKey(name))).map((name) => ({ color: "#1d1830", ...ICONS[name], key: iconKey(name), size: TEXTURE }));
  if (specs.length) loadIcons(scene, specs);
}
