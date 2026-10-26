import { P } from "@/lib/palette";

export type FolkMood = "normal" | "talk" | "look" | "happy" | "sad" | "surprised";
export type FolkId = "bigodes" | "marola" | "tilt" | "marisa" | "psiu" | "lento" | "capi" | "clique" | "cavuca" | "chiado" | "placar";

const ink = { stroke: P.ink, strokeWidth: 5, strokeLinejoin: "round" as const, strokeLinecap: "round" as const };
const ink4 = { stroke: P.ink, strokeWidth: 4, strokeLinejoin: "round" as const, strokeLinecap: "round" as const };
const ink3 = { stroke: P.ink, strokeWidth: 3, strokeLinejoin: "round" as const, strokeLinecap: "round" as const };

export const FOLK_VIEWBOX: Record<FolkId, [number, number]> = {
  bigodes: [240, 230],
  marola: [230, 270],
  tilt: [230, 330],
  marisa: [200, 230],
  psiu: [170, 190],
  lento: [220, 160],
  capi: [240, 240],
  clique: [200, 252],
  cavuca: [220, 252],
  chiado: [140, 142],
  placar: [220, 262],
};

export const FOLK_FACE: Record<FolkId, [number, number, number]> = {
  bigodes: [40, 18, 160],
  marola: [40, 6, 150],
  tilt: [40, 40, 150],
  marisa: [36, 10, 130],
  psiu: [20, 14, 130],
  lento: [120, 20, 96],
  capi: [36, 26, 168],
  clique: [30, 6, 140],
  cavuca: [40, 8, 140],
  chiado: [14, 2, 112],
  placar: [40, 26, 140],
};

export function Bigodes({ mood = "normal", blink = false, gaze }: { mood?: FolkMood; blink?: boolean; gaze?: number }) {
  const fur = "#9aa3b5";
  const furDark = "#6f7891";
  const furLight = "#d9dde6";
  const jacket = "#8e2f45";
  const jacketDark = "#6a1f33";
  const look = gaze ?? (mood === "look" ? 7 : 0);
  const wide = mood === "surprised";
  return (
    <g>
      <path d="M30 232 Q34 166 88 152 L152 152 Q206 166 210 232 Z" fill={jacket} {...ink} />
      <path d="M170 160 Q204 172 206 232 L176 232 Z" fill={jacketDark} />
      <path d="M100 152 L120 200 L140 152" fill={P.cream} {...ink4} />
      <path d="M96 152 L84 210 L104 178 Z M144 152 L156 210 L136 178 Z" fill={jacketDark} {...ink4} />
      <g fill={P.sun} {...ink3}>
        <circle cx="120" cy="208" r="5" />
        <circle cx="120" cy="224" r="5" />
      </g>
      <path d="M104 160 L120 170 L136 160 L136 178 L120 170 L104 178 Z" fill={P.tomato} {...ink3} />
      <path d="M58 178 L76 182 M164 182 L182 178" stroke={P.sun} strokeWidth="5" strokeLinecap="round" />
      <path d="M48 62 L40 6 L92 40 Z" fill={fur} {...ink} />
      <path d="M52 52 L48 22 L78 42 Z" fill="#f2a8b8" />
      <path d="M192 62 L200 6 L148 40 Z" fill={fur} {...ink} />
      <path d="M188 52 L192 22 L162 42 Z" fill="#f2a8b8" />
      <path d="M44 96 Q20 112 36 136 Q46 154 72 156 L168 156 Q194 154 204 136 Q220 112 196 96 Q190 40 120 36 Q50 40 44 96 Z" fill={fur} {...ink} />
      <path d="M36 124 L18 128 L38 138 L26 150 L50 148 Z M204 124 L222 128 L202 138 L214 150 L190 148 Z" fill={fur} {...ink4} />
      <path d="M100 44 L104 64 M120 40 L120 62 M140 44 L136 64" stroke={furDark} strokeWidth="6" strokeLinecap="round" />
      <path d="M180 66 Q206 100 196 132 Q182 150 160 154 Q196 116 180 66 Z" fill={furDark} opacity="0.45" />
      {blink ? (
        <g fill="none" {...ink4}>
          <path d="M72 98 Q92 108 112 98" />
          <path d="M128 98 Q148 108 168 98" />
          <path d="M68 76 L112 84 M128 84 L172 76" strokeWidth={6} />
        </g>
      ) : (
      <g>
        <ellipse cx={92} cy={96} rx="20" ry={wide ? 20 : 16} fill={P.white} {...ink4} />
        <ellipse cx={148} cy={96} rx="20" ry={wide ? 20 : 16} fill={P.white} {...ink4} />
        <circle cx={94 + look} cy={wide ? 96 : 100} r={wide ? 6 : 7} fill={P.ink} />
        <circle cx={150 + look} cy={wide ? 96 : 100} r={wide ? 6 : 7} fill={P.ink} />
        {!wide && (
          <g>
            <path d="M70 92 Q92 76 114 92 L114 80 Q92 70 70 80 Z" fill={fur} {...ink4} />
            <path d="M126 92 Q148 76 170 92 L170 80 Q148 70 126 80 Z" fill={fur} {...ink4} />
          </g>
        )}
        <path d={wide ? "M70 66 Q92 56 112 66 M128 66 Q148 56 170 66" : mood === "talk" ? "M68 76 L112 82 M128 82 L172 76" : "M68 72 L112 82 M128 82 L172 72"} fill="none" {...ink} strokeWidth={6} />
      </g>
      )}
      <path d="M110 112 L130 112 L120 124 Z" fill="#f28ba0" {...ink3} />
      <path d="M86 132 Q102 116 120 128 Q138 116 154 132 Q138 144 120 136 Q102 144 86 132 Z" fill={furLight} {...ink4} />
      <path d="M84 126 L36 116 M84 134 L34 138 M156 126 L204 116 M156 134 L206 138" stroke={P.ink} strokeWidth="3" strokeLinecap="round" />
      {mood === "talk" || wide ? (
        <ellipse cx="120" cy="144" rx="10" ry={wide ? 10 : 7} fill={P.ink} />
      ) : mood === "happy" ? (
        <path d="M108 142 Q120 150 132 142" fill="none" {...ink4} />
      ) : (
        <path d="M108 146 Q120 138 132 146" fill="none" {...ink4} />
      )}
      <g transform="rotate(-10 120 30)">
        <path d="M82 34 L86 6 Q120 -2 154 6 L158 34 Q120 42 82 34 Z" fill={P.tomato} {...ink} />
        <path d="M84 24 Q120 32 156 24" fill="none" stroke={P.sun} strokeWidth="7" />
        <path d="M84 24 Q120 32 156 24" fill="none" stroke={P.ink} strokeWidth="2" opacity="0.4" />
        <circle cx="120" cy="12" r="5" fill={P.sun} {...ink3} />
      </g>
    </g>
  );
}

