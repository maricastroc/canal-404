import type { Sheet } from "../past-bedtime-art/kit";

type Swap = readonly [string, string];

const INK = "#1d1830";
const SWEAT = `<path d="M22 16 Q14 30 22 35 Q30 30 22 16 Z" fill="#9fd8f5" stroke="${INK}" stroke-width="3" stroke-linejoin="round"/>`;

const FACES: Record<string, { from: string; swaps: Swap[]; add?: string }> = {
  "jury-inspector-frown": {
    from: "jury-inspector-neutral",
    swaps: [
      ['<path d="M132 58 L174 74 M228 58 L186 74"', '<path d="M134 66 L176 80 M226 66 L184 80"'],
      ['<circle cx="158" cy="94" r="5" fill="#1d1830"/><circle cx="210" cy="94" r="5" fill="#1d1830"/>', '<rect x="150" y="92" width="14" height="5" rx="2.5" fill="#1d1830"/><rect x="202" y="92" width="14" height="5" rx="2.5" fill="#1d1830"/>'],
      ['<path d="M160 158 Q184 144 208 158"', '<path d="M162 162 Q184 148 206 162"'],
    ],
    add: `<path d="M172 46 Q180 40 188 46 M168 36 Q180 30 192 36" fill="none" stroke="${INK}" stroke-width="4" stroke-linecap="round" transform="translate(0 34)"/>`,
  },
  "jury-inspector-nod": {
    from: "jury-inspector-neutral",
    swaps: [
      ['<path d="M132 58 L174 74 M228 58 L186 74"', '<path d="M134 66 Q154 60 174 68 M226 66 Q206 60 186 68"'],
      ['<path d="M160 158 Q184 144 208 158"', '<path d="M164 152 Q184 162 204 152"'],
    ],
  },
  "jury-arlindo-happy": {
    from: "jury-arlindo-neutral",
    swaps: [
      ['<path d="M44 44 L66 52 M106 44 L84 52" stroke-width="7"/>', '<path d="M44 40 Q55 32 66 40 M84 40 Q95 32 106 40" fill="none" stroke-width="7"/>'],
      ['<circle cx="60" cy="60" r="4" fill="#1d1830" stroke="none"/>', '<path d="M52 62 Q58 54 64 62" fill="none" stroke-width="4"/>'],
      ['<circle cx="90" cy="60" r="4" fill="#1d1830" stroke="none"/>', '<path d="M86 62 Q92 54 98 62" fill="none" stroke-width="4"/>'],
      ['<path d="M64 92 Q75 86 86 92" fill="none" stroke-width="4"/>', '<path d="M60 88 Q75 104 90 88 Z" fill="#1d1830" stroke-width="4"/><path d="M68 95 Q75 91 82 95" fill="none" stroke="#ef4f43" stroke-width="4"/>'],
    ],
    add: `<g fill="#ff9d8a" opacity="0.6"><ellipse cx="44" cy="74" rx="8" ry="5"/><ellipse cx="106" cy="74" rx="8" ry="5"/></g>`,
  },
  "jury-arlindo-oops": {
    from: "jury-arlindo-neutral",
    swaps: [
      ['<path d="M44 44 L66 52 M106 44 L84 52" stroke-width="7"/>', '<path d="M44 40 L66 32 M106 40 L84 32" stroke-width="7"/>'],
      ['<circle cx="60" cy="60" r="4" fill="#1d1830" stroke="none"/>', '<circle cx="54" cy="56" r="3" fill="#1d1830" stroke="none"/>'],
      ['<circle cx="90" cy="60" r="4" fill="#1d1830" stroke="none"/>', '<circle cx="88" cy="56" r="3" fill="#1d1830" stroke="none"/>'],
      ['<path d="M64 92 Q75 86 86 92" fill="none" stroke-width="4"/>', '<path d="M60 92 Q66 86 72 92 Q78 98 84 92 Q87 89 90 91" fill="none" stroke-width="4"/>'],
    ],
    add: SWEAT,
  },
  "jury-lunch-happy": {
    from: "jury-lunch-neutral",
    swaps: [
      ['<circle cx="74" cy="106" r="4.5" fill="#1d1830" stroke="none"/>', '<path d="M66 108 Q72 99 78 108" fill="none" stroke-width="4"/>'],
      ['<circle cx="110" cy="106" r="4.5" fill="#1d1830" stroke="none"/>', '<path d="M102 108 Q108 99 114 108" fill="none" stroke-width="4"/>'],
      ['<path d="M60 86 Q72 82 82 86 M98 86 Q108 82 120 86"', '<path d="M60 82 Q72 74 82 80 M98 80 Q108 74 120 82"'],
      ['<path d="M78 134 Q90 142 102 134" fill="none" stroke-width="4.5"/>', '<path d="M74 130 Q90 152 106 130 Z" fill="#1d1830" stroke-width="4.5"/><path d="M82 141 Q90 136 98 141" fill="none" stroke="#ef4f43" stroke-width="4.5"/>'],
      ['<g fill="#ff9d8a" opacity="0.5" stroke="none">', '<g fill="#ff9d8a" opacity="0.85" stroke="none">'],
    ],
  },
  "jury-lunch-wow": {
    from: "jury-lunch-neutral",
    swaps: [
      ['<circle cx="74" cy="106" r="4.5" fill="#1d1830" stroke="none"/>', '<circle cx="72" cy="104" r="3.5" fill="#1d1830" stroke="none"/>'],
      ['<circle cx="110" cy="106" r="4.5" fill="#1d1830" stroke="none"/>', '<circle cx="108" cy="104" r="3.5" fill="#1d1830" stroke="none"/>'],
      ['<path d="M60 86 Q72 82 82 86 M98 86 Q108 82 120 86"', '<path d="M60 78 Q72 68 82 76 M98 76 Q108 68 120 78"'],
      ['<path d="M78 134 Q90 142 102 134" fill="none" stroke-width="4.5"/>', '<ellipse cx="90" cy="137" rx="8" ry="10" fill="#1d1830" stroke-width="4"/>'],
    ],
  },
};

export function juryFaces(sources: Sheet): Sheet {
  const sheet: Sheet = {};
  for (const [name, face] of Object.entries(FACES)) {
    const base = sources[face.from];
    if (!base) throw new Error(`${name}: ${face.from} not found`);
    let svg = base.svg;
    for (const [from, to] of face.swaps) {
      if (!svg.includes(from)) throw new Error(`${name}: path not found ${from.slice(0, 40)}`);
      svg = svg.replace(from, to);
    }
    if (face.add) svg = svg.replace(/<\/svg>\s*$/, `${face.add}</svg>`);
    sheet[name] = { svg };
  }
  return sheet;
}
