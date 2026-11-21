import { readFileSync } from "node:fs";
import { join } from "node:path";
import { ink, limb, P, svg, sweat, type Sheet } from "./kit";

const HAIR = "#4a2c1c";
const HAIR_HI = "#6b4430";
const DAD_HAIR = "#2a1d1a";

export const BRUNO_BOX = { x: 4, y: -24, w: 142, h: 244, feetX: 75, feetY: 210, top: -18 };
export const BRUNO_FACES = ["calm", "sneak", "tense", "breath", "scared", "caught", "happy", "relief"] as const;
type Face = (typeof BRUNO_FACES)[number];

const HEAD = "translate(-1 -31) scale(0.76)";

function eyes(face: Face, blink: boolean) {
  const xs = [77, 123];
  if (face === "breath") return `<path d="M64 104 L88 108 L64 112 M136 104 L112 108 L136 112" fill="none" ${ink(5)}/>`;
  if (face === "relief") return `<path d="M65 106 Q77 116 89 106 M111 106 Q123 116 135 106" fill="none" ${ink(5.5)}/>`;
  if (blink) return `<path d="M65 110 Q77 117 89 110 M111 110 Q123 117 135 110" fill="none" ${ink(5)}/>`;
  if (face === "happy") return `<path d="M66 112 Q77 99 88 112 M112 112 Q123 99 134 112" fill="none" ${ink(5.5)}/>`;
  const wide = face === "scared" || face === "caught";
  const ry = wide ? 16 : 13.5;
  const look = face === "sneak" ? 6 : face === "caught" ? 0 : 2;
  const lookY = face === "sneak" ? 2 : face === "caught" ? 3 : 1;
  const pr = wide ? 4 : 6.5;
  return xs.map((x) => `<ellipse cx="${x}" cy="108" rx="12.5" ry="${ry}" fill="${P.white}" ${ink(4)}/><circle cx="${x + look}" cy="${108 + lookY}" r="${pr}" fill="${P.ink}"/><circle cx="${x + look + 2}" cy="${105 + lookY}" r="2" fill="${P.white}"/>`).join("");
}

function brows(face: Face) {
  const d: Record<Face, string> = {
    calm: "M62 82 Q76 76 90 80 M110 80 Q124 76 138 82",
    sneak: "M62 86 Q76 82 90 86 M110 86 Q124 82 138 86",
    tense: "M62 88 Q78 82 90 72 M110 72 Q122 82 138 88",
    breath: "M62 88 Q78 82 90 76 M110 76 Q122 82 138 88",
    scared: "M60 72 Q76 58 92 68 M108 68 Q124 58 140 72",
    caught: "M62 82 Q78 74 90 66 M110 66 Q122 74 138 82",
    happy: "M62 76 Q76 66 90 72 M110 72 Q124 66 138 76",
    relief: "M62 80 Q76 72 90 78 M110 78 Q124 72 138 80",
  };
  return `<path d="${d[face]}" fill="none" ${ink(5.5)}/>`;
}

function mouth(face: Face) {
  switch (face) {
    case "sneak":
      return `<path d="M90 140 Q100 143 110 138" fill="none" ${ink(4.5)}/>`;
    case "tense":
      return `<path d="M82 142 L88 136 L94 142 L100 136 L106 142 L112 136 L118 142" fill="none" ${ink(4)}/>`;
    case "breath":
      return `<path d="M92 140 Q100 135 108 140" fill="none" ${ink(4.5)}/><circle cx="62" cy="128" r="12" fill="${P.blush}" opacity="0.85"/><circle cx="138" cy="128" r="12" fill="${P.blush}" opacity="0.85"/><path d="M48 116 Q40 132 54 144 M152 116 Q160 132 146 144" fill="none" ${ink(3.5)}/>`;
    case "scared":
      return `<ellipse cx="100" cy="143" rx="10" ry="14" fill="${P.ink}"/><ellipse cx="100" cy="150" rx="6" ry="4.5" fill="${P.bubblegum}"/>`;
    case "caught":
      return `<path d="M74 132 Q100 128 126 132 Q124 154 100 156 Q76 154 74 132 Z" fill="${P.white}" ${ink(4)}/><path d="M76 142 L124 142 M87 132 L87 154 M100 130 L100 156 M113 132 L113 154" stroke="${P.ink}" stroke-width="2.5" fill="none"/><circle cx="60" cy="130" r="10" fill="${P.blush}" opacity="0.75"/><circle cx="140" cy="130" r="10" fill="${P.blush}" opacity="0.75"/>`;
    case "happy":
      return `<path d="M80 136 Q100 160 120 136 Z" fill="${P.ink}" ${ink(4)}/><path d="M85 138 L115 138 L113 143 L87 143 Z" fill="${P.white}"/><path d="M91 150 Q100 145 109 150 Q100 155 91 150 Z" fill="${P.bubblegum}"/><circle cx="62" cy="130" r="9" fill="${P.blush}" opacity="0.6"/><circle cx="138" cy="130" r="9" fill="${P.blush}" opacity="0.6"/>`;
    case "relief":
      return `<ellipse cx="104" cy="141" rx="6" ry="5" fill="${P.ink}"/><path d="M118 140 Q132 134 136 142 Q144 140 146 148 Q140 156 128 152 Q120 154 118 148 Z" fill="#e9f2f6" ${ink(2.5)}/><circle cx="62" cy="128" r="9" fill="${P.blush}" opacity="0.6"/><circle cx="138" cy="128" r="9" fill="${P.blush}" opacity="0.6"/>`;
    default:
      return `<path d="M84 138 Q100 150 118 134" fill="none" ${ink(5)}/>`;
  }
}