export function Marola({ mood = "normal", whistle = false }: { mood?: FolkMood; whistle?: boolean }) {
  const fur = "#c98a4e";
  const furDark = "#9a6232";
  const muzzle = "#f1d3a8";
  const turned = mood === "look" ? 8 : 0;
  const blow = mood === "happy" && whistle;
  return (
    <g>
      <path d="M62 266 L70 214 L160 214 L168 266 Z" fill={P.tomato} {...ink} />
      <path d="M112 216 L114 266" stroke={P.tomatoDeep} strokeWidth="4" />
      <path d="M56 214 Q52 150 86 136 L144 136 Q178 150 174 214 Z" fill={fur} {...ink} />
      <path d="M90 150 Q114 164 140 150 Q140 196 114 204 Q88 196 90 150 Z" fill={muzzle} />
      {whistle && !blow && (
        <g>
          <path d="M92 140 Q114 186 138 140" fill="none" stroke={P.tomato} strokeWidth="4" />
          <rect x="104" y="176" width="22" height="12" rx="4" fill={P.steel} {...ink3} />
        </g>
      )}
      {mood === "talk" ? (
        <g>
          <path d="M62 160 Q36 150 30 118" fill="none" stroke={P.ink} strokeWidth="20" strokeLinecap="round" />
          <path d="M62 160 Q36 150 30 118" fill="none" stroke={fur} strokeWidth="11" strokeLinecap="round" />
          <circle cx="30" cy="112" r="11" fill={fur} {...ink4} />
          <path d="M168 160 Q186 186 160 198" fill="none" stroke={P.ink} strokeWidth="20" strokeLinecap="round" />
          <path d="M168 160 Q186 186 160 198" fill="none" stroke={fur} strokeWidth="11" strokeLinecap="round" />
        </g>
      ) : (
        <g>
          <path d="M62 160 Q48 196 96 196 L134 196 Q182 196 168 160" fill="none" stroke={P.ink} strokeWidth="20" strokeLinecap="round" />
          <path d="M62 160 Q48 196 96 196 L134 196 Q182 196 168 160" fill="none" stroke={fur} strokeWidth="11" strokeLinecap="round" />
          <path d="M96 196 L134 196" stroke={furDark} strokeWidth="3" />
        </g>
      )}
      <g transform={`translate(${turned} 0)`}>
        <path d="M54 52 Q26 60 30 118 Q40 134 60 112 Q58 84 70 64 Z" fill={furDark} {...ink} />
        <path d="M176 52 Q204 60 200 118 Q190 134 170 112 Q172 84 160 64 Z" fill={furDark} {...ink} />
        <path d="M58 82 Q58 32 115 30 Q172 32 172 82 Q176 128 115 136 Q54 128 58 82 Z" fill={fur} {...ink} />
        <path d="M84 104 Q84 82 115 82 Q146 82 146 104 Q146 132 115 134 Q84 132 84 104 Z" fill={muzzle} {...ink4} />
        <ellipse cx="115" cy="96" rx="14" ry="10" fill={P.ink} />
        <ellipse cx="111" cy="92" rx="4" ry="2.5" fill={P.white} />
        {blow ? (
          <g>
            <circle cx="96" cy="118" r="10" fill={muzzle} {...ink3} />
            <circle cx="134" cy="118" r="10" fill={muzzle} {...ink3} />
            <rect x="104" y="114" width="26" height="14" rx="5" fill={P.steel} {...ink3} />
            <circle cx="126" cy="121" r="3" fill={P.ink} />
          </g>
        ) : mood === "talk" || mood === "surprised" ? (
          <path d="M100 112 Q115 134 130 112 Z" fill={P.tomatoDeep} {...ink4} />
        ) : mood === "sad" ? (
          <path d="M100 122 Q115 112 130 122" fill="none" {...ink4} />
        ) : (
          <path d="M100 114 Q108 122 115 114 Q122 122 130 114" fill="none" {...ink4} />
        )}
        <path d="M68 64 L162 64 L158 82 Q138 90 120 80 L110 80 Q92 90 72 82 Z" fill={P.ink} />
        <path d="M78 68 L96 68 L90 78 Z M128 68 L146 68 L140 78 Z" fill={P.sky} opacity="0.75" />
        {mood === "sad" && <path d="M76 56 L100 62 M154 56 L130 62" stroke={P.ink} strokeWidth="5" strokeLinecap="round" />}
        <path d="M60 46 Q66 6 115 6 Q164 6 170 46 Z" fill={P.tomato} {...ink} />
        <path d="M60 46 L30 40 Q26 50 36 54 L64 52 Z" fill={P.tomatoDeep} {...ink4} />
        <path d="M108 16 L122 16 M115 9 L115 23" stroke={P.white} strokeWidth="6" strokeLinecap="round" />
      </g>
    </g>
  );
}

