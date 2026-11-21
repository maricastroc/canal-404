import { mkdirSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { LEVELS } from "../../src/games/past-bedtime/sim/levels";
import { characters } from "./characters";
import { house } from "./house";
import { residents } from "./residents";
import { rooms } from "./rooms";
import type { Sheet } from "./kit";

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, "..", "..");
const out = join(root, "public", "assets", "past-bedtime");
const manifest = join(root, "src", "games", "past-bedtime", "scenes", "artManifest.ts");

const sheet: Sheet = { ...characters(join(here, "source")), ...residents(), ...house(LEVELS), ...rooms(LEVELS) };

rmSync(out, { recursive: true, force: true });
mkdirSync(out, { recursive: true });
const lines = ["export const ART_FILES: Record<string, readonly [number, number, number, number, number]> = {"];
for (const name of Object.keys(sheet).sort()) {
  const { svg, res } = sheet[name];
  const vb = /viewBox="([^"]+)"/.exec(svg)?.[1].split(/\s+/).map(Number) ?? [0, 0, 100, 100];
  const sized = svg.replace("<svg ", `<svg width="${vb[2]}" height="${vb[3]}" `);
  writeFileSync(join(out, `${name}.svg`), sized);
  lines.push(`  "${name}": [${vb.join(", ")}, ${res ?? 2}],`);
}
lines.push("};", "");
writeFileSync(manifest, lines.join("\n"));
console.log(`${readdirSync(out).length} files in public/assets/past-bedtime`);
