import { P } from "@/lib/palette";

export type PajamaFace = "normal" | "happy" | "wow" | "fierce" | "ouch" | "dizzy";
export type PajamaKidId = "lia" | "nico" | "bia";
export type HeadView = "front" | "side" | "back";

const ink = { stroke: P.ink, strokeWidth: 5, strokeLinejoin: "round" as const, strokeLinecap: "round" as const };
const ink4 = { stroke: P.ink, strokeWidth: 4, strokeLinejoin: "round" as const, strokeLinecap: "round" as const };

export const PAJAMA_COLORS: Record<PajamaKidId, { main: string; shade: string; trim: string; accent: string }> = {
  lia: { main: "#3fae6a", shade: "#26804b", trim: "#fff3c4", accent: P.sun },
  nico: { main: "#8a6fd6", shade: "#5f49a8", trim: "#e8e0ff", accent: P.sun },
  bia: { main: "#f06ba8", shade: "#c94785", trim: "#ffe3f0", accent: P.white },
};

function Eyes({ face, y = 108, gap = 22, look = 2 }: { face: PajamaFace; y?: number; gap?: number; look?: number }) {
  const lx = 100 - gap;
  const rx = 100 + gap;
  if (face === "happy") {
    return (
      <g fill="none" {...ink} strokeWidth={5.5}>
        <path d={`M${lx - 11} ${y + 3} Q${lx} ${y - 10} ${lx + 11} ${y + 3}`} />
        <path d={`M${rx - 11} ${y + 3} Q${rx} ${y - 10} ${rx + 11} ${y + 3}`} />
      </g>
    );
  }
  if (face === "ouch") {
    return (
      <g fill="none" {...ink} strokeWidth={5.5}>
        <path d={`M${lx - 11} ${y - 8} L${lx + 9} ${y} L${lx - 11} ${y + 8}`} />
        <path d={`M${rx + 11} ${y - 8} L${rx - 9} ${y} L${rx + 11} ${y + 8}`} />
      </g>
    );
  }
  if (face === "dizzy") {
    const spiral = (cx: number) => `M${cx} ${y} m-2 0 a2 2 0 1 1 4 0 a5 5 0 1 1 -9 0 a8 8 0 1 1 15 1 a11 11 0 1 1 -20 0`;
    return (
      <g>
        <ellipse cx={lx} cy={y} rx="13" ry="14" fill={P.white} {...ink4} />
        <ellipse cx={rx} cy={y} rx="13" ry="14" fill={P.white} {...ink4} />
        <path d={spiral(lx)} fill="none" stroke={P.ink} strokeWidth="2.6" strokeLinecap="round" />
        <path d={spiral(rx)} fill="none" stroke={P.ink} strokeWidth="2.6" strokeLinecap="round" />
      </g>
    );
  }
  const ry = face === "wow" ? 16 : 13.5;
  const pupil = face === "wow" ? 5 : 6;
  return (
    <g>
      <ellipse cx={lx} cy={y} rx="12" ry={ry} fill={P.white} {...ink4} />
      <ellipse cx={rx} cy={y} rx="12" ry={ry} fill={P.white} {...ink4} />
      <circle cx={lx + look} cy={y + 1} r={pupil} fill={P.ink} />
      <circle cx={rx + look} cy={y + 1} r={pupil} fill={P.ink} />
      <circle cx={lx + 2 + look} cy={y - 2} r="1.8" fill={P.white} />
      <circle cx={rx + 2 + look} cy={y - 2} r="1.8" fill={P.white} />
      {face === "fierce" && (
        <g>
          <path d={`M${lx - 14} ${y - 15} L${lx + 14} ${y - 4} L${lx + 14} ${y - 18} Z`} fill={P.ink} />
          <path d={`M${rx + 14} ${y - 15} L${rx - 14} ${y - 4} L${rx - 14} ${y - 18} Z`} fill={P.ink} />
        </g>
      )}
    </g>
  );
}