export function Tilt({ mood = "normal", lit = true, blink = false }: { mood?: FolkMood; lit?: boolean; blink?: boolean }) {
  const body = "#5a3fb8";
  const bodyDark = "#3b2788";
  const screen = lit ? "#123a3a" : "#1d1830";
  const px = (x: number, y: number, w = 1, h = 1) => <rect key={`${x}-${y}-${w}-${h}`} x={62 + x * 10} y={92 + y * 10} width={w * 10} height={h * 10} />;
  const eyes = blink
    ? [px(1, 3, 2, 1), px(7, 3, 2, 1)]
    : mood === "happy"
      ? [px(1, 3, 1, 1), px(2, 2, 1, 1), px(3, 3, 1, 1), px(7, 3, 1, 1), px(8, 2, 1, 1), px(9, 3, 1, 1)]
      : mood === "sad"
        ? [px(1, 2, 3, 1), px(7, 2, 3, 1), px(2, 3, 1, 1), px(8, 3, 1, 1), px(2, 4, 1, 2), px(8, 4, 1, 2)]
        : mood === "surprised"
          ? [px(1, 1, 3, 3), px(7, 1, 3, 3)]
          : mood === "look"
            ? [px(2, 2, 2, 2), px(8, 2, 2, 2)]
            : [px(1, 2, 2, 2), px(7, 2, 2, 2)];
  const mouth =
    mood === "talk"
      ? [px(4, 6, 3, 2)]
      : mood === "happy"
        ? [px(3, 6, 1, 1), px(4, 7, 3, 1), px(7, 6, 1, 1)]
        : mood === "sad"
          ? [px(3, 7, 1, 1), px(4, 6, 3, 1), px(7, 7, 1, 1)]
          : mood === "surprised"
            ? [px(4, 6, 3, 2)]
            : [px(4, 7, 3, 1)];
  return (
    <g>
      <path d="M30 70 L200 70 L210 318 L20 318 Z" fill={body} {...ink} />
      <path d="M170 74 L200 74 L208 316 L182 316 Z" fill={bodyDark} />
      <path d="M44 300 L186 300" stroke={P.sun} strokeWidth="6" />
      <path d="M40 120 L20 140 M190 120 L210 140" stroke={P.ink} strokeWidth="4" opacity="0.4" />
      <rect x="24" y="14" width="182" height="58" rx="10" fill={P.bubblegum} {...ink} />
      <rect x="34" y="22" width="162" height="42" rx="6" fill={lit ? "#ffd3ea" : P.bubblegumDeep} />
      <text x="115" y="56" textAnchor="middle" fontFamily="Arial Black, Arial, sans-serif" fontWeight="900" fontSize="34" fill={P.ink}>
        TILT
      </text>
      <rect x="48" y="80" width="134" height="104" rx="12" fill={P.ink} />
      <rect x="56" y="86" width="118" height="92" rx="9" fill={screen} />
      <g fill={lit ? "#7dffb2" : "#3a3157"}>
        {eyes}
        {mouth}
      </g>
      {lit && <rect x="56" y="86" width="118" height="92" rx="9" fill="url(#tilt-scan)" opacity="0.3" />}
      <defs>
        <pattern id="tilt-scan" width="4" height="4" patternUnits="userSpaceOnUse">
          <rect width="4" height="2" fill="#ffffff" opacity="0.18" />
        </pattern>
      </defs>
      <path d="M22 196 L208 196 L216 236 L14 236 Z" fill={bodyDark} {...ink} />
      <rect x="60" y="200" width="8" height="24" rx="3" fill={P.steel} {...ink3} />
      <circle cx="64" cy="200" r="12" fill={P.tomato} {...ink4} />
      <circle cx="132" cy="214" r="10" fill={P.sun} {...ink4} />
      <circle cx="162" cy="210" r="10" fill={P.mint} {...ink4} />
      <rect x="92" y="252" width="46" height="34" rx="4" fill="#2b2150" {...ink4} />
      <rect x="104" y="262" width="8" height="14" rx="2" fill={P.sun} />
      <rect x="118" y="262" width="8" height="14" rx="2" fill={P.sun} />
    </g>
  );
}

export function Marisa({ mood = "normal" }: { mood?: FolkMood }) {
  const turn = mood === "look" ? -10 : 0;
  return (
    <g>
      <path d="M84 196 L80 222 L66 226 M116 196 L120 222 L134 226" fill="none" stroke={P.ink} strokeWidth="9" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M84 196 L80 222 L66 226 M116 196 L120 222 L134 226" fill="none" stroke={P.tangerine} strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M50 150 Q46 92 100 88 Q154 92 152 150 Q150 204 100 204 Q52 204 50 150 Z" fill={P.white} {...ink} />
      <path d="M62 176 Q100 196 140 176 Q132 200 100 202 Q70 200 62 176 Z" fill="#e6e1d6" />
      {mood === "happy" ? (
        <path d="M52 132 Q16 96 30 70 Q52 96 70 116 Z" fill="#b8bfcc" {...ink4} />
      ) : (
        <path d="M52 124 Q30 158 46 186 Q60 170 66 140 Z" fill="#b8bfcc" {...ink4} />
      )}
      <path d="M148 124 Q172 158 156 186 Q142 170 136 140 Z" fill="#b8bfcc" {...ink4} />
      <path d="M58 132 Q100 150 142 132 L142 142 Q100 160 58 142 Z" fill={P.bubblegum} {...ink3} />
      <g fill={P.sun} {...ink3}>
        <circle cx="72" cy="140" r="5" />
        <circle cx="100" cy="148" r="5" />
        <circle cx="128" cy="140" r="5" />
      </g>
      <g transform={`rotate(${turn} 100 70)`}>
        <path d="M58 70 Q56 22 100 20 Q144 22 142 70 Q142 104 100 106 Q58 104 58 70 Z" fill={P.white} {...ink} />
        <path d="M80 22 Q90 4 98 18 Q104 2 112 20" fill={P.white} {...ink4} />
        <path d="M128 62 L178 70 Q182 78 172 82 L128 84 Z" fill={P.sun} {...ink4} />
        <path d="M130 76 L174 78" stroke={P.tangerineDeep} strokeWidth="3" />
        {mood === "talk" && <path d="M132 82 L170 82 L140 94 Z" fill={P.tangerineDeep} {...ink3} />}
        <path d="M60 52 L140 52 L136 70 Q120 76 104 66 L96 66 Q80 76 64 70 Z" fill={P.ink} />
        <path d="M70 56 L86 56 L80 64 Z M110 56 L126 56 L120 64 Z" fill={P.sky} opacity="0.7" />
        <path d="M58 54 L44 50 M140 54 L150 50" stroke={P.ink} strokeWidth="4" strokeLinecap="round" />
      </g>
    </g>
  );
}

