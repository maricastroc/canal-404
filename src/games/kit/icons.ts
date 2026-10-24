import * as Phaser from "phaser";
import type { IconNode } from "lucide";

export type IconSpec = {
  key: string;
  icon: IconNode;
  size: number;
  color?: string;
  strokeWidth?: number;
  fill?: string;
};

function attributes(attrs: Record<string, string | number | undefined>) {
  return Object.entries(attrs)
    .filter(([, value]) => value !== undefined)
    .map(([name, value]) => `${name}="${String(value)}"`)
    .join(" ");
}

export function iconSvg({ icon, size, color = "#1d1830", strokeWidth = 2.6, fill = "none" }: Omit<IconSpec, "key">) {
  const body = icon.map(([tag, attrs]) => `<${tag} ${attributes(attrs as Record<string, string | number | undefined>)}/>`).join("");
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 24 24" fill="${fill}" stroke="${color}" stroke-width="${strokeWidth}" stroke-linecap="round" stroke-linejoin="round">${body}</svg>`;
}

export function loadIcons(scene: Phaser.Scene, specs: IconSpec[]) {
  const urls: string[] = [];
  for (const spec of specs) {
    const url = URL.createObjectURL(new Blob([iconSvg(spec)], { type: "image/svg+xml" }));
    urls.push(url);
    scene.load.svg(spec.key, url, { width: spec.size, height: spec.size });
  }
  scene.load.once(Phaser.Loader.Events.COMPLETE, () => urls.forEach((url) => URL.revokeObjectURL(url)));
}
