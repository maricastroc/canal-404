import type * as Phaser from "phaser";
import { ArrowBigDown, Lightbulb, Play, RotateCw, Square, Trash, X } from "lucide";
import type { IconSpec } from "../kit/icons";

const INK = "#1d1830";
const CREAM = "#fbf5e6";
const RESOLUTION = 2;

const ICONS = {
  play: { icon: Play, size: 44, strokeWidth: 2.2, fill: CREAM },
  stop: { icon: Square, size: 36, strokeWidth: 2.7, fill: CREAM },
  trash: { icon: Trash, size: 38, strokeWidth: 2.5, fill: "#9aa6b8" },
  hint: { icon: Lightbulb, size: 40, strokeWidth: 2.4, fill: "#ffc83d" },
  rotate: { icon: RotateCw, size: 52, strokeWidth: 3.2 },
  remove: { icon: X, size: 56, strokeWidth: 3.4 },
  "remove-inner": { icon: X, size: 56, strokeWidth: 1.3, color: CREAM },
  "arrow-down": { icon: ArrowBigDown, size: 84, strokeWidth: 2, fill: "#ffc83d" },
} satisfies Record<string, Omit<IconSpec, "key">>;

export type IconName = keyof typeof ICONS;

function iconKey(name: IconName) {
  return `icon-${name}`;
}

export const ICON_SPECS: IconSpec[] = (Object.keys(ICONS) as IconName[]).map((name) => {
  const spec: Omit<IconSpec, "key"> = ICONS[name];
  return { color: INK, ...spec, key: iconKey(name), size: spec.size * RESOLUTION };
});

export function setIcon(image: Phaser.GameObjects.Image, name: IconName, size: number = ICONS[name].size) {
  return image.setTexture(iconKey(name)).setDisplaySize(size, size);
}

export function addIcon(scene: Phaser.Scene, x: number, y: number, name: IconName, size?: number) {
  return setIcon(scene.add.image(x, y, iconKey(name)), name, size);
}