function headFront(face: Face, blink: boolean) {
  const skin = face === "breath" ? "#f4c4c8" : P.skinLight;
  return `<g transform="${HEAD}">
    <path d="M84 150 L84 180 Q100 188 116 180 L116 150 Z" fill="${skin}" ${ink(4)}/>
    <path d="M84 158 Q100 170 116 158 L116 168 Q100 178 84 168 Z" fill="${P.skinLightShade}"/>
    <path d="M74 172 L100 196 L126 172 L114 168 L100 182 L86 168 Z" fill="${P.white}" ${ink(4)}/>
    <ellipse cx="50" cy="112" rx="11" ry="14" fill="${skin}" ${ink(4)}/>
    <ellipse cx="150" cy="112" rx="11" ry="14" fill="${skin}" ${ink(4)}/>
    <path d="M50 104 Q48 50 100 48 Q152 50 150 104 Q152 160 100 162 Q48 160 50 104 Z" fill="${skin}" ${ink(5)}/>
    <path d="M140 80 Q156 116 136 150 Q122 160 104 160 Q140 140 140 80 Z" fill="${P.skinLightShade}" opacity="0.6"/>
    <path d="M46 100 Q38 50 92 38 Q146 30 158 80 Q160 96 152 100 Q148 72 118 70 Q98 82 70 74 Q58 84 56 104 Z" fill="${HAIR}" ${ink(5)}/>
    <path d="M96 40 Q104 22 118 26 Q108 30 106 42" fill="${HAIR}" ${ink(4)}/>
    <path d="M70 60 Q92 52 118 58" fill="none" stroke="${HAIR_HI}" stroke-width="4" stroke-linecap="round"/>
    ${eyes(face, blink)}
    <g fill="none">
      <circle cx="77" cy="108" r="21" fill="${P.skyPale}" fill-opacity="0.3" ${ink(5)}/>
      <circle cx="123" cy="108" r="21" fill="${P.skyPale}" fill-opacity="0.3" ${ink(5)}/>
      <path d="M98 106 Q100 102 102 106" ${ink(4)}/>
      <path d="M56 104 L50 100 M144 104 L150 100" ${ink(4)}/>
      <path d="M64 96 Q70 90 78 92" stroke="${P.white}" stroke-width="3.5" stroke-linecap="round"/>
    </g>
    ${brows(face)}
    <path d="M100 116 Q96 128 104 129" fill="none" ${ink(3.5)}/>
    ${mouth(face)}
    ${face === "tense" || face === "scared" || face === "caught" ? sweat(160, 70, 1.4) : ""}
    ${face === "caught" ? sweat(40, 86, 1.2) : ""}
    ${face === "relief" ? sweat(158, 100, 1.1) : ""}
    ${face === "scared" ? `<path d="M70 30 L66 14 M100 24 L100 6 M130 30 L134 14" fill="none" ${ink(4)}/>` : ""}
  </g>`;
}

