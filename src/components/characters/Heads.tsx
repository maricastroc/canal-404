import { P } from "@/lib/palette";

export type Face = "normal" | "happy" | "wow";

const ink = { stroke: P.ink, strokeWidth: 5, strokeLinejoin: "round" as const, strokeLinecap: "round" as const };
const ink4 = { stroke: P.ink, strokeWidth: 4, strokeLinejoin: "round" as const, strokeLinecap: "round" as const };

function Eyes({
  face,
  y = 106,
  gap = 22,
  lids = false,
  look = 0,
}: {
  face: Face;
  y?: number;
  gap?: number;
  lids?: boolean;
  look?: number;
}) {
  const lx = 100 - gap;
  const rx = 100 + gap;
  if (face === "happy" && !lids) {
    return (
      <g fill="none" {...ink} strokeWidth={5.5}>
        <path d={`M${lx - 11} ${y + 3} Q${lx} ${y - 10} ${lx + 11} ${y + 3}`} />
        <path d={`M${rx - 11} ${y + 3} Q${rx} ${y - 10} ${rx + 11} ${y + 3}`} />
      </g>
    );
  }
  const ry = face === "wow" ? 16 : 13.5;
  return (
    <g>
      <ellipse cx={lx} cy={y} rx="12" ry={ry} fill={P.white} {...ink4} />
      <ellipse cx={rx} cy={y} rx="12" ry={ry} fill={P.white} {...ink4} />
      <circle cx={lx + 2 + look} cy={y + (lids ? 4 : 1)} r={face === "wow" ? 5 : 6} fill={P.ink} />
      <circle cx={rx + 2 + look} cy={y + (lids ? 4 : 1)} r={face === "wow" ? 5 : 6} fill={P.ink} />
      <circle cx={lx + 4 + look} cy={y - 2} r="1.8" fill={P.white} />
      <circle cx={rx + 4 + look} cy={y - 2} r="1.8" fill={P.white} />
      {lids && (
        <g>
          <path d={`M${lx - 13} ${y - 1} Q${lx} ${y - 18} ${lx + 13} ${y - 1} Z`} fill="#f2d6bd" {...ink4} />
          <path d={`M${rx - 13} ${y - 1} Q${rx} ${y - 18} ${rx + 13} ${y - 1} Z`} fill="#f2d6bd" {...ink4} />
        </g>
      )}
    </g>
  );
}

function Shoulders({ color, shade, collar }: { color: string; shade: string; collar?: string }) {
  return (
    <g>
      <path d="M18 222 Q22 184 64 174 L136 174 Q178 184 182 222 Z" fill={color} {...ink} />
      <path d="M150 182 Q176 192 178 222 L150 222 Z" fill={shade} />
      {collar && <path d="M74 172 L100 196 L126 172 L114 168 L100 182 L86 168 Z" fill={collar} {...ink4} />}
    </g>
  );
}

function Neck({ skin, shade }: { skin: string; shade: string }) {
  return (
    <g>
      <path d="M84 150 L84 180 Q100 188 116 180 L116 150 Z" fill={skin} {...ink4} />
      <path d="M84 158 Q100 170 116 158 L116 168 Q100 178 84 168 Z" fill={shade} />
    </g>
  );
}

function Mouth({ face, x = 100, y = 140, gap = false }: { face: Face; x?: number; y?: number; gap?: boolean }) {
  if (face === "wow") {
    return <ellipse cx={x} cy={y + 2} rx="8" ry="10" fill={P.ink} />;
  }
  if (face === "happy") {
    return (
      <g>
        <path d={`M${x - 20} ${y - 4} Q${x} ${y + 22} ${x + 20} ${y - 4} Z`} fill={P.ink} {...ink4} />
        <path d={`M${x - 14} ${y - 2} L${x + 14} ${y - 2} L${x + 12} ${y + 3} L${x - 12} ${y + 3} Z`} fill={P.white} />
        {gap && <rect x={x - 3} y={y - 3} width="6" height="7" fill={P.ink} />}
        <path d={`M${x - 8} ${y + 10} Q${x} ${y + 5} ${x + 8} ${y + 10} Q${x} ${y + 15} ${x - 8} ${y + 10} Z`} fill={P.bubblegum} />
      </g>
    );
  }
  return <path d={`M${x - 14} ${y} Q${x} ${y + 10} ${x + 14} ${y - 2}`} fill="none" {...ink} />;
}