export function Psiu({ mood = "normal" }: { mood?: FolkMood }) {
  const cloak = "#7b5bd6";
  const cloakDark = "#5a3fb0";
  const eyes =
    mood === "happy" ? (
      <g fill="none" stroke="#f3f0ff" strokeWidth="6" strokeLinecap="round">
        <path d="M60 104 Q68 94 76 104" />
        <path d="M94 104 Q102 94 110 104" />
      </g>
    ) : mood === "look" ? (
      <g fill="#f3f0ff">
        <ellipse cx="74" cy="102" rx="9" ry="12" />
        <ellipse cx="108" cy="102" rx="9" ry="12" />
      </g>
    ) : mood === "talk" ? (
      <g fill="#f3f0ff">
        <ellipse cx="68" cy="100" rx="10" ry="9" />
        <ellipse cx="102" cy="100" rx="10" ry="9" />
      </g>
    ) : mood === "sad" ? (
      <g fill="#f3f0ff">
        <rect x="58" y="100" width="20" height="5" rx="2" />
        <rect x="92" y="100" width="20" height="5" rx="2" />
      </g>
    ) : (
      <g fill="#f3f0ff">
        <ellipse cx="68" cy="102" rx="9" ry="12" />
        <ellipse cx="102" cy="102" rx="9" ry="12" />
      </g>
    );
  return (
    <g>
      <path d="M50 178 L54 186 L74 186 M96 186 L116 186 L120 178" fill="none" stroke={P.ink} strokeWidth="8" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M85 14 Q140 30 150 110 Q156 160 132 182 L38 182 Q14 160 20 110 Q30 30 85 14 Z" fill={cloak} {...ink} />
      <path d="M118 40 Q146 80 140 150 Q136 172 124 180 Q132 120 118 40 Z" fill={cloakDark} />
      <path d="M85 14 Q78 4 70 8" fill="none" {...ink4} />
      <path d="M40 90 Q42 62 85 60 Q128 62 130 90 Q134 132 85 136 Q36 132 40 90 Z" fill="#160f2b" {...ink4} />
      {eyes}
      <path d="M44 150 Q60 160 72 150 M98 150 Q110 160 126 150" fill="none" stroke={cloakDark} strokeWidth="5" strokeLinecap="round" />
      <circle cx="58" cy="156" r="9" fill={cloak} {...ink3} />
      <circle cx="112" cy="156" r="9" fill={cloak} {...ink3} />
    </g>
  );
}

export function Lento({ mood = "normal", step = 0, keyOn = true, blink = false }: { mood?: FolkMood; step?: number; keyOn?: boolean; blink?: boolean }) {
  const skin = "#8fc46a";
  const skinDark = "#5e9443";
  const shell = "#3f7d3a";
  const lift = step % 2 ? 4 : 0;
  return (
    <g>
      <path d={`M60 ${128 - lift} L56 150 L76 150 L78 ${128 - lift} M140 ${128 + lift - 4} L138 150 L158 150 L156 ${128}`} fill={skin} {...ink4} />
      <path d="M30 120 Q34 46 108 40 Q178 46 184 120 Z" fill={shell} {...ink} />
      <path d="M70 60 L92 54 L102 72 L88 88 L66 82 Z M104 50 L128 52 L134 72 L112 76 Z M138 60 L160 74 L156 96 L136 92 L132 74 Z M88 92 L110 82 L130 96 L122 116 L94 116 Z" fill="#5ea152" {...ink3} />
      <path d="M24 120 L190 120 Q192 132 180 134 L34 134 Q22 132 24 120 Z" fill="#c9a35e" {...ink4} />
      {keyOn && (
        <g transform="rotate(14 156 60)">
          <path d="M150 44 Q160 30 168 46" fill="none" stroke={P.tomato} strokeWidth="4" />
          <circle cx="160" cy="58" r="9" fill={P.sun} {...ink3} />
          <rect x="158" y="64" width="5" height="20" fill={P.sun} {...ink3} />
          <rect x="162" y="76" width="8" height="4" fill={P.sun} {...ink3} />
        </g>
      )}
      <path d="M188 104 Q214 98 214 74 Q212 50 188 52 Q170 56 172 80 Z" fill={skin} {...ink} />
      <path d="M192 96 Q206 92 208 80" fill="none" stroke={skinDark} strokeWidth="3" />
      <circle cx="196" cy="70" r="9" fill="none" {...ink3} />
      {blink ? <path d="M188 71 Q196 76 204 71" fill="none" {...ink3} /> : <circle cx="196" cy="70" r={mood === "surprised" ? 4 : 3} fill={P.ink} />}
      <path d="M180 68 L187 70" stroke={P.ink} strokeWidth="3" />
      {mood === "talk" ? <ellipse cx="204" cy="88" rx="5" ry="4" fill={P.ink} /> : <path d="M198 90 Q205 92 210 86" fill="none" {...ink3} />}
      <path d="M204 54 Q214 50 212 60" fill="none" stroke={P.white} strokeWidth="3" strokeLinecap="round" />
      <path d="M196 110 L196 150" stroke="#8a5a2c" strokeWidth="7" strokeLinecap="round" />
      <path d="M196 110 L196 150" stroke={P.ink} strokeWidth="2" strokeLinecap="round" opacity="0.5" />
      <path d="M24 120 Q10 124 8 132" fill="none" stroke={P.ink} strokeWidth="9" strokeLinecap="round" />
      <path d="M24 120 Q10 124 8 132" fill="none" stroke={skin} strokeWidth="4" strokeLinecap="round" />
    </g>
  );
}

function flower(x: number, y: number, petal: string, key: string) {
  return (
    <g key={key}>
      {[0, 72, 144, 216, 288].map((a) => (
        <circle key={a} cx={x + Math.cos((a * Math.PI) / 180) * 6} cy={y + Math.sin((a * Math.PI) / 180) * 6} r="5" fill={petal} />
      ))}
      <circle cx={x} cy={y} r="3.5" fill={P.sun} />
    </g>
  );
}

function folkLimb(d: string, color: string, w = 16) {
  return (
    <g>
      <path d={d} fill="none" stroke={P.ink} strokeWidth={w} strokeLinecap="round" strokeLinejoin="round" />
      <path d={d} fill="none" stroke={color} strokeWidth={w - 8} strokeLinecap="round" strokeLinejoin="round" />
    </g>
  );
}