function notebook(x: number, y: number, rot: number) {
  return `<g transform="translate(${x} ${y}) rotate(${rot})"><rect x="-13" y="-17" width="26" height="34" rx="3" fill="${P.cream}" ${ink(4)}/><path d="M-6 -17 L-6 17" stroke="${P.tomato}" stroke-width="2.2"/><path d="M-1 -8 L9 -8 M-1 -1 L9 -1 M-1 6 L7 6" stroke="#9cc7ea" stroke-width="2" stroke-linecap="round"/><path d="M-13 -11 L-17 -11 M-13 -3 L-17 -3 M-13 5 L-17 5 M-13 13 L-17 13" stroke="${P.ink}" stroke-width="2.5" stroke-linecap="round"/></g>`;
}

const slipper = (x: number, y: number) =>
  `<path d="M${x - 15} ${y + 9} Q${x - 16} ${y - 5} ${x} ${y - 5} Q${x + 16} ${y - 5} ${x + 15} ${y + 9} Z" fill="${P.mint}" ${ink(4)}/><path d="M${x - 8} ${y + 1} Q${x} ${y - 5} ${x + 8} ${y + 1}" fill="none" stroke="${P.white}" stroke-width="3" stroke-linecap="round"/>`;

function torso(back: boolean) {
  return `<path d="M46 122 Q48 106 75 102 Q102 106 104 122 L105 172 L45 172 Z" fill="${P.sky}" ${ink(5)}/>
    <path d="M58 110 L57 170 M75 104 L75 170 M92 110 L93 170" stroke="${P.skyPale}" stroke-width="3.5" opacity="0.9"/>
    <path d="M88 126 L103 126 L105 172 L92 172 Z" fill="${P.skyDeep}" opacity="0.55"/>
    ${back ? "" : `<circle cx="75" cy="126" r="2.8" fill="${P.white}" ${ink(1.5)}/><circle cx="75" cy="141" r="2.8" fill="${P.white}" ${ink(1.5)}/><circle cx="75" cy="156" r="2.8" fill="${P.white}" ${ink(1.5)}/>`}
    <path d="M45 166 L105 166" stroke="${P.skyDeep}" stroke-width="5"/>`;
}

const BOX = `${BRUNO_BOX.x} ${BRUNO_BOX.y} ${BRUNO_BOX.w} ${BRUNO_BOX.h}`;

function front(face: Face, blink: boolean) {
  return svg(BOX, `
    ${limb("M63 168 L61 196", P.skyDeep, 21)}
    ${limb("M87 168 L89 196", P.skyDeep, 21)}
    ${slipper(58, 203)}${slipper(92, 203)}
    ${limb("M51 126 Q40 146 45 162", P.sky)}
    <circle cx="45" cy="164" r="9.5" fill="${P.skinLight}" ${ink(4)}/>
    ${torso(false)}
    ${notebook(97, 146, 10)}
    ${limb("M99 126 Q112 140 105 154", P.sky)}
    <circle cx="104" cy="156" r="9.5" fill="${P.skinLight}" ${ink(4)}/>
    ${headFront(face, blink)}`);
}

function back() {
  return svg(BOX, `
    ${limb("M63 168 L61 196", P.skyDeep, 21)}
    ${limb("M87 168 L89 196", P.skyDeep, 21)}
    <ellipse cx="60" cy="205" rx="14" ry="7" fill="${P.mintDeep}" ${ink(4)}/><ellipse cx="90" cy="205" rx="14" ry="7" fill="${P.mintDeep}" ${ink(4)}/>
    ${torso(true)}
    ${limb("M51 126 Q40 146 45 162", P.sky)}
    <circle cx="45" cy="164" r="9.5" fill="${P.skinLight}" ${ink(4)}/>
    ${limb("M99 126 Q110 146 105 162", P.sky)}
    <circle cx="105" cy="164" r="9.5" fill="${P.skinLight}" ${ink(4)}/>
    <g transform="${HEAD}">
      <path d="M84 150 L84 180 Q100 188 116 180 L116 150 Z" fill="${P.skinLight}" ${ink(4)}/>
      <path d="M74 172 Q100 184 126 172" fill="none" stroke="${P.white}" stroke-width="8" stroke-linecap="round"/>
      <ellipse cx="48" cy="112" rx="11" ry="14" fill="${P.skinLight}" ${ink(4)}/>
      <ellipse cx="152" cy="112" rx="11" ry="14" fill="${P.skinLight}" ${ink(4)}/>
      <path d="M48 108 Q42 44 100 40 Q158 44 152 108 Q154 158 100 160 Q46 158 48 108 Z" fill="${HAIR}" ${ink(5)}/>
      <path d="M96 40 Q104 22 118 26 Q108 30 106 42" fill="${HAIR}" ${ink(4)}/>
      <path d="M70 66 Q100 52 130 66 M76 100 Q100 90 124 100 M84 130 Q100 124 116 130" fill="none" stroke="${HAIR_HI}" stroke-width="4" stroke-linecap="round"/>
      <path d="M58 70 Q68 56 84 52" fill="none" stroke="#8a5a3c" stroke-width="4" stroke-linecap="round" opacity="0.8"/>
    </g>`);
}

