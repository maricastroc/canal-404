import { P } from "@/lib/palette";

export type BrunoPose = "ready" | "strike" | "jump" | "run" | "charge";
export type BrunoFace = "fierce" | "thrill" | "shout" | "proud";

const SKIN = P.skinLight;
const SHADE = P.skinLightShade;
const HAIR = "#4a2c1c";
const ink = { stroke: P.ink, strokeWidth: 5, strokeLinejoin: "round" as const, strokeLinecap: "round" as const };
const ink4 = { ...ink, strokeWidth: 4 };

function Eyes({ face }: { face: BrunoFace }) {
  const wide = face === "thrill";
  const ry = wide ? 15 : 13;
  const look = face === "proud" ? 4 : 2;
  return (
    <g>
      {[77, 123].map((x) => (
        <g key={x}>
          <ellipse cx={x} cy={108} rx={12} ry={ry} fill={P.white} {...ink4} />
          <circle cx={x + look} cy={wide ? 108 : 110} r={wide ? 5 : 6} fill={P.ink} />
          <circle cx={x + look + 2} cy={wide ? 105 : 107} r={1.8} fill={P.white} />
        </g>
      ))}
      {(face === "fierce" || face === "shout") && (
        <g>
          <path d="M62 92 L93 104 L93 92 Z M107 104 L138 92 L107 92 Z" fill={SKIN} />
          <path d="M64 97 L91 105 M109 105 L136 97" fill="none" {...ink4} />
        </g>
      )}
    </g>
  );
}

function Brows({ face }: { face: BrunoFace }) {
  const d = {
    fierce: "M60 80 L90 92 M110 92 L140 80",
    shout: "M60 78 L90 92 M110 92 L140 78",
    thrill: "M62 76 Q76 64 90 72 M110 72 Q124 64 138 76",
    proud: "M62 80 Q76 72 90 78 M110 78 Q124 72 138 80",
  }[face];
  return <path d={d} fill="none" {...ink} strokeWidth={face === "fierce" || face === "shout" ? 6 : 5} />;
}

function Mouth({ face }: { face: BrunoFace }) {
  if (face === "shout") {
    return (
      <g>
        <path d="M80 132 Q100 126 120 132 Q124 154 100 162 Q76 154 80 132 Z" fill={P.ink} {...ink4} />
        <path d="M85 133 Q100 129 115 133 L114 139 Q100 136 86 139 Z" fill={P.white} />
        <path d="M88 154 Q100 146 112 154 Q100 160 88 154 Z" fill={P.bubblegum} />
      </g>
    );
  }
  if (face === "thrill") {
    return (
      <g>
        <path d="M80 136 Q100 164 120 136 Z" fill={P.ink} {...ink4} />
        <path d="M85 138 L115 138 L113 143 L87 143 Z" fill={P.white} />
        <path d="M91 150 Q100 145 109 150 Q100 155 91 150 Z" fill={P.bubblegum} />
      </g>
    );
  }
  if (face === "fierce") {
    return (
      <g>
        <path d="M84 138 Q102 154 120 134 Q104 142 84 138 Z" fill={P.ink} {...ink4} />
        <path d="M89 140 Q103 146 116 137 L114 141 Q103 148 90 143 Z" fill={P.white} />
      </g>
    );
  }
  return (
    <g>
      <path d="M80 136 Q100 156 122 132" fill="none" {...ink} />
      <path d="M122 132 Q126 134 125 138" fill="none" {...ink4} strokeWidth={3} />
    </g>
  );
}