export function Capivaldo({ mood = "normal", shake = 0, blink = false }: { mood?: FolkMood; shake?: number; blink?: boolean }) {
  const fur = "#b07a4a";
  const furDark = "#83552f";
  const furLight = "#dcae78";
  const shirt = "#2fb5a8";
  const shirtDark = "#1d8a80";
  const look = mood === "look" ? 7 : 0;
  const wide = mood === "surprised";
  const eye = (cx: number) =>
    blink ? (
      <path key={cx} d={`M${cx - 13} 102 Q${cx} 110 ${cx + 13} 102`} fill="none" {...ink4} />
    ) : mood === "happy" ? (
      <path key={cx} d={`M${cx - 13} 104 Q${cx} 92 ${cx + 13} 104`} fill="none" {...ink4} />
    ) : (
      <g key={cx}>
        <ellipse cx={cx} cy={102} rx="14" ry={wide ? 15 : 12} fill={P.white} {...ink4} />
        <circle cx={cx + look} cy={wide ? 102 : 105} r={wide ? 5 : 6} fill={P.ink} />
        {!wide && (
          <path
            d={mood === "sad" ? `M${cx - 15} 98 Q${cx} 88 ${cx + 15} 104 L${cx + 15} 92 L${cx - 15} 92 Z` : `M${cx - 15} 102 Q${cx} 88 ${cx + 15} 102 L${cx + 15} 90 L${cx - 15} 90 Z`}
            fill={fur}
            {...ink3}
          />
        )}
      </g>
    );
  const sx = 186 + shake * 8;
  const sy = 104 - shake * 10;
  return (
    <g>
      {shake ? folkLimb(`M174 188 Q206 156 ${sx - 4} ${sy + 34}`, fur, 18) : folkLimb("M178 190 Q196 216 182 236", fur, 18)}
      {folkLimb("M62 190 Q44 216 58 236", fur, 18)}
      <path d="M30 240 Q34 178 84 164 L156 164 Q206 178 210 240 Z" fill={shirt} {...ink} />
      <path d="M168 172 Q204 186 206 240 L178 240 Z" fill={shirtDark} />
      {[
        [66, 204, P.bubblegum],
        [150, 214, P.sun],
        [110, 230, P.bubblegum],
        [184, 196, P.white],
        [48, 228, P.sun],
      ].map(([x, y, c], i) => flower(x as number, y as number, c as string, `f${i}`))}
      <path d="M98 164 L112 198 L120 178 Z M142 164 L128 198 L120 178 Z" fill={P.white} {...ink3} />
      <ellipse cx="72" cy="40" rx="11" ry="9" fill={fur} {...ink4} />
      <ellipse cx="72" cy="40" rx="5" ry="4" fill={furDark} />
      <ellipse cx="168" cy="40" rx="11" ry="9" fill={fur} {...ink4} />
      <ellipse cx="168" cy="40" rx="5" ry="4" fill={furDark} />
      <path d="M48 86 Q46 34 120 32 Q194 34 192 86 L192 126 Q190 168 120 170 Q50 168 48 126 Z" fill={fur} {...ink} />
      <path d="M170 60 Q194 96 186 138 Q176 160 156 166 Q188 124 170 60 Z" fill={furDark} opacity="0.4" />
      {eye(90)}
      {eye(150)}
      <path d="M74 124 Q72 110 120 110 Q168 110 166 124 L166 146 Q164 168 120 168 Q76 168 74 146 Z" fill={furLight} {...ink4} />
      <rect x="100" y="116" width="40" height="18" rx="9" fill={furDark} {...ink3} />
      <ellipse cx="111" cy="125" rx="4" ry="3" fill={P.ink} />
      <ellipse cx="129" cy="125" rx="4" ry="3" fill={P.ink} />
      {mood === "happy" && (
        <g fill={P.blush} opacity="0.7">
          <ellipse cx="80" cy="138" rx="9" ry="5" />
          <ellipse cx="160" cy="138" rx="9" ry="5" />
        </g>
      )}
      {mood === "talk" ? (
        <ellipse cx="120" cy="152" rx="10" ry="7" fill={P.ink} />
      ) : wide ? (
        <ellipse cx="120" cy="153" rx="7" ry="9" fill={P.ink} />
      ) : mood === "happy" ? (
        <path d="M102 146 Q120 164 138 146" fill={P.tomatoDeep} {...ink4} />
      ) : mood === "sad" ? (
        <path d="M106 156 Q120 146 134 156" fill="none" {...ink4} />
      ) : (
        <path d="M106 150 Q120 158 134 150" fill="none" {...ink4} />
      )}
      <path d="M52 66 Q120 46 188 66 L188 78 Q120 60 52 78 Z" fill={P.sun} {...ink4} />
      <path d="M62 76 Q120 60 178 76 Q174 96 120 90 Q66 96 62 76 Z" fill={P.tangerine} {...ink4} />
      <path d="M84 80 Q100 74 116 76" fill="none" stroke={P.white} strokeWidth="4" strokeLinecap="round" opacity="0.7" />
      {shake ? (
        <g transform={`rotate(${shake % 2 ? 14 : -10} ${sx} ${sy})`}>
          <rect x={sx - 14} y={sy - 22} width="28" height="46" rx="8" fill={P.steel} {...ink4} />
          <rect x={sx - 10} y={sy - 32} width="20" height="12" rx="5" fill={P.steelDeep} {...ink3} />
          <path d={`M${sx - 8} ${sy - 12} L${sx - 8} ${sy + 14}`} stroke={P.white} strokeWidth="4" strokeLinecap="round" opacity="0.7" />
          <circle cx={sx + 4} cy={sy + 34} r="9" fill={fur} {...ink3} />
        </g>
      ) : null}
    </g>
  );
}