const SIDE_HEAD: Record<Face, string> = { calm: "normal", sneak: "smug", tense: "sad", breath: "strain", scared: "panic", caught: "wow", happy: "happy", relief: "happy" };

function side(face: Face, source: string) {
  const raw = readFileSync(join(source, `side-head-${SIDE_HEAD[face]}.svg`), "utf8");
  const inner = raw.replace(/^<svg[^>]*>/, "").replace(/<\/svg>\s*$/, "");
  return svg(BOX, `
    ${limb("M70 168 L58 196", P.skyDeep, 21)}
    <path d="M43 209 Q41 196 56 195 L66 196 Q72 201 70 209 Z" fill="${P.mintDeep}" ${ink(4)}/>
    ${limb("M80 168 L91 196", P.skyDeep, 21)}
    <path d="M80 209 Q80 196 93 195 L103 196 Q111 201 109 209 Z" fill="${P.mint}" ${ink(4)}/>
    <path d="M57 122 Q59 106 77 104 Q95 106 97 122 L98 172 L56 172 Z" fill="${P.sky}" ${ink(5)}/>
    <path d="M68 108 L68 170 M85 108 L86 170" stroke="${P.skyPale}" stroke-width="3.5" opacity="0.9"/>
    <path d="M56 166 L98 166" stroke="${P.skyDeep}" stroke-width="5"/>
    ${notebook(105, 140, 6)}
    ${limb("M76 126 Q86 146 101 148", P.sky)}
    <circle cx="102" cy="149" r="9.5" fill="${P.skinLight}" ${ink(4)}/>
    <g transform="translate(78 114) scale(0.72) translate(-103 -180)">${inner}</g>
    ${face === "relief" ? `<path d="M122 66 Q134 60 138 68 Q146 66 148 74 Q142 82 130 78 Q122 80 120 74 Z" fill="#e9f2f6" ${ink(2.5)}/>` : ""}
    ${face === "scared" ? `<path d="M60 4 L54 -10 M80 0 L80 -16 M100 4 L106 -10" fill="none" ${ink(4)}/>` : ""}`);
}

type Look = "down" | "left" | "right" | "up";