function Mouth({ face, x = 100, y = 142, teeth = false }: { face: PajamaFace; x?: number; y?: number; teeth?: boolean }) {
  if (face === "wow") return <ellipse cx={x} cy={y + 2} rx="9" ry="11" fill={P.ink} />;
  if (face === "ouch") {
    return (
      <g>
        <path d={`M${x - 16} ${y + 6} Q${x - 8} ${y - 6} ${x} ${y + 4} Q${x + 8} ${y - 6} ${x + 16} ${y + 6} Q${x} ${y + 16} ${x - 16} ${y + 6} Z`} fill={P.ink} {...ink4} />
        <path d={`M${x - 6} ${y + 9} Q${x} ${y + 6} ${x + 6} ${y + 9}`} stroke={P.bubblegum} strokeWidth="3" fill="none" />
      </g>
    );
  }
  if (face === "dizzy") return <path d={`M${x - 16} ${y + 4} Q${x - 8} ${y - 4} ${x} ${y + 4} Q${x + 8} ${y + 12} ${x + 16} ${y + 2}`} fill="none" {...ink} />;
  if (face === "fierce") {
    return (
      <g>
        <path d={`M${x - 20} ${y - 4} Q${x} ${y + 8} ${x + 22} ${y - 6} L${x + 18} ${y + 8} Q${x} ${y + 18} ${x - 16} ${y + 8} Z`} fill={P.ink} {...ink4} />
        <path d={`M${x - 15} ${y - 1} Q${x} ${y + 7} ${x + 17} ${y - 2} L${x + 15} ${y + 4} Q${x} ${y + 10} ${x - 13} ${y + 4} Z`} fill={P.white} />
      </g>
    );
  }
  if (face === "happy") {
    return (
      <g>
        <path d={`M${x - 21} ${y - 4} Q${x} ${y + 24} ${x + 21} ${y - 4} Z`} fill={P.ink} {...ink4} />
        <path d={`M${x - 15} ${y - 2} L${x + 15} ${y - 2} L${x + 13} ${y + 3} L${x - 13} ${y + 3} Z`} fill={P.white} />
        {teeth && <rect x={x - 3} y={y - 3} width="6" height="7" fill={P.ink} />}
        <path d={`M${x - 8} ${y + 11} Q${x} ${y + 6} ${x + 8} ${y + 11} Q${x} ${y + 16} ${x - 8} ${y + 11} Z`} fill={P.bubblegum} />
      </g>
    );
  }
  return <path d={`M${x - 14} ${y} Q${x + 2} ${y + 11} ${x + 16} ${y - 3}`} fill="none" {...ink} />;
}

function Neck({ skin, shade }: { skin: string; shade: string }) {
  return (
    <g>
      <path d="M84 150 L84 180 Q100 188 116 180 L116 150 Z" fill={skin} {...ink4} />
      <path d="M84 158 Q100 170 116 158 L116 168 Q100 178 84 168 Z" fill={shade} />
    </g>
  );
}

function Pajama({ id }: { id: PajamaKidId }) {
  const c = PAJAMA_COLORS[id];
  return (
    <g>
      <path d="M18 222 Q22 184 64 174 L136 174 Q178 184 182 222 Z" fill={c.main} {...ink} />
      <path d="M150 182 Q176 192 178 222 L150 222 Z" fill={c.shade} />
      <path d="M70 172 L100 200 L130 172" fill="none" stroke={P.ink} strokeWidth="11" strokeLinejoin="round" />
      <path d="M70 172 L100 200 L130 172" fill="none" stroke={c.trim} strokeWidth="5" strokeLinejoin="round" />
      {id === "lia" && <path d="M46 196 L58 184 L56 196 L68 192 L54 212 L56 200 Z" fill={c.accent} {...ink4} strokeWidth={3} />}
      {id === "nico" && (
        <g fill={c.accent} stroke={P.ink} strokeWidth="2.5" strokeLinejoin="round">
          <path d="M48 200 l3 6 l7 1 l-5 4 l1 7 l-6 -4 l-6 4 l1 -7 l-5 -4 l7 -1 z" />
          <path d="M150 196 l2.5 5 l6 1 l-4.5 3.5 l1 6 l-5 -3 l-5 3 l1 -6 l-4.5 -3.5 l6 -1 z" />
        </g>
      )}
      {id === "bia" && (
        <g fill={c.accent} opacity="0.9">
          <circle cx="44" cy="206" r="4.5" />
          <circle cx="62" cy="192" r="4" />
          <circle cx="146" cy="196" r="4.5" />
          <circle cx="160" cy="212" r="4" />
          <circle cx="78" cy="214" r="3.5" />
        </g>
      )}
    </g>
  );
}