export function Clique({ mood = "normal", shoot = false, blink = false }: { mood?: FolkMood; shoot?: boolean; blink?: boolean }) {
  const skin = "#79c94f";
  const skinDark = "#4f9a34";
  const belly = "#d6efa8";
  const shirt = "#ff8a3d";
  const look = mood === "look" ? 6 : 0;
  const wide = mood === "surprised";
  const eye = (cx: number) => (
    <g key={cx}>
      <circle cx={cx} cy="58" r="22" fill={skin} {...ink} />
      {blink ? (
        <path d={`M${cx - 13} 60 Q${cx} 68 ${cx + 13} 60`} fill="none" {...ink4} />
      ) : mood === "happy" ? (
        <path d={`M${cx - 11} 60 Q${cx} 48 ${cx + 11} 60`} fill="none" {...ink4} />
      ) : (
        <g>
          <circle cx={cx} cy="58" r={wide ? 17 : 14} fill={P.white} {...ink3} />
          <circle cx={cx + look} cy={mood === "sad" ? 62 : 59} r={wide ? 5 : 7} fill={P.ink} />
          {mood === "sad" && <path d={`M${cx - 14} 50 L${cx + 14} ${cx < 100 ? 56 : 44}`} stroke={P.ink} strokeWidth="5" strokeLinecap="round" />}
        </g>
      )}
    </g>
  );
  return (
    <g>
      <ellipse cx="72" cy="242" rx="24" ry="8" fill={skin} {...ink4} />
      <ellipse cx="128" cy="242" rx="24" ry="8" fill={skin} {...ink4} />
      {folkLimb("M78 214 L74 236", skin, 18)}
      {folkLimb("M122 214 L126 236", skin, 18)}
      <path d="M56 190 L144 190 L148 222 L108 222 L100 208 L92 222 L52 222 Z" fill="#d9b25a" {...ink4} />
      <path d="M52 198 Q44 130 100 118 Q156 130 148 198 Z" fill={skin} {...ink} />
      <path d="M76 194 Q70 148 100 142 Q130 148 124 194 Z" fill={belly} />
      <path d="M52 198 Q46 140 82 124 L90 132 Q80 160 86 198 Z" fill={shirt} {...ink4} />
      <path d="M148 198 Q154 140 118 124 L110 132 Q120 160 114 198 Z" fill={shirt} {...ink4} />
      <path d="M60 160 q8 -10 16 0 q-8 6 -16 0 Z M126 176 q8 -10 16 0 q-8 6 -16 0 Z M64 186 q8 -10 16 0 q-8 6 -16 0 Z M124 146 q8 -10 16 0 q-8 6 -16 0 Z" fill={P.leaf} />
      {shoot ? (
        <g>
          {folkLimb("M60 140 Q46 104 96 74", skin, 16)}
          {folkLimb("M140 140 Q160 108 150 80", skin, 16)}
        </g>
      ) : (
        <g>
          <path d="M80 152 Q70 128 82 120 M120 152 Q130 128 118 120" fill="none" stroke={P.ink} strokeWidth="4" />
          {folkLimb("M60 140 Q46 168 80 172", skin, 16)}
          {folkLimb("M140 140 Q154 168 120 172", skin, 16)}
          <rect x="76" y="150" width="48" height="32" rx="6" fill="#3a3157" {...ink4} />
          <rect x="108" y="144" width="12" height="8" rx="2" fill={P.steel} {...ink3} />
          <circle cx="100" cy="166" r="11" fill={P.steel} {...ink3} />
          <circle cx="100" cy="166" r="5" fill={P.ink} />
        </g>
      )}
      <path d="M38 94 Q38 54 100 52 Q162 54 162 94 Q162 124 100 126 Q38 124 38 94 Z" fill={skin} {...ink} />
      <path d="M140 72 Q162 92 152 114 Q140 124 122 124 Q152 104 140 72 Z" fill={skinDark} opacity="0.35" />
      <path d="M84 36 Q86 12 100 12 Q114 12 116 36 Z" fill="#d9b25a" {...ink4} />
      <path d="M74 38 Q100 26 126 38 Q122 48 100 44 Q78 48 74 38 Z" fill="#c4973f" {...ink4} />
      {eye(66)}
      {shoot ? <circle cx="134" cy="58" r="22" fill={skin} {...ink} /> : eye(134)}
      {mood === "talk" ? (
        <path d="M66 98 Q100 126 134 98 Q100 110 66 98 Z" fill={P.tomatoDeep} {...ink4} />
      ) : wide ? (
        <ellipse cx="100" cy="104" rx="9" ry="10" fill={P.ink} />
      ) : mood === "happy" ? (
        <path d="M60 96 Q100 130 140 96 Q100 112 60 96 Z" fill={P.tomatoDeep} {...ink4} />
      ) : mood === "sad" ? (
        <path d="M66 108 Q84 98 100 106 Q116 98 134 108" fill="none" {...ink4} />
      ) : (
        <path d="M62 100 Q100 116 138 100" fill="none" {...ink4} />
      )}
      <g fill={P.blush} opacity="0.6">
        <ellipse cx="54" cy="102" rx="9" ry="5" />
        <ellipse cx="146" cy="102" rx="9" ry="5" />
      </g>
      {shoot && (
        <g>
          <rect x="108" y="44" width="56" height="36" rx="7" fill="#3a3157" {...ink4} />
          <circle cx="136" cy="62" r="12" fill={P.steel} {...ink3} />
          <circle cx="136" cy="62" r="5" fill={P.ink} />
          <path d="M160 30 L166 42 L180 40 L170 50 L176 62 L162 56 L152 64 L154 50 L144 42 L158 42 Z" fill={P.sunPale} {...ink3} />
        </g>
      )}
    </g>
  );
}

export function Cavuca({ mood = "normal", step = 0 }: { mood?: FolkMood; step?: number }) {
  const fur = "#5a4f6e";
  const furDark = "#41385a";
  const pink = "#f49ab8";
  const vest = "#c9a86a";
  const look = mood === "look" ? 5 : 0;
  const lift = step % 2 ? 6 : 0;
  const petals = Array.from({ length: 11 }, (_, i) => (i / 11) * Math.PI * 2);
  return (
    <g>
      <ellipse cx={86 - lift} cy="242" rx="18" ry="8" fill={pink} {...ink4} />
      <ellipse cx={136 + lift} cy={242 - lift / 2} rx="18" ry="8" fill={pink} {...ink4} />
      {folkLimb(`M92 214 L${86 - lift} 236`, fur, 18)}
      {folkLimb(`M128 214 L${136 + lift} ${236 - lift / 2}`, fur, 18)}
      <path d="M50 228 Q40 160 110 142 Q180 160 170 228 Q140 238 110 236 Q80 238 50 228 Z" fill={fur} {...ink} />
      <path d="M54 228 Q46 172 94 150 L104 234 Q78 236 54 228 Z" fill={vest} {...ink4} />
      <path d="M166 228 Q174 172 126 150 L116 234 Q142 236 166 228 Z" fill={vest} {...ink4} />
      <rect x="62" y="196" width="26" height="20" rx="4" fill="#b8945a" {...ink3} />
      <rect x="132" y="196" width="26" height="20" rx="4" fill="#b8945a" {...ink3} />
      {folkLimb("M62 168 Q52 186 70 194", fur, 16)}
      {folkLimb("M158 168 Q168 186 150 194", fur, 16)}
      <g transform="rotate(-4 110 190)">
        <rect x="62" y="166" width="96" height="58" rx="4" fill="#f3e3c3" {...ink4} />
        <path d="M70 180 Q92 170 104 186 T150 182 M72 206 Q96 196 118 210" fill="none" stroke="#c9a35e" strokeWidth="3" />
        <path d="M120 196 L132 210 M132 196 L120 210" stroke={P.tomato} strokeWidth="4" strokeLinecap="round" />
        <g transform="rotate(180 82 196)">
          <circle cx="82" cy="196" r="10" fill="none" stroke={P.ink} strokeWidth="2.5" />
          <text x="82" y="191" textAnchor="middle" fontSize="9" fontFamily="Arial Black, Arial, sans-serif" fill={P.ink}>
            N
          </text>
        </g>
      </g>
      <path d="M58 182 L64 172 L70 182 L76 172 L82 182" fill={pink} {...ink3} />
      <path d="M138 182 L144 172 L150 182 L156 172 L162 182" fill={pink} {...ink3} />
      <path d="M52 102 Q48 54 110 50 Q172 54 168 102 Q168 148 110 152 Q52 148 52 102 Z" fill={fur} {...ink} />
      <path d="M150 70 Q172 104 160 136 Q148 150 130 150 Q164 116 150 70 Z" fill={furDark} opacity="0.5" />
      {[86, 134].map((cx) => (
        <g key={cx}>
          <circle cx={cx} cy="100" r="19" fill="#cfe8ff" opacity="0.9" />
          {mood === "happy" ? (
            <path d={`M${cx - 6} 102 Q${cx} 96 ${cx + 6} 102`} fill="none" stroke={P.ink} strokeWidth="3" strokeLinecap="round" />
          ) : (
            <circle cx={cx + look} cy="101" r={mood === "surprised" ? 6 : 4} fill={P.ink} />
          )}
          <circle cx={cx} cy="100" r="19" fill="none" stroke={P.ink} strokeWidth="6" />
        </g>
      ))}
      <path d="M105 100 L115 100" stroke={P.ink} strokeWidth="5" />
      <g>
        {petals.map((a, i) => (
          <ellipse key={i} cx={110 + Math.cos(a) * 14} cy={128 + Math.sin(a) * 12} rx="7" ry="4.5" transform={`rotate(${(a * 180) / Math.PI} ${110 + Math.cos(a) * 14} ${128 + Math.sin(a) * 12})`} fill={pink} stroke={P.ink} strokeWidth="2" />
        ))}
        <circle cx="110" cy="128" r="9" fill={pink} {...ink3} />
      </g>
      {mood === "talk" ? (
        <ellipse cx="110" cy="148" rx="7" ry="5" fill={P.ink} />
      ) : mood === "surprised" ? (
        <ellipse cx="110" cy="148" rx="5" ry="6" fill={P.ink} />
      ) : mood === "happy" ? (
        <path d="M100 145 Q110 154 120 145" fill="none" {...ink3} />
      ) : (
        <path d="M102 148 L118 148" fill="none" {...ink3} />
      )}
      <path d="M56 68 Q58 14 110 12 Q162 14 164 68 Z" fill="#e9d8a6" {...ink} />
      <path d="M58 58 Q110 46 162 58" fill="none" stroke={P.leaf} strokeWidth="8" />
      <ellipse cx="110" cy="68" rx="70" ry="12" fill="#e9d8a6" {...ink4} />
      <path d="M88 24 Q100 18 112 20" fill="none" stroke={P.white} strokeWidth="5" strokeLinecap="round" opacity="0.8" />
    </g>
  );
}