export function LinaHead({ face = "normal" }: { face?: Face }) {
  const skin = P.skinBrown;
  const shade = P.skinBrownShade;
  const hair = "#3b2216";
  return (
    <g>
      <Shoulders color={P.tangerine} shade={P.tangerineDeep} />
      <path d="M58 176 L58 222 M142 176 L142 222" stroke={P.mintDeep} strokeWidth="12" />
      <path d="M58 176 L58 222 M142 176 L142 222" stroke={P.mint} strokeWidth="6" />
      <circle cx="58" cy="200" r="5" fill={P.sun} {...ink4} strokeWidth={3} />
      <circle cx="142" cy="200" r="5" fill={P.sun} {...ink4} strokeWidth={3} />
      <Neck skin={skin} shade={shade} />
      <g fill={hair} {...ink}>
        <circle cx="42" cy="66" r="26" />
        <circle cx="158" cy="66" r="26" />
        <circle cx="30" cy="96" r="20" />
        <circle cx="170" cy="96" r="20" />
      </g>
      <ellipse cx="50" cy="112" rx="11" ry="14" fill={skin} {...ink4} />
      <ellipse cx="150" cy="112" rx="11" ry="14" fill={skin} {...ink4} />
      <path d="M48 104 Q46 52 100 48 Q154 52 152 104 Q154 160 100 162 Q46 160 48 104 Z" fill={skin} {...ink} />
      <path d="M140 80 Q156 116 136 150 Q122 160 104 160 Q140 140 140 80 Z" fill={shade} opacity="0.7" />
      <path d="M50 82 Q60 40 100 40 Q140 40 150 82 Q130 62 112 72 Q100 56 84 70 Q66 60 50 82 Z" fill={hair} {...ink} />
      <g>
        <path d="M46 78 Q100 62 154 78" fill="none" stroke={P.ink} strokeWidth="13" strokeLinecap="round" />
        <path d="M46 78 Q100 62 154 78" fill="none" stroke={P.plum500} strokeWidth="7" strokeLinecap="round" />
        <circle cx="80" cy="70" r="15" fill={P.screen} {...ink} />
        <circle cx="120" cy="70" r="15" fill={P.screen} {...ink} />
        <path d="M73 64 Q77 59 83 60 M113 64 Q117 59 123 60" stroke={P.white} strokeWidth="3.5" fill="none" strokeLinecap="round" />
      </g>
      <g transform="rotate(-30 160 120)">
        <rect x="150" y="80" width="9" height="46" rx="2" fill={P.sun} {...ink4} strokeWidth={3.5} />
        <path d="M150 126 L154.5 138 L159 126 Z" fill={P.cream} {...ink4} strokeWidth={3} />
      </g>
      <Eyes face={face} y={108} gap={22} />
      <path d="M68 90 Q78 84 90 88 M110 88 Q122 84 132 90" fill="none" {...ink4} strokeWidth={4.5} />
      <g fill={shade}>
        <circle cx="70" cy="128" r="2.4" />
        <circle cx="77" cy="133" r="2.4" />
        <circle cx="64" cy="134" r="2.4" />
        <circle cx="130" cy="128" r="2.4" />
        <circle cx="123" cy="133" r="2.4" />
        <circle cx="136" cy="134" r="2.4" />
      </g>
      <path d="M98 116 Q94 126 102 128" fill="none" {...ink4} strokeWidth={3.5} />
      <Mouth face={face} y={142} />
    </g>
  );
}