export function LiaHead({ face = "normal", bare = false, view = "front" }: { face?: PajamaFace; bare?: boolean; view?: HeadView }) {
  const skin = P.skinTan;
  const shade = P.skinTanShade;
  const hair = "#6b3519";
  const hairLight = "#9a5428";
  if (view === "back") {
    return (
      <g>
        {!bare && <Pajama id="lia" />}
        <Neck skin={skin} shade={shade} />
        <ellipse cx="50" cy="112" rx="11" ry="14" fill={skin} {...ink4} />
        <ellipse cx="150" cy="112" rx="11" ry="14" fill={skin} {...ink4} />
        <path d="M46 106 Q42 50 100 44 Q158 50 154 106 Q156 150 132 158 L124 148 L114 160 L104 148 L94 160 L84 148 L72 158 Q44 150 46 106 Z" fill={hair} {...ink} />
        <path d="M70 70 Q76 110 74 140 M100 60 Q104 104 100 146 M130 70 Q126 110 128 140" fill="none" stroke={hairLight} strokeWidth="4" strokeLinecap="round" />
        <path d="M46 74 Q100 92 154 74" fill="none" stroke={P.ink} strokeWidth="13" strokeLinecap="round" />
        <path d="M46 74 Q100 92 154 74" fill="none" stroke={P.sun} strokeWidth="7" strokeLinecap="round" />
        <path d="M94 84 L82 100 L96 96 Z M106 84 L120 100 L104 96 Z" fill={P.sun} {...ink4} strokeWidth={3} />
        <g fill={hair} {...ink}>
          <path d="M88 52 Q86 14 112 2 Q106 18 122 20 Q104 28 118 40 Q100 40 108 56 Z" />
        </g>
        <path d="M100 24 Q106 14 114 10 M102 38 Q108 32 116 30" fill="none" stroke={hairLight} strokeWidth="4" strokeLinecap="round" />
        <rect x="88" y="48" width="24" height="12" rx="5" fill={P.sun} {...ink4} strokeWidth={3.5} />
      </g>
    );
  }
  const fx = view === "side" ? 17 : 0;
  return (
    <g>
      <g transform={fx ? "translate(196 0) scale(-1 1)" : undefined}>
        <g fill={hair} {...ink}>
          <path d="M112 50 Q122 14 160 4 Q150 18 168 22 Q148 30 162 44 Q140 40 136 58 Z" />
        </g>
        <path d="M128 30 Q140 18 154 14 M138 42 Q148 34 158 32" fill="none" stroke={hairLight} strokeWidth="4" strokeLinecap="round" />
        <rect x="106" y="44" width="22" height="14" rx="5" fill={P.sun} {...ink4} strokeWidth={3.5} transform="rotate(-24 117 51)" />
      </g>
      {!bare && <Pajama id="lia" />}
      <Neck skin={skin} shade={shade} />
      <ellipse cx="50" cy="112" rx="11" ry="14" fill={skin} {...ink4} />
      {!fx && <ellipse cx="150" cy="112" rx="11" ry="14" fill={skin} {...ink4} />}
      <path d="M48 104 Q46 52 100 48 Q154 52 152 104 Q154 160 100 162 Q46 160 48 104 Z" fill={skin} {...ink} />
      <path d="M140 80 Q156 116 136 150 Q122 160 104 160 Q140 140 140 80 Z" fill={shade} opacity="0.65" />
      <path
        d="M44 102 Q36 50 96 42 Q158 38 158 98 L148 96 L144 80 L132 92 L126 76 L112 90 L104 72 L92 88 L80 74 L72 90 L62 80 L56 98 Z"
        fill={hair}
        {...ink}
      />
      {fx > 0 && <path d="M44 100 Q38 120 50 132 L60 128 Q50 116 56 98 Z" fill={hair} {...ink4} />}
      <path d="M66 58 Q90 48 118 52" fill="none" stroke={hairLight} strokeWidth="4" strokeLinecap="round" />
      <path d="M46 70 Q100 52 154 70" fill="none" stroke={P.ink} strokeWidth="13" strokeLinecap="round" />
      <path d="M46 70 Q100 52 154 70" fill="none" stroke={P.sun} strokeWidth="7" strokeLinecap="round" />
      <path d="M86 58 L94 62 M104 57 L112 60" stroke={P.tomato} strokeWidth="3" strokeLinecap="round" />
      <g transform={`translate(${fx} 0)`}>
      <Eyes face={face} y={110} gap={fx ? 18 : 22} look={fx ? 5 : 3} />
      {face !== "ouch" && face !== "dizzy" && (
        <path d={face === "fierce" ? "M64 92 L90 98 M110 98 L136 90" : "M64 92 Q76 84 90 90 M110 88 Q124 82 136 90"} fill="none" {...ink4} strokeWidth={5} />
      )}
      <g fill={P.blush} opacity="0.55">
        <ellipse cx="68" cy="132" rx="9" ry="5" />
        <ellipse cx="132" cy="132" rx="9" ry="5" />
      </g>
      <path d="M100 118 Q95 128 104 130" fill="none" {...ink4} strokeWidth={3.5} />
      <Mouth face={face === "normal" ? "happy" : face} y={144} teeth={false} />
      </g>
    </g>
  );
}