const STATIC_DOTS: [number, number, string][] = [
  [44, 62, "#ffffff"], [60, 50, "#64708a"], [80, 56, "#ffffff"], [96, 66, "#64708a"], [38, 84, "#9aa6b8"], [56, 96, "#ffffff"],
  [74, 102, "#64708a"], [94, 96, "#ffffff"], [102, 84, "#9aa6b8"], [48, 110, "#64708a"], [66, 116, "#ffffff"], [86, 114, "#9aa6b8"],
  [70, 40, "#9aa6b8"], [30, 70, "#ffffff"], [108, 106, "#ffffff"], [84, 78, "#64708a"], [60, 76, "#9aa6b8"], [100, 50, "#9aa6b8"],
];

export function Chiadinho({ mood = "normal", blink = false }: { mood?: FolkMood; blink?: boolean }) {
  const look = mood === "look" ? 5 : 0;
  const wide = mood === "surprised";
  const spikes = Array.from({ length: 22 }, (_, i) => {
    const a = (i / 22) * Math.PI * 2;
    const r = i % 2 ? 44 : 50;
    return `${70 + Math.cos(a) * r},${82 + Math.sin(a) * r}`;
  }).join(" ");
  return (
    <g>
      <path d="M54 34 L42 8 M86 34 L98 8" stroke={P.ink} strokeWidth="5" strokeLinecap="round" />
      <circle cx="42" cy="8" r="6" fill={P.tomato} {...ink3} />
      <circle cx="98" cy="8" r="6" fill={P.screen} {...ink3} />
      <path d="M56 126 L52 136 L64 136 M84 126 L88 136 L76 136" fill="none" stroke={P.ink} strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" />
      <polygon points={spikes} fill="#c9d4e4" stroke={P.ink} strokeWidth="5" strokeLinejoin="round" />
      {STATIC_DOTS.map(([x, y, c], i) => (
        <rect key={i} x={x} y={y} width={i % 3 ? 7 : 10} height="3" fill={c} />
      ))}
      {blink ? (
        <g fill="none" stroke={P.ink} strokeWidth="5" strokeLinecap="round">
          <path d="M42 78 L66 78" />
          <path d="M74 78 L98 78" />
        </g>
      ) : mood === "happy" ? (
        <g fill="none" stroke={P.ink} strokeWidth="5" strokeLinecap="round">
          <path d="M44 78 Q54 66 64 78" />
          <path d="M76 78 Q86 66 96 78" />
        </g>
      ) : (
        <g>
          <ellipse cx="54" cy="76" rx="13" ry={wide ? 17 : 14} fill={P.white} {...ink4} />
          <ellipse cx="86" cy="76" rx="13" ry={wide ? 17 : 14} fill={P.white} {...ink4} />
          <circle cx={54 + look} cy={mood === "sad" ? 80 : 77} r={wide ? 4 : 6} fill={P.ink} />
          <circle cx={86 + look} cy={mood === "sad" ? 80 : 77} r={wide ? 4 : 6} fill={P.ink} />
        </g>
      )}
      {wide ? <ellipse cx="70" cy="102" rx="5" ry="6" fill={P.ink} /> : mood === "happy" ? <path d="M60 98 Q70 108 80 98" fill="none" {...ink3} /> : <path d="M64 102 L76 102" stroke={P.ink} strokeWidth="4" strokeLinecap="round" />}
    </g>
  );
}