export function BrunoHead({ face = "normal" }: { face?: Face }) {
  const skin = P.skinLight;
  const shade = P.skinLightShade;
  const hair = "#4a2c1c";
  return (
    <g>
      <Shoulders color={P.sky} shade={P.skyDeep} collar={P.white} />
      <rect x="120" y="192" width="22" height="22" rx="2" fill={P.skyDeep} {...ink4} strokeWidth={3} />
      <path d="M126 186 L126 200 M134 184 L134 200" stroke={P.tomato} strokeWidth="4" strokeLinecap="round" />
      <path d="M126 186 L126 200 M134 184 L134 200" stroke={P.ink} strokeWidth="1.5" strokeLinecap="round" opacity="0.4" />
      <Neck skin={skin} shade={shade} />
      <ellipse cx="50" cy="112" rx="11" ry="14" fill={skin} {...ink4} />
      <ellipse cx="150" cy="112" rx="11" ry="14" fill={skin} {...ink4} />
      <path d="M50 104 Q48 50 100 48 Q152 50 150 104 Q152 160 100 162 Q48 160 50 104 Z" fill={skin} {...ink} />
      <path d="M140 80 Q156 116 136 150 Q122 160 104 160 Q140 140 140 80 Z" fill={shade} opacity="0.6" />
      <path
        d="M46 100 Q38 50 92 38 Q146 30 158 80 Q160 96 152 100 Q148 72 118 70 Q98 82 70 74 Q58 84 56 104 Z"
        fill={hair}
        {...ink}
      />
      <path d="M96 40 Q104 22 118 26 Q108 30 106 42" fill={hair} {...ink4} />
      <path d="M70 60 Q92 52 118 58" fill="none" stroke="#6b4430" strokeWidth="4" strokeLinecap="round" />
      <Eyes face={face === "happy" ? "normal" : face} y={108} gap={23} look={2} />
      <g fill="none">
        <circle cx="77" cy="108" r="21" fill={P.skyPale} fillOpacity="0.35" {...ink} />
        <circle cx="123" cy="108" r="21" fill={P.skyPale} fillOpacity="0.35" {...ink} />
        <path d="M98 106 Q100 102 102 106" {...ink4} />
        <path d="M56 104 L50 100 M144 104 L150 100" {...ink4} />
        <path d="M64 96 Q70 90 78 92" stroke={P.white} strokeWidth="3.5" strokeLinecap="round" />
      </g>
      <path d="M62 80 Q76 74 90 80 M110 82 Q124 76 138 82" fill="none" {...ink4} strokeWidth={4.5} />
      <path d="M100 116 Q96 128 104 129" fill="none" {...ink4} strokeWidth={3.5} />
      {face === "happy" ? <Mouth face="happy" y={142} /> : face === "wow" ? <Mouth face="wow" y={142} /> : <path d="M86 144 Q100 148 116 138" fill="none" {...ink} />}
    </g>
  );
}

export function DecoHead({ face = "normal", view = "front", bare = false }: { face?: Face; view?: "front" | "side" | "back"; bare?: boolean }) {
  const skin = P.skinTan;
  const shade = P.skinTanShade;
  const hair = P.tangerineDeep;
  const spikes = "M44 96 L30 70 L54 72 L44 40 L74 56 L80 20 L100 48 L118 16 L126 52 L156 34 L148 66 L176 66 L156 92 Q150 76 132 74 Q118 84 100 74 Q82 86 66 76 Q52 82 44 96 Z";
  if (view === "back") {
    return (
      <g>
        {!bare && (
          <g>
            <Shoulders color={P.sun} shade={P.sunDeep} />
            <path d="M22 206 Q100 196 178 206" fill="none" stroke={P.tomato} strokeWidth="9" />
          </g>
        )}
        <Neck skin={skin} shade={shade} />
        <ellipse cx="50" cy="114" rx="12" ry="15" fill={skin} {...ink4} />
        <ellipse cx="150" cy="114" rx="12" ry="15" fill={skin} {...ink4} />
        <path d="M50 106 Q48 54 100 52 Q152 54 150 106 Q152 162 100 164 Q48 162 50 106 Z" fill={skin} {...ink} />
        <path d="M44 120 L28 96 L50 92 L34 62 L64 70 L62 34 L90 54 L100 18 L114 52 L140 32 L138 68 L170 60 L154 94 L174 100 L152 124 Q150 150 130 156 L118 142 L106 158 L94 142 L82 158 L70 142 Q50 146 44 120 Z" fill={hair} {...ink} />
        <path d="M70 70 L84 92 M100 40 L102 70 M130 62 L118 90 M60 110 L80 120 M140 108 L120 120" stroke={P.tangerine} strokeWidth="4" strokeLinecap="round" />
      </g>
    );
  }
  const fx = view === "side" ? 16 : 0;
  return (
    <g>
      {!bare && (
        <g>
          <Shoulders color={P.sun} shade={P.sunDeep} />
          <path d="M22 206 Q100 196 178 206" fill="none" stroke={P.tomato} strokeWidth="9" />
        </g>
      )}
      <Neck skin={skin} shade={shade} />
      <ellipse cx="50" cy="114" rx="12" ry="15" fill={skin} {...ink4} />
      {!fx && <ellipse cx="150" cy="114" rx="12" ry="15" fill={skin} {...ink4} />}
      <path d="M50 106 Q48 54 100 52 Q152 54 150 106 Q152 162 100 164 Q48 162 50 106 Z" fill={skin} {...ink} />
      <path d="M140 84 Q156 118 136 152 Q122 162 104 162 Q140 142 140 84 Z" fill={shade} opacity="0.65" />
      <path d={spikes} fill={hair} {...ink} />
      {fx > 0 && <path d="M46 98 L30 112 L50 116 L40 134 L58 126 Q52 112 56 100 Z" fill={hair} {...ink4} />}
      <path d="M78 40 L90 56 M120 34 L118 54 M58 60 L70 68" stroke={P.tangerine} strokeWidth="4" strokeLinecap="round" />
      <g transform={`translate(${fx} 0)`}>
      <Eyes face={face} y={110} gap={fx ? 20 : 23} look={fx ? 5 : -1} />
      <path d="M64 88 L90 94 M110 94 L136 86" fill="none" {...ink} strokeWidth={6} />
      <g fill={shade}>
        <circle cx="68" cy="132" r="2.4" />
        <circle cx="62" cy="138" r="2.4" />
        <circle cx="132" cy="134" r="2.4" />
      </g>
      <g transform="rotate(-24 136 136)">
        <rect x="122" y="128" width="30" height="14" rx="5" fill={P.cream} {...ink4} strokeWidth={3} />
        <path d="M130 130 L130 140 M136 130 L136 140 M142 130 L142 140" stroke={P.cream3} strokeWidth="2" />
      </g>
      <path d="M100 118 Q94 128 104 130" fill="none" {...ink4} strokeWidth={3.5} />
      <Mouth face={face === "normal" ? "happy" : face} y={144} gap />
      </g>
    </g>
  );
}