export function NicoHead({ face = "normal", bare = false, view = "front" }: { face?: PajamaFace; bare?: boolean; view?: HeadView }) {
  const skin = "#d99e72";
  const shade = "#b57a50";
  const hair = "#1d1a33";
  const hairLight = "#3a3560";
  const frame = P.ink;
  if (view === "back") {
    return (
      <g>
        {!bare && <Pajama id="nico" />}
        <Neck skin={skin} shade={shade} />
        <path d="M44 100 L60 104 M156 100 L140 104" stroke={frame} strokeWidth="5" strokeLinecap="round" />
        <ellipse cx="50" cy="112" rx="11" ry="14" fill={skin} {...ink4} />
        <ellipse cx="150" cy="112" rx="11" ry="14" fill={skin} {...ink4} />
        <path d="M46 108 Q40 46 100 42 Q160 46 154 108 Q154 142 136 150 Q118 144 100 152 Q82 144 64 150 Q46 142 46 108 Z" fill={hair} {...ink} />
        <path d="M70 66 Q80 104 76 136 M100 56 Q106 100 100 140 M130 66 Q122 104 126 136" fill="none" stroke={hairLight} strokeWidth="4.5" strokeLinecap="round" />
        <path d="M100 44 Q108 16 128 18 Q114 26 112 44" fill={hair} {...ink4} />
        <path d="M86 70 Q100 62 114 70 Q106 80 100 74 Q94 80 86 70 Z" fill={hairLight} />
      </g>
    );
  }
  const fx = view === "side" ? 17 : 0;
  return (
    <g>
      {!bare && <Pajama id="nico" />}
      <Neck skin={skin} shade={shade} />
      <ellipse cx="50" cy="112" rx="11" ry="14" fill={skin} {...ink4} />
      {!fx && <ellipse cx="150" cy="112" rx="11" ry="14" fill={skin} {...ink4} />}
      <path d="M50 104 Q48 52 100 50 Q152 52 150 104 Q152 160 100 162 Q48 160 50 104 Z" fill={skin} {...ink} />
      <path d="M140 80 Q156 116 136 150 Q122 160 104 160 Q140 140 140 80 Z" fill={shade} opacity="0.6" />
      <path
        d="M44 108 Q34 46 98 38 Q162 34 158 104 L150 106 Q150 86 140 78 Q118 94 92 84 Q70 94 58 84 Q50 94 52 110 Z"
        fill={hair}
        {...ink}
      />
      <path d="M100 40 Q108 16 128 18 Q114 26 112 42" fill={hair} {...ink4} />
      <path d="M62 62 Q88 50 120 56" fill="none" stroke={hairLight} strokeWidth="4.5" strokeLinecap="round" />
      {fx > 0 && <path d="M44 104 Q40 124 52 136 L60 130 Q52 118 58 100 Z" fill={hair} {...ink4} />}
      <g transform={`translate(${fx} 0)`}>
      <Eyes face={face} y={110} gap={fx ? 19 : 23} look={fx ? 5 : face === "fierce" ? 4 : 2} />
      <g>
        <rect x={fx ? 61 : 55} y="93" width={fx ? 38 : 44} height="34" rx="9" fill={P.skyPale} fillOpacity="0.28" stroke={frame} strokeWidth="6" />
        <rect x="101" y="93" width={fx ? 36 : 44} height="34" rx="9" fill={P.skyPale} fillOpacity="0.28" stroke={frame} strokeWidth="6" />
        <path d="M97 104 Q100 100 103 104" fill="none" stroke={frame} strokeWidth="5" />
        <path d={fx ? "M58 100 L40 98" : "M56 100 L48 96 M144 100 L152 96"} stroke={frame} strokeWidth="5" strokeLinecap="round" />
        <path d="M62 100 L72 98 M108 100 L118 98" stroke={P.white} strokeWidth="3.5" strokeLinecap="round" />
      </g>
      {face !== "dizzy" && face !== "ouch" && (
        <path d={face === "fierce" ? "M60 84 L92 90 M108 88 L138 78" : "M60 84 Q74 78 90 84 M108 80 Q124 70 140 78"} fill="none" {...ink4} strokeWidth={5} />
      )}
      <path d="M100 120 Q95 130 104 131" fill="none" {...ink4} strokeWidth={3.5} />
      {face === "normal" ? (
        <g>
          <path d="M84 144 Q100 150 118 138" fill="none" {...ink} />
          <path d="M112 141 Q118 152 110 154 Q104 150 108 144 Z" fill={P.bubblegum} {...ink4} strokeWidth={3} />
        </g>
      ) : (
        <Mouth face={face} y={143} />
      )}
      </g>
    </g>
  );
}