function Head({ face }: { face: BrunoFace }) {
  return (
    <g transform="translate(15 0) scale(0.6)">
      <path d="M84 150 L84 180 Q100 188 116 180 L116 150 Z" fill={SKIN} {...ink4} />
      <path d="M84 158 Q100 170 116 158 L116 168 Q100 178 84 168 Z" fill={SHADE} />
      <path d="M74 172 L100 196 L126 172 L114 168 L100 182 L86 168 Z" fill={P.white} {...ink4} />
      <rect x="122" y="196" width="18" height="18" rx="2" fill={P.skyDeep} {...ink4} strokeWidth={3} />
      <path d="M127 190 L127 202 M134 188 L134 202" stroke={P.tomato} strokeWidth="4" strokeLinecap="round" />
      <ellipse cx="50" cy="112" rx="11" ry="14" fill={SKIN} {...ink4} />
      <ellipse cx="150" cy="112" rx="11" ry="14" fill={SKIN} {...ink4} />
      <path d="M50 104 Q48 50 100 48 Q152 50 150 104 Q152 160 100 162 Q48 160 50 104 Z" fill={SKIN} {...ink} />
      <path d="M140 80 Q156 116 136 150 Q122 160 104 160 Q140 140 140 80 Z" fill={SHADE} opacity="0.6" />
      <path d="M46 100 Q38 50 92 38 Q146 30 158 80 Q160 96 152 100 Q148 72 118 70 Q98 82 70 74 Q58 84 56 104 Z" fill={HAIR} {...ink} />
      <path d="M96 40 Q104 22 118 26 Q108 30 106 42" fill={HAIR} {...ink4} />
      <path d="M70 60 Q92 52 118 58" fill="none" stroke="#6b4430" strokeWidth="4" strokeLinecap="round" />
      <Eyes face={face} />
      <g fill="none">
        <circle cx="77" cy="108" r="21" fill={P.skyPale} fillOpacity="0.35" {...ink} />
        <circle cx="123" cy="108" r="21" fill={P.skyPale} fillOpacity="0.35" {...ink} />
        <path d="M98 106 Q100 102 102 106" {...ink4} />
        <path d="M56 104 L50 100 M144 104 L150 100" {...ink4} />
        <path d="M64 96 Q70 90 78 92" stroke={P.white} strokeWidth="3.5" strokeLinecap="round" />
      </g>
      <Brows face={face} />
      <path d="M100 116 Q96 128 104 129" fill="none" {...ink4} strokeWidth={3.5} />
      <Mouth face={face} />
    </g>
  );
}