function dadHead(mood: string, look: Look) {
  const lx = look === "left" ? -7 : look === "right" ? 7 : 0;
  const ly = look === "down" ? 4 : look === "up" ? -4 : 0;
  let eyesSvg: string;
  if (mood === "sleep") eyesSvg = `<path d="M64 108 Q77 116 90 108 M110 108 Q123 116 136 108" fill="none" ${ink(5)}/>`;
  else if (mood === "stir") eyesSvg = `<path d="M64 108 Q77 116 90 108" fill="none" ${ink(5)}/><ellipse cx="123" cy="110" rx="12" ry="6" fill="${P.white}" ${ink(4)}/><circle cx="125" cy="111" r="4" fill="${P.ink}"/><path d="M110 104 L136 104" ${ink(5)}/>`;
  else if (mood === "sleepy") eyesSvg = `<ellipse cx="77" cy="110" rx="12" ry="7" fill="${P.white}" ${ink(4)}/><ellipse cx="123" cy="110" rx="12" ry="7" fill="${P.white}" ${ink(4)}/><circle cx="77" cy="112" r="4" fill="${P.ink}"/><circle cx="123" cy="112" r="4" fill="${P.ink}"/><path d="M62 106 L92 106 M108 106 L138 106" ${ink(5)}/>`;
  else if (mood === "suspicious") eyesSvg = [77, 123].map((x) => `<ellipse cx="${x}" cy="110" rx="12" ry="7" fill="${P.white}" ${ink(4)}/><circle cx="${x + lx}" cy="${110 + ly * 0.5}" r="4.5" fill="${P.ink}"/>`).join("") + `<path d="M64 106 L90 104 M110 104 L136 106" ${ink(4.5)}/>`;
  else {
    const ry = mood === "angry" ? 11 : 16;
    const pr = mood === "startled" ? 3.5 : 5;
    eyesSvg = [77, 123].map((x) => `<ellipse cx="${x}" cy="108" rx="13" ry="${ry}" fill="${P.white}" ${ink(4)}/><circle cx="${x + lx}" cy="${108 + ly}" r="${pr}" fill="${P.ink}"/><circle cx="${x + lx + 2}" cy="${105 + ly}" r="1.6" fill="${P.white}"/>`).join("");
  }
  const browD: Record<string, string> = {
    sleep: "M60 92 Q76 88 92 92 M108 92 Q124 88 140 92",
    stir: "M60 94 Q76 90 92 94 M108 90 Q124 80 140 88",
    sleepy: "M60 96 Q76 92 92 96 M108 96 Q124 92 140 96",
    suspicious: "M58 90 L94 96 M106 82 Q124 70 142 80",
    startled: "M56 76 Q76 60 94 74 M106 74 Q124 60 144 76",
    angry: "M58 84 L94 100 M106 100 L142 84",
  };
  const mouthSvg: Record<string, string> = {
    sleep: `<ellipse cx="100" cy="150" rx="11" ry="8" fill="${P.ink}"/><ellipse cx="100" cy="153" rx="6" ry="3" fill="${P.bubblegum}"/>`,
    stir: `<path d="M90 150 Q100 146 110 151" fill="none" ${ink(4)}/>`,
    sleepy: `<ellipse cx="100" cy="152" rx="13" ry="15" fill="${P.ink}"/><ellipse cx="100" cy="159" rx="8" ry="5" fill="${P.bubblegum}"/>`,
    suspicious: `<path d="M86 152 Q100 148 116 144" fill="none" ${ink(4.5)}/>`,
    startled: `<ellipse cx="100" cy="153" rx="10" ry="13" fill="${P.ink}"/>`,
    angry: `<path d="M74 142 Q100 136 126 142 Q122 174 100 176 Q78 174 74 142 Z" fill="${P.ink}" ${ink(4)}/><path d="M80 143 Q100 139 120 143 L118 149 Q100 146 82 149 Z" fill="${P.white}"/><path d="M88 165 Q100 157 112 165 Q100 171 88 165 Z" fill="${P.bubblegum}"/>`,
  };
  const spiky = mood === "startled" || mood === "angry";
  const hair = spiky
    ? "M44 100 Q36 52 66 40 L64 16 L84 34 L96 8 L108 34 L126 12 L130 40 Q164 52 156 100 Q150 80 134 74 Q118 84 100 74 Q82 84 66 74 Q52 82 50 104 Z"
    : "M44 100 Q36 52 70 40 L76 26 L88 38 L100 20 L110 38 L126 26 L128 42 Q162 52 156 100 Q150 80 134 74 Q118 84 100 74 Q82 84 66 74 Q52 82 50 104 Z";
  return `
    <ellipse cx="48" cy="112" rx="11" ry="14" fill="${P.skinTan}" ${ink(4)}/>
    <ellipse cx="152" cy="112" rx="11" ry="14" fill="${P.skinTan}" ${ink(4)}/>
    <path d="M48 106 Q46 50 100 46 Q154 50 152 106 Q154 166 100 168 Q46 166 48 106 Z" fill="${mood === "angry" ? "#e98a6e" : P.skinTan}" ${ink(5)}/>
    <path d="M140 82 Q158 120 136 156 Q122 166 104 166 Q140 144 140 82 Z" fill="${P.skinTanShade}" opacity="0.6"/>
    <path d="${hair}" fill="${DAD_HAIR}" ${ink(5)}/>
    <path d="M44 100 L44 124 Q50 124 52 112 Z M156 100 L156 124 Q150 124 148 112 Z" fill="${DAD_HAIR}" ${ink(3)}/>
    ${eyesSvg}
    <path d="${browD[mood]}" fill="none" ${ink(7)}/>
    <path d="M96 112 Q92 130 104 130 Q112 128 106 118" fill="${P.skinTanShade}" ${ink(4)}/>
    <path d="M100 134 Q86 128 70 138 Q78 146 92 142 Q98 140 100 137 Q102 140 108 142 Q122 146 130 138 Q114 128 100 134 Z" fill="${DAD_HAIR}" ${ink(3.5)}/>
    ${mouthSvg[mood]}
    ${mood === "angry" ? `<g transform="translate(150 50)" fill="none" stroke="${P.tomato}" stroke-width="6" stroke-linecap="round"><path d="M-12 -4 Q-4 -4 -4 -12 M4 -12 Q4 -4 12 -4 M12 4 Q4 4 4 12 M-4 12 Q-4 4 -12 4"/></g>` : ""}
    ${mood === "startled" ? `<path d="M30 70 L14 62 M28 92 L10 92 M170 70 L186 62 M172 92 L190 92" fill="none" ${ink(5)}/>` : ""}
    ${mood === "suspicious" ? `<path d="M158 88 Q170 84 174 92" fill="none" ${ink(3)}/>` : ""}`;
}