export function Placar({ mood = "normal", blink = false }: { mood?: FolkMood; blink?: boolean }) {
  const fur = "#8f96a8";
  const furDark = "#5f6578";
  const light = "#e3e6ee";
  const mask = "#2b2a3a";
  const look = mood === "look" ? 5 : 0;
  const wide = mood === "surprised";
  return (
    <g>
      <g transform="rotate(-24 160 210)">
        <path d="M150 214 Q196 206 210 166 Q218 140 200 132 Q176 146 168 180 Q160 200 150 214 Z" fill={fur} {...ink} />
        <path d="M204 150 L184 146 M200 168 L176 162 M188 190 L166 184" stroke={mask} strokeWidth="10" strokeLinecap="round" />
      </g>
      <ellipse cx="88" cy="252" rx="18" ry="7" fill={mask} {...ink3} />
      <ellipse cx="132" cy="252" rx="18" ry="7" fill={mask} {...ink3} />
      {folkLimb("M94 226 L90 246", "#3a3157", 20)}
      {folkLimb("M126 226 L130 246", "#3a3157", 20)}
      <path d="M58 236 Q52 182 110 168 Q168 182 162 236 Z" fill={P.white} {...ink} />
      <path d="M60 236 Q56 190 92 172 L100 236 Z" fill={P.tomato} {...ink4} />
      <path d="M160 236 Q164 190 128 172 L120 236 Z" fill={P.tomato} {...ink4} />
      <rect x="120" y="193" width="42" height="15" rx="3" fill={P.white} {...ink3} />
      <text x="141" y="204" textAnchor="middle" fontSize="7.5" fontFamily="Arial Black, Arial, sans-serif" fill={P.ink}>
        STAFF
      </text>
      {folkLimb("M150 184 Q170 208 156 230", fur, 16)}
      {folkLimb("M70 184 Q54 200 74 212", fur, 16)}
      <rect x="64" y="190" width="44" height="54" rx="4" fill="#a0683c" {...ink4} />
      <rect x="70" y="198" width="32" height="40" fill={P.white} stroke={P.ink} strokeWidth="2" />
      <path d="M74 206 L98 206 M74 214 L94 214 M74 222 L98 222 M74 230 L90 230" stroke={P.inkSoft} strokeWidth="2.5" />
      <rect x="78" y="186" width="16" height="8" rx="2" fill={P.steel} {...ink3} />
      <path d="M62 66 L56 30 L90 52 Z M158 66 L164 30 L130 52 Z" fill={fur} {...ink} />
      <path d="M64 58 L62 40 L80 52 Z M156 58 L158 40 L140 52 Z" fill={mask} />
      <path d="M52 110 Q48 58 110 54 Q172 58 168 110 Q168 158 110 162 Q52 158 52 110 Z" fill={fur} {...ink} />
      <path d="M150 74 Q172 106 162 138 Q150 156 132 160 Q166 122 150 74 Z" fill={furDark} opacity="0.45" />
      <path d="M78 126 Q110 112 142 126 Q140 160 110 162 Q80 160 78 126 Z" fill={light} {...ink4} />
      <path d="M56 100 Q84 84 110 98 Q136 84 164 100 L162 124 Q136 118 110 128 Q84 118 58 124 Z" fill={mask} {...ink4} />
      {blink ? (
        <g fill="none" stroke={P.white} strokeWidth="5" strokeLinecap="round">
          <path d="M76 108 Q86 114 96 108" />
          <path d="M124 108 Q134 114 144 108" />
        </g>
      ) : mood === "happy" ? (
        <g fill="none" stroke={P.white} strokeWidth="5" strokeLinecap="round">
          <path d="M76 110 Q86 100 96 110" />
          <path d="M124 110 Q134 100 144 110" />
        </g>
      ) : (
        <g>
          <circle cx="86" cy="108" r={wide ? 12 : 10} fill={P.white} />
          <circle cx="134" cy="108" r={wide ? 12 : 10} fill={P.white} />
          <circle cx={86 + look} cy="109" r={wide ? 4 : 5} fill={P.ink} />
          <circle cx={134 + look} cy="109" r={wide ? 4 : 5} fill={P.ink} />
        </g>
      )}
      <path
        d={wide ? "M70 84 Q86 76 100 84 M120 84 Q134 76 150 84" : mood === "happy" ? "M70 90 Q86 82 100 90 M120 90 Q134 82 150 90" : mood === "sad" ? "M70 86 L100 92 M120 92 L150 86" : "M70 86 L100 96 M120 96 L150 86"}
        fill="none"
        stroke={light}
        strokeWidth="6"
        strokeLinecap="round"
      />
      <ellipse cx="110" cy="132" rx="11" ry="7" fill={P.ink} />
      {mood === "talk" ? (
        <ellipse cx="110" cy="148" rx="8" ry="6" fill={P.ink} />
      ) : wide ? (
        <ellipse cx="110" cy="149" rx="5" ry="6" fill={P.ink} />
      ) : mood === "happy" ? (
        <path d="M98 144 Q110 156 122 144" fill="none" {...ink3} />
      ) : mood === "sad" ? (
        <path d="M100 152 Q110 144 120 152" fill="none" {...ink3} />
      ) : (
        <path d="M100 148 L120 148" fill="none" {...ink3} />
      )}
      <path d="M54 76 Q110 58 166 76 L166 84 Q110 68 54 84 Z" fill="#1d8a80" {...ink3} />
      <path d="M58 82 Q110 66 162 82 Q156 98 110 94 Q64 98 58 82 Z" fill="#2fb5a8" opacity="0.85" {...ink3} />
    </g>
  );
}

export const FOLKS = { bigodes: Bigodes, marola: Marola, tilt: Tilt, marisa: Marisa, psiu: Psiu, lento: Lento, capi: Capivaldo, clique: Clique, cavuca: Cavuca, chiado: Chiadinho, placar: Placar };

export const FOLK_INFO: Record<FolkId, { name: string; role: string; card: string }> = {
  bigodes: { name: "Sr. Bigodes", role: "Recepcionista", card: "bg-tomato" },
  marola: { name: "Capitão Marola", role: "Salva-vidas", card: "bg-sky" },
  tilt: { name: "Tilt", role: "Fliperama", card: "bg-plum-300" },
  marisa: { name: "Marisa", role: "Gaivota de férias", card: "bg-sun" },
  psiu: { name: "Psiu", role: "Mora na floresta", card: "bg-mint" },
  lento: { name: "Seu Lento", role: "Hóspede antigo", card: "bg-lime" },
  capi: { name: "Capivaldo", role: "Barraca de sucos", card: "bg-mint" },
  clique: { name: "Clique", role: "Turista", card: "bg-tangerine" },
  cavuca: { name: "Dr. Cavuca", role: "Explorador", card: "bg-sun" },
  chiado: { name: "Chiadinho", role: "Mora na floresta", card: "bg-sky" },
  placar: { name: "Placar", role: "Fliperama", card: "bg-tomato" },
};

export function FolkBust({ id, mood = "normal", className, clip = false }: { id: FolkId; mood?: FolkMood; className?: string; clip?: boolean }) {
  const [x, y, size] = FOLK_FACE[id];
  const Comp = FOLKS[id] as (props: { mood?: FolkMood }) => React.JSX.Element;
  return (
    <svg viewBox={`${x} ${y} ${size} ${size}`} className={className} aria-hidden overflow={clip ? "hidden" : "visible"}>
      <Comp mood={mood} />
    </svg>
  );
}
