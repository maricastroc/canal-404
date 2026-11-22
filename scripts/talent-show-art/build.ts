import { mkdirSync, readdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import type { Sheet } from "../past-bedtime-art/kit";
import { HOST_BOX } from "../../src/games/talent-show/scenes/figure";
import { band } from "./band";
import { studioSheet } from "./studio";

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, "..", "..");
const source = join(here, "source");
const out = join(root, "public", "assets", "talent-show");
const manifest = join(root, "src", "games", "talent-show", "scenes", "artManifest.ts");

const sources: Sheet = {};
for (const file of readdirSync(source).filter((f) => f.endsWith(".svg"))) sources[file.replace(/\.svg$/, "")] = { svg: readFileSync(join(source, file), "utf8") };

const VIEWBOX: Record<string, string> = {
  "jury-inspector-neutral": "0 -30 380 476",
  "jury-inspector-angry": "0 -30 380 476",
  "jury-inspector-shock": "0 -30 380 476",
  "jury-lunch-neutral": "0 0 220 476",
  "jury-lunch-angry": "0 0 220 476",
};
for (const name of Object.keys(sources).filter((n) => n.startsWith("host-"))) VIEWBOX[name] = `${HOST_BOX.x} ${HOST_BOX.y} ${HOST_BOX.w} ${HOST_BOX.h}`;
for (const [name, box] of Object.entries(VIEWBOX)) if (sources[name]) sources[name] = { svg: sources[name].svg.replace(/viewBox="[^"]*"/, `viewBox="${box}"`) };

const SHOULDERS = 'd="M18 222 Q22 184 64 174 L136 174 Q178 184 182 222 Z"';
const OPEN_SHOULDERS = 'd="M16 240 L18 222 Q22 184 64 174 L136 174 Q178 184 182 222 L184 240 Z"';
for (const name of Object.keys(sources).filter((n) => n.startsWith("head-"))) {
  if (!sources[name].svg.includes(SHOULDERS)) throw new Error(`${name}: bust shoulders not found`);
  sources[name] = { svg: sources[name].svg.replace(SHOULDERS, OPEN_SHOULDERS) };
}

const sheet: Sheet = { ...sources, ...band(), ...studioSheet() };

rmSync(out, { recursive: true, force: true });
mkdirSync(out, { recursive: true });
const lines = ["export const ART_FILES: Record<string, readonly [number, number, number, number, number]> = {"];
for (const name of Object.keys(sheet).sort()) {
  const { svg, res } = sheet[name];
  const open = /<svg\b[^>]*>/.exec(svg)?.[0] ?? "<svg>";
  const vb = /viewBox="([^"]+)"/.exec(open)?.[1].split(/[\s,]+/).map(Number) ?? [0, 0, 100, 100];
  const cleaned = open.replace(/\s(width|height)="[^"]*"/g, "").replace("<svg", `<svg width="${vb[2]}" height="${vb[3]}"`);
  writeFileSync(join(out, `${name}.svg`), svg.replace(open, cleaned));
  lines.push(`  "${name}": [${vb.join(", ")}, ${res ?? 2}],`);
}
lines.push("};", "");
writeFileSync(manifest, lines.join("\n"));
console.log(`${readdirSync(out).length} files in public/assets/talent-show`);