const blanket = (top: number) => `
  <path d="M10 ${top + 8} Q12 ${top} 50 ${top} Q88 ${top} 90 ${top + 8} L92 186 Q50 194 8 186 Z" fill="#5d7cb0" ${ink(3.5)}/>
  <path d="M22 ${top + 12} L22 184 M36 ${top + 8} L36 188 M50 ${top + 8} L50 189 M64 ${top + 8} L64 188 M78 ${top + 12} L78 184" stroke="#7d98c6" stroke-width="3"/>
  <path d="M9 124 L91 124 M9 156 L91 156" stroke="#7d98c6" stroke-width="3"/>`;

function dadLying(mood: string) {
  return svg("0 -10 100 210", `
    <g transform="translate(50 34) scale(0.32) translate(-100 -104)">${dadHead(mood, "down")}</g>
    ${blanket(56)}
    <path d="M10 92 L90 92" stroke="#7d98c6" stroke-width="3"/>
    <path d="M30 96 Q50 84 70 96 Q74 150 50 160 Q26 150 30 96 Z" fill="#4a68a0" opacity="0.5"/>
    <path d="M10 64 Q12 56 50 56 Q88 56 90 64 L90 76 Q50 70 10 76 Z" fill="#f6f1e4" ${ink(3)}/>`);
}

function dadSitting(mood: string, look: Look) {
  return svg("0 -16 100 216", `
    <path d="M22 62 Q24 42 50 40 Q76 42 78 62 L80 104 L20 104 Z" fill="#7d98c6" ${ink(3.5)}/>
    <path d="M34 46 L34 104 M50 42 L50 104 M66 46 L66 104" stroke="#a9bfe0" stroke-width="3"/>
    <path d="M40 42 L50 54 L60 42" fill="#f6f1e4" ${ink(2.5)}/>
    <g transform="translate(50 18) scale(0.34) translate(-100 -104)">${dadHead(mood, look)}</g>
    ${blanket(84)}
    ${mood === "angry" ? limb("M24 70 Q10 58 14 40", "#7d98c6", 14) + `<circle cx="14" cy="38" r="7" fill="${P.skinTan}" ${ink(3)}/>` : limb("M24 70 Q16 92 24 104", "#7d98c6", 14) + `<circle cx="24" cy="106" r="6.5" fill="${P.skinTan}" ${ink(3)}/>`}
    ${mood === "sleepy" ? limb("M76 70 Q88 56 70 38", "#7d98c6", 14) + `<circle cx="68" cy="36" r="6.5" fill="${P.skinTan}" ${ink(3)}/>` : limb("M76 70 Q84 92 76 104", "#7d98c6", 14) + `<circle cx="76" cy="106" r="6.5" fill="${P.skinTan}" ${ink(3)}/>`}`);
}

export function characters(source: string): Sheet {
  const out: Sheet = {};
  for (const face of BRUNO_FACES) {
    out[`bruno-front-${face}`] = { svg: front(face, false) };
    out[`bruno-side-${face}`] = { svg: side(face, source) };
  }
  for (const face of ["calm", "sneak", "tense", "scared"] as const) out[`bruno-front-${face}-blink`] = { svg: front(face, true) };
  out["bruno-back"] = { svg: back() };
  out["dad-bed-sleep"] = { svg: dadLying("sleep") };
  out["dad-bed-stir"] = { svg: dadLying("stir") };
  for (const look of ["down", "left", "right", "up"] as const) {
    out[`dad-bed-startled-${look}`] = { svg: dadSitting("startled", look) };
    out[`dad-bed-suspicious-${look}`] = { svg: dadSitting("suspicious", look) };
  }
  out["dad-bed-sleepy"] = { svg: dadSitting("sleepy", "down") };
  out["dad-bed-angry"] = { svg: dadSitting("angry", "down") };
  return out;
}