export function BiaHead({ face = "normal", bare = false, view = "front" }: { face?: PajamaFace; bare?: boolean; view?: HeadView }) {
  const skin = P.skinLight;
  const shade = P.skinLightShade;
  const hair = "#e8642a";
  const hairLight = "#ff9a52";
  const freckle = "#d0784c";
  if (view === "back") {
    return (
      <g>
        {!bare && <Pajama id="bia" />}
        <Neck skin={skin} shade={shade} />
        <ellipse cx="52" cy="114" rx="11" ry="14" fill={skin} {...ink4} />
        <ellipse cx="148" cy="114" rx="11" ry="14" fill={skin} {...ink4} />
        <path d="M46 108 Q42 50 100 44 Q158 50 154 108 Q154 146 132 154 Q116 150 100 156 Q84 150 68 154 Q46 146 46 108 Z" fill={hair} {...ink} />
        <path d="M100 46 L100 152" stroke={P.ink} strokeWidth="4" strokeLinecap="round" />
        <path d="M72 66 Q66 100 74 140 M128 66 Q134 100 126 140" fill="none" stroke={hairLight} strokeWidth="4.5" strokeLinecap="round" />
        <g fill={hair} {...ink}>
          <path d="M50 90 Q8 76 12 124 Q16 166 42 148 Q32 126 56 110 Z" />
          <path d="M150 90 Q192 76 188 124 Q184 166 158 148 Q168 126 144 110 Z" />
        </g>
        <path d="M24 106 Q20 126 28 144 M176 106 Q180 126 172 144" fill="none" stroke={hairLight} strokeWidth="4" strokeLinecap="round" />
        <g fill={P.mint} {...ink4} strokeWidth={3.5}>
          <ellipse cx="50" cy="96" rx="9" ry="12" transform="rotate(-30 50 96)" />
          <ellipse cx="150" cy="96" rx="9" ry="12" transform="rotate(30 150 96)" />
        </g>
      </g>
    );
  }
  const fx = view === "side" ? 17 : 0;
  return (
    <g>
      <g fill={hair} {...ink}>
        <path d="M44 92 Q4 80 10 128 Q14 168 40 150 Q30 128 52 112 Z" />
        <path d="M156 92 Q196 80 190 128 Q186 168 160 150 Q170 128 148 112 Z" />
      </g>
      <path d="M22 108 Q18 128 26 146 M178 108 Q182 128 174 146" fill="none" stroke={hairLight} strokeWidth="4" strokeLinecap="round" />
      <g fill={P.mint} {...ink4} strokeWidth={3.5}>
        <ellipse cx="46" cy="96" rx="9" ry="12" transform="rotate(-30 46 96)" />
        <ellipse cx="154" cy="96" rx="9" ry="12" transform="rotate(30 154 96)" />
      </g>
      {!bare && <Pajama id="bia" />}
      <Neck skin={skin} shade={shade} />
      <ellipse cx="52" cy="114" rx="11" ry="14" fill={skin} {...ink4} />
      {!fx && <ellipse cx="148" cy="114" rx="11" ry="14" fill={skin} {...ink4} />}
      <path d="M50 106 Q48 54 100 52 Q152 54 150 106 Q152 162 100 164 Q48 162 50 106 Z" fill={skin} {...ink} />
      <path d="M140 84 Q156 118 136 152 Q122 162 104 162 Q140 142 140 84 Z" fill={shade} opacity="0.55" />
      <path d="M46 100 Q42 44 100 42 Q158 44 154 100 Q150 84 140 80 Q128 88 116 80 Q104 88 92 80 Q80 88 68 80 Q56 86 46 100 Z" fill={hair} {...ink} />
      <path d="M64 58 Q90 48 120 54" fill="none" stroke={hairLight} strokeWidth="4.5" strokeLinecap="round" />
      <g transform={`translate(${fx} 0)`}>
      <Eyes face={face} y={112} gap={fx ? 18 : 22} look={fx ? 5 : 2} />
      {face !== "dizzy" && face !== "ouch" && (
        <path d={face === "fierce" ? "M64 92 L90 98 M110 98 L136 92" : "M64 94 Q76 88 90 92 M110 92 Q124 88 136 94"} fill="none" {...ink4} strokeWidth={4.5} />
      )}
      <g fill={freckle}>
        <circle cx="66" cy="128" r="2.4" />
        <circle cx="74" cy="134" r="2.4" />
        <circle cx="62" cy="136" r="2.2" />
        <circle cx="80" cy="128" r="2" />
        <circle cx="134" cy="128" r="2.4" />
        <circle cx="126" cy="134" r="2.4" />
        <circle cx="138" cy="136" r="2.2" />
        <circle cx="120" cy="128" r="2" />
      </g>
      <path d="M100 120 Q96 128 104 130" fill="none" {...ink4} strokeWidth={3.5} />
      <Mouth face={face === "normal" ? "happy" : face} y={145} teeth />
      </g>
    </g>
  );
}

export const PAJAMA_HEADS = { lia: LiaHead, nico: NicoHead, bia: BiaHead };

export function PajamaBust({ who, face = "normal", className, title }: { who: PajamaKidId; face?: PajamaFace; className?: string; title?: string }) {
  const Head = PAJAMA_HEADS[who];
  return (
    <svg viewBox="0 0 200 222" className={className} role={title ? "img" : undefined} aria-label={title} aria-hidden={title ? undefined : true} overflow="visible">
      <Head face={face} />
    </svg>
  );
}