const BODY = {
  charge: {
    before: (
      <>
        <path d="M64 166 Q56 186 48 199" fill="none" stroke="#1d1830" strokeWidth="20" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M64 166 Q56 186 48 199" fill="none" stroke="#2b2150" strokeWidth="11" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M86 166 Q106 176 106 198" fill="none" stroke="#1d1830" strokeWidth="20" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M86 166 Q106 176 106 198" fill="none" stroke="#2b2150" strokeWidth="11" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M32 210 L32 203 Q32 196 42 196 L52 197 Q66 199 66 210 Z" fill="#ef4f43" stroke="#1d1830" strokeWidth="4" strokeLinejoin="round" />
        <path d="M92 210 L92 203 Q92 196 102 196 L112 197 Q126 199 126 210 Z" fill="#ef4f43" stroke="#1d1830" strokeWidth="4" strokeLinejoin="round" />
        <path d="M50 130 Q36 140 26 150" fill="none" stroke="#1d1830" strokeWidth="18" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M50 130 Q36 140 26 150" fill="none" stroke="#5cb9f0" strokeWidth="9" strokeLinecap="round" strokeLinejoin="round" />
        <circle cx="25" cy="152" r="9" fill="#f6dcc4" stroke="#1d1830" strokeWidth="4" />
        <path d="M47 124 Q48 109 75 105 Q102 109 103 124 L104 172 L46 172 Z" fill="#5cb9f0" stroke="#1d1830" strokeWidth="5" strokeLinejoin="round" />
        <path d="M88 128 L102 128 L104 172 L92 172 Z" fill="#2f86c9" />
        <path d="M46 158 L104 158" stroke="#3f3170" strokeWidth="6" />
        <rect x="70" y="155" width="12" height="7" rx="2" fill="#ffc83d" stroke="#1d1830" strokeWidth="2.5" />
      </>
    ),
    after: (
      <>
        <g transform="translate(122 110) rotate(-58)">
          <rect x="-10" y="-6" width="24" height="12" rx="4" fill="#c9d4e4" stroke="#1d1830" strokeWidth="4" />
          <path d="M-4 -6 L-4 6 M4 -6 L4 6" stroke="#9aa6b8" strokeWidth="2.5" />
          <rect x="14" y="-14" width="10" height="28" rx="3" fill="#a96d36" stroke="#1d1830" strokeWidth="4" />
          <path d="M24 -9 L90 -9 Q104 -9 108 0 Q104 9 90 9 L24 9 Z" fill="#d9a066" stroke="#1d1830" strokeWidth="4.5" strokeLinejoin="round" />
          <path d="M32 -3 L84 -3 M32 3 L80 3" stroke="#b07a44" strokeWidth="2.5" strokeLinecap="round" />
          <path d="M64 -9 L58 9" stroke="#b07a44" strokeWidth="3" />
        </g>
        <path d="M98 128 Q118 130 120 112" fill="none" stroke="#1d1830" strokeWidth="18" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M98 128 Q118 130 120 112" fill="none" stroke="#5cb9f0" strokeWidth="9" strokeLinecap="round" strokeLinejoin="round" />
        <circle cx="121" cy="110" r="9.5" fill="#f6dcc4" stroke="#1d1830" strokeWidth="4" />
        <path d="M115 106 L126 106 M115 111 L126 111" stroke="#1d1830" strokeWidth="1.8" strokeLinecap="round" />
      </>
    ),
  },
  ready: {
    before: (
      <>
        <path d="M64 170 L56 198" fill="none" stroke="#1d1830" strokeWidth="20" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M64 170 L56 198" fill="none" stroke="#2b2150" strokeWidth="11" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M86 170 L92 198" fill="none" stroke="#1d1830" strokeWidth="20" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M86 170 L92 198" fill="none" stroke="#2b2150" strokeWidth="11" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M40 210 Q40 198 54 198 L66 200 Q74 204 72 210 Z" fill="#ef4f43" stroke="#1d1830" strokeWidth="4" strokeLinejoin="round" />
        <path d="M108 210 Q108 198 94 198 L82 200 Q74 204 76 210 Z" fill="#ef4f43" stroke="#1d1830" strokeWidth="4" strokeLinejoin="round" />
        <path d="M47 124 Q48 109 75 105 Q102 109 103 124 L104 172 L46 172 Z" fill="#5cb9f0" stroke="#1d1830" strokeWidth="5" strokeLinejoin="round" />
        <path d="M88 128 L102 128 L104 172 L92 172 Z" fill="#2f86c9" />
        <path d="M46 158 L104 158" stroke="#3f3170" strokeWidth="6" />
        <rect x="70" y="155" width="12" height="7" rx="2" fill="#ffc83d" stroke="#1d1830" strokeWidth="2.5" />
        <g transform="translate(66 96) rotate(-150)">
          <rect x="-10" y="-6" width="24" height="12" rx="4" fill="#c9d4e4" stroke="#1d1830" strokeWidth="4" />
          <path d="M-4 -6 L-4 6 M4 -6 L4 6" stroke="#9aa6b8" strokeWidth="2.5" />
          <rect x="14" y="-14" width="10" height="28" rx="3" fill="#a96d36" stroke="#1d1830" strokeWidth="4" />
          <path d="M24 -9 L90 -9 Q104 -9 108 0 Q104 9 90 9 L24 9 Z" fill="#d9a066" stroke="#1d1830" strokeWidth="4.5" strokeLinejoin="round" />
          <path d="M32 -3 L84 -3 M32 3 L80 3" stroke="#b07a44" strokeWidth="2.5" strokeLinecap="round" />
          <path d="M64 -9 L58 9" stroke="#b07a44" strokeWidth="3" />
        </g>
        <path d="M98 132 Q84 104 66 96" fill="none" stroke="#1d1830" strokeWidth="18" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M98 132 Q84 104 66 96" fill="none" stroke="#5cb9f0" strokeWidth="9" strokeLinecap="round" strokeLinejoin="round" />
        <circle cx="66" cy="96" r="9" fill="#f6dcc4" stroke="#1d1830" strokeWidth="4" />
        <path d="M52 132 Q60 146 76 150" fill="none" stroke="#1d1830" strokeWidth="18" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M52 132 Q60 146 76 150" fill="none" stroke="#5cb9f0" strokeWidth="9" strokeLinecap="round" strokeLinejoin="round" />
        <circle cx="76" cy="150" r="9" fill="#f6dcc4" stroke="#1d1830" strokeWidth="4" />
      </>
    ),
    after: (
      <>

      </>
    ),
  },
  strike: {
    before: (
      <>
        <path d="M64 170 L42 196" fill="none" stroke="#1d1830" strokeWidth="20" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M64 170 L42 196" fill="none" stroke="#2b2150" strokeWidth="11" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M86 170 L114 194" fill="none" stroke="#1d1830" strokeWidth="20" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M86 170 L114 194" fill="none" stroke="#2b2150" strokeWidth="11" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M24 208 Q24 196 38 196 L50 198 Q58 202 56 208 Z" fill="#ef4f43" stroke="#1d1830" strokeWidth="4" strokeLinejoin="round" />
        <path d="M132 206 Q132 194 118 194 L106 196 Q98 200 100 206 Z" fill="#ef4f43" stroke="#1d1830" strokeWidth="4" strokeLinejoin="round" />
        <path d="M52 132 Q36 140 26 132" fill="none" stroke="#1d1830" strokeWidth="18" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M52 132 Q36 140 26 132" fill="none" stroke="#5cb9f0" strokeWidth="9" strokeLinecap="round" strokeLinejoin="round" />
        <circle cx="26" cy="130" r="9" fill="#f6dcc4" stroke="#1d1830" strokeWidth="4" />
        <path d="M47 124 Q48 109 75 105 Q102 109 103 124 L104 172 L46 172 Z" fill="#5cb9f0" stroke="#1d1830" strokeWidth="5" strokeLinejoin="round" />
        <path d="M88 128 L102 128 L104 172 L92 172 Z" fill="#2f86c9" />
        <path d="M46 158 L104 158" stroke="#3f3170" strokeWidth="6" />
        <rect x="70" y="155" width="12" height="7" rx="2" fill="#ffc83d" stroke="#1d1830" strokeWidth="2.5" />
        <g transform="translate(150 140) rotate(4)">
          <rect x="-10" y="-6" width="24" height="12" rx="4" fill="#c9d4e4" stroke="#1d1830" strokeWidth="4" />
          <path d="M-4 -6 L-4 6 M4 -6 L4 6" stroke="#9aa6b8" strokeWidth="2.5" />
          <rect x="14" y="-14" width="10" height="28" rx="3" fill="#a96d36" stroke="#1d1830" strokeWidth="4" />
          <path d="M24 -9 L92 -9 Q106 -9 110 0 Q106 9 92 9 L24 9 Z" fill="#d9a066" stroke="#1d1830" strokeWidth="4.5" strokeLinejoin="round" />
          <path d="M32 -3 L86 -3 M32 3 L82 3" stroke="#b07a44" strokeWidth="2.5" strokeLinecap="round" />
          <path d="M66 -9 L60 9" stroke="#b07a44" strokeWidth="3" />
        </g>
        <path d="M98 132 Q128 136 150 140" fill="none" stroke="#1d1830" strokeWidth="18" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M98 132 Q128 136 150 140" fill="none" stroke="#5cb9f0" strokeWidth="9" strokeLinecap="round" strokeLinejoin="round" />
        <circle cx="150" cy="140" r="9" fill="#f6dcc4" stroke="#1d1830" strokeWidth="4" />
      </>
    ),
    after: (
      <>

      </>
    ),
  },
  jump: {
    before: (
      <>
        <path d="M64 170 Q50 180 58 194" fill="none" stroke="#1d1830" strokeWidth="20" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M64 170 Q50 180 58 194" fill="none" stroke="#2b2150" strokeWidth="11" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M86 170 Q102 176 98 190" fill="none" stroke="#1d1830" strokeWidth="20" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M86 170 Q102 176 98 190" fill="none" stroke="#2b2150" strokeWidth="11" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M42 206 Q42 194 56 194 L68 196 Q76 200 74 206 Z" fill="#ef4f43" stroke="#1d1830" strokeWidth="4" strokeLinejoin="round" />
        <path d="M114 202 Q114 190 100 190 L88 192 Q80 196 82 202 Z" fill="#ef4f43" stroke="#1d1830" strokeWidth="4" strokeLinejoin="round" />
        <path d="M52 132 Q34 132 28 118" fill="none" stroke="#1d1830" strokeWidth="18" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M52 132 Q34 132 28 118" fill="none" stroke="#5cb9f0" strokeWidth="9" strokeLinecap="round" strokeLinejoin="round" />
        <circle cx="28" cy="114" r="9" fill="#f6dcc4" stroke="#1d1830" strokeWidth="4" />
        <path d="M47 124 Q48 109 75 105 Q102 109 103 124 L104 172 L46 172 Z" fill="#5cb9f0" stroke="#1d1830" strokeWidth="5" strokeLinejoin="round" />
        <path d="M88 128 L102 128 L104 172 L92 172 Z" fill="#2f86c9" />
        <path d="M46 158 L104 158" stroke="#3f3170" strokeWidth="6" />
        <rect x="70" y="155" width="12" height="7" rx="2" fill="#ffc83d" stroke="#1d1830" strokeWidth="2.5" />
        <g transform="translate(122 118) rotate(-75)">
          <rect x="-10" y="-6" width="24" height="12" rx="4" fill="#c9d4e4" stroke="#1d1830" strokeWidth="4" />
          <path d="M-4 -6 L-4 6 M4 -6 L4 6" stroke="#9aa6b8" strokeWidth="2.5" />
          <rect x="14" y="-14" width="10" height="28" rx="3" fill="#a96d36" stroke="#1d1830" strokeWidth="4" />
          <path d="M24 -9 L86 -9 Q100 -9 104 0 Q100 9 86 9 L24 9 Z" fill="#d9a066" stroke="#1d1830" strokeWidth="4.5" strokeLinejoin="round" />
          <path d="M32 -3 L80 -3 M32 3 L76 3" stroke="#b07a44" strokeWidth="2.5" strokeLinecap="round" />
          <path d="M60 -9 L54 9" stroke="#b07a44" strokeWidth="3" />
        </g>
        <path d="M98 132 Q118 128 122 118" fill="none" stroke="#1d1830" strokeWidth="18" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M98 132 Q118 128 122 118" fill="none" stroke="#5cb9f0" strokeWidth="9" strokeLinecap="round" strokeLinejoin="round" />
        <circle cx="122" cy="118" r="9" fill="#f6dcc4" stroke="#1d1830" strokeWidth="4" />
      </>
    ),
    after: (
      <>

      </>
    ),
  },
  run: {
    before: (
      <>
        <path d="M66 170 L78 198" fill="none" stroke="#1d1830" strokeWidth="20" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M66 170 L78 198" fill="none" stroke="#2b2150" strokeWidth="11" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M84 170 L70 196" fill="none" stroke="#1d1830" strokeWidth="20" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M84 170 L70 196" fill="none" stroke="#2b2150" strokeWidth="11" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M62 210 Q62 198 76 198 L88 200 Q96 204 94 210 Z" fill="#ef4f43" stroke="#1d1830" strokeWidth="4" strokeLinejoin="round" />
        <path d="M86 208 Q86 196 72 196 L60 198 Q52 202 54 208 Z" fill="#ef4f43" stroke="#1d1830" strokeWidth="4" strokeLinejoin="round" />
        <path d="M52 132 Q36 142 30 156" fill="none" stroke="#1d1830" strokeWidth="18" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M52 132 Q36 142 30 156" fill="none" stroke="#5cb9f0" strokeWidth="9" strokeLinecap="round" strokeLinejoin="round" />
        <circle cx="30" cy="158" r="9" fill="#f6dcc4" stroke="#1d1830" strokeWidth="4" />
        <path d="M47 124 Q48 109 75 105 Q102 109 103 124 L104 172 L46 172 Z" fill="#5cb9f0" stroke="#1d1830" strokeWidth="5" strokeLinejoin="round" />
        <path d="M88 128 L102 128 L104 172 L92 172 Z" fill="#2f86c9" />
        <path d="M46 158 L104 158" stroke="#3f3170" strokeWidth="6" />
        <rect x="70" y="155" width="12" height="7" rx="2" fill="#ffc83d" stroke="#1d1830" strokeWidth="2.5" />
        <g transform="translate(108 150) rotate(-48)">
          <rect x="-10" y="-6" width="24" height="12" rx="4" fill="#c9d4e4" stroke="#1d1830" strokeWidth="4" />
          <path d="M-4 -6 L-4 6 M4 -6 L4 6" stroke="#9aa6b8" strokeWidth="2.5" />
          <rect x="14" y="-14" width="10" height="28" rx="3" fill="#a96d36" stroke="#1d1830" strokeWidth="4" />
          <path d="M24 -9 L86 -9 Q100 -9 104 0 Q100 9 86 9 L24 9 Z" fill="#d9a066" stroke="#1d1830" strokeWidth="4.5" strokeLinejoin="round" />
          <path d="M32 -3 L80 -3 M32 3 L76 3" stroke="#b07a44" strokeWidth="2.5" strokeLinecap="round" />
          <path d="M60 -9 L54 9" stroke="#b07a44" strokeWidth="3" />
        </g>
        <path d="M98 132 Q106 144 108 150" fill="none" stroke="#1d1830" strokeWidth="18" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M98 132 Q106 144 108 150" fill="none" stroke="#5cb9f0" strokeWidth="9" strokeLinecap="round" strokeLinejoin="round" />
        <circle cx="108" cy="150" r="9" fill="#f6dcc4" stroke="#1d1830" strokeWidth="4" />
      </>
    ),
    after: (
      <>

      </>
    ),
  },
};

const REF = { w: 300, cx: 150, feet: 211, tall: 197 };

export function BrunoFigure({ pose, face, x, feet, h, flip = false }: { pose: BrunoPose; face: BrunoFace; x: number; feet: number; h: number; flip?: boolean }) {
  const s = h / REF.tall;
  const body = BODY[pose];
  return (
    <g transform={`translate(${x} ${feet}) scale(${flip ? -s : s} ${s}) translate(${-REF.cx} ${-REF.feet})`}>
      <g transform="translate(75 0)">
        {body.before}
        <Head face={face} />
        {body.after}
      </g>
    </g>
  );
}