export function MilaHead({ face = "normal" }: { face?: Face }) {
  const skin = "#f6dcc4";
  const shade = "#ddb498";
  const hair = "#2a1f3d";
  return (
    <g>
      <path d="M36 110 Q30 40 100 36 Q170 40 164 110 L172 210 L28 210 Z" fill={hair} {...ink} />
      <Shoulders color={P.plum800} shade={P.plum950} />
      <path d="M40 200 L160 200 M44 212 L156 212" stroke={P.mint} strokeWidth="5" />
      <Neck skin={skin} shade={shade} />
      <path d="M52 104 Q50 54 100 52 Q150 54 148 104 Q150 160 100 162 Q50 160 52 104 Z" fill={skin} {...ink} />
      <path d="M138 82 Q154 116 134 150 Q122 160 104 160 Q138 140 138 82 Z" fill={shade} opacity="0.6" />
      <path d="M46 96 Q46 44 100 44 Q154 44 154 96 L140 98 L136 82 L124 96 L118 80 L106 96 L100 80 L92 96 L84 80 L76 96 L66 82 L60 98 Z" fill={hair} {...ink} />
      <path d="M50 100 Q44 150 58 186 L46 190 Q34 150 42 100 Z M150 100 Q156 150 142 186 L154 190 Q166 150 158 100 Z" fill={hair} {...ink4} />
      <g transform="translate(138 64) rotate(18)">
        <circle r="13" fill={P.white} {...ink4} />
        <circle r="6" fill={P.mint} stroke={P.ink} strokeWidth="2.5" />
        <circle r="2.6" fill={P.ink} />
        <path d="M-13 0 L-20 -6 M-13 4 L-21 4" stroke={P.ink} strokeWidth="3" strokeLinecap="round" />
      </g>
      {face === "happy" ? (
        <Eyes face="normal" y={112} gap={22} lids />
      ) : face === "wow" ? (
        <Eyes face="wow" y={112} gap={22} />
      ) : (
        <Eyes face="normal" y={112} gap={22} lids />
      )}
      <g fill={P.bubblegum} opacity="0.4">
        <ellipse cx="70" cy="132" rx="9" ry="5" />
        <ellipse cx="130" cy="132" rx="9" ry="5" />
      </g>
      <path d="M100 120 Q97 128 103 129" fill="none" {...ink4} strokeWidth={3} />
      {face === "happy" ? (
        <path d="M88 142 Q100 150 112 140" fill="none" {...ink4} strokeWidth={4.5} />
      ) : face === "wow" ? (
        <ellipse cx="100" cy="144" rx="5" ry="6" fill={P.ink} />
      ) : (
        <path d="M90 144 L110 143" fill="none" {...ink4} strokeWidth={4.5} />
      )}
    </g>
  );
}

export const HEADS = {
  lina: LinaHead,
  bruno: BrunoHead,
  deco: DecoHead,
  mila: MilaHead,
};

export type KidId = keyof typeof HEADS;

export function KidBust({
  who,
  face = "normal",
  className,
  title,
  frame,
}: {
  who: KidId;
  face?: Face;
  className?: string;
  title?: string;
  frame?: { x: number; y: number; width: number; height: number };
}) {
  const Head = HEADS[who];
  return (
    <svg
      viewBox="0 0 200 222"
      className={className}
      {...frame}
      role={title ? "img" : undefined}
      aria-label={title}
      aria-hidden={title ? undefined : true}
      overflow="visible"
    >
      <Head face={face} />
    </svg>
  );
}
