import { BrunoHead, DecoHead, LinaHead, MilaHead, type Face } from "@/components/characters/Heads";
import { P } from "@/lib/palette";

const ink = { stroke: P.ink, strokeWidth: 4, strokeLinejoin: "round" as const, strokeLinecap: "round" as const };

type HeadProps = { x: number; y: number; size: number; face?: Face; rotate?: number; flip?: boolean };

function Kid({ who, x, y, size, face = "happy", rotate = 0, flip = false }: HeadProps & { who: "lina" | "bruno" | "deco" | "mila" }) {
  const Head = { lina: LinaHead, bruno: BrunoHead, deco: DecoHead, mila: MilaHead }[who];
  const h = size * 1.11;
  return (
    <g transform={`rotate(${rotate} ${x + size / 2} ${y + h / 2})`}>
      <svg x={x} y={y} width={size} height={h} viewBox="0 0 200 222" overflow="visible">
        <g transform={flip ? "translate(200 0) scale(-1 1)" : undefined}>
          <Head face={face} />
        </g>
      </svg>
    </g>
  );
}

function Burst({ cx, cy, color, count = 16, r = 360 }: { cx: number; cy: number; color: string; count?: number; r?: number }) {
  return (
    <g>
      {Array.from({ length: count }, (_, i) => {
        const a = (i / count) * Math.PI * 2;
        const b = a + Math.PI / count;
        return (
          <path
            key={i}
            d={`M${cx} ${cy} L${(cx + Math.cos(a) * r).toFixed(1)} ${(cy + Math.sin(a) * r).toFixed(1)} L${(cx + Math.cos(b) * r).toFixed(1)} ${(cy + Math.sin(b) * r).toFixed(1)} Z`}
            fill={color}
          />
        );
      })}
    </g>
  );
}

function Frame({ children, bg, label, decorative }: { children: React.ReactNode; bg: string; label: string; decorative?: boolean }) {
  return (
    <svg
      viewBox="0 0 320 240"
      className="block h-full w-full"
      role={decorative ? undefined : "img"}
      aria-label={decorative ? undefined : label}
      aria-hidden={decorative ? true : undefined}
      preserveAspectRatio="xMidYMid slice"
    >
      <rect width="320" height="240" fill={bg} />
      {children}
    </svg>
  );
}

export function RuaCover({ decorative }: { decorative?: boolean }) {
  return (
    <Frame decorative={decorative} bg="#82d3f7" label="Capa de Rua Sem Saída: Déco e Lina numa engenhoca de carrinho lançando um tênis">
      <circle cx="270" cy="44" r="24" fill={P.sun} {...ink} />
      <path d="M30 60 Q28 44 46 44 Q52 30 68 36 Q80 26 92 40 Q108 40 104 58 Z" fill={P.white} {...ink} strokeWidth={3} />
      <path d="M0 150 L36 112 L72 150 L72 120 L110 92 L148 120 L148 150 L196 118 L236 150 L274 110 L320 140 L320 170 L0 170 Z" fill="#c9a6e8" {...ink} strokeWidth={3} />
      <rect x="88" y="122" width="14" height="14" fill={P.sun} {...ink} strokeWidth={2.5} />
      <rect x="262" y="130" width="14" height="14" fill={P.sun} {...ink} strokeWidth={2.5} />
      <rect y="168" width="320" height="72" fill={P.lime} />
      {Array.from({ length: 15 }, (_, i) => i * 24 - 6).map((x) => (
        <path key={x} d={`M${x} 196 L${x} 150 L${x + 10} 142 L${x + 20} 150 L${x + 20} 196 Z`} fill={P.tangerine} stroke={P.ink} strokeWidth="2.5" strokeLinejoin="round" />
      ))}
      <path d="M0 162 L320 162 M0 184 L320 184" stroke={P.ink} strokeWidth="3" />
      <rect y="196" width="320" height="44" fill="#d8a066" />
      <path d="M0 196 L320 196" stroke={P.ink} strokeWidth="3" />
      <path d="M180 90 Q230 30 290 70" fill="none" stroke={P.tangerineDeep} strokeWidth="3" strokeDasharray="6 7" />
      <g transform="translate(276 58) rotate(28)">
        <path d="M-18 0 Q-16 -12 -4 -12 L4 -12 Q8 -4 18 -4 Q28 -2 26 8 L-18 8 Z" fill={P.tomato} {...ink} strokeWidth={3} />
        <path d="M-16 8 L26 8" stroke={P.white} strokeWidth="3" />
      </g>
      <path d="M248 74 L234 80 M252 84 L238 92 M244 64 L232 66" stroke={P.ink} strokeWidth="3" strokeLinecap="round" />
      <g>
        <path d="M60 186 L196 186 L188 222 L66 222 Z" fill={P.tomato} {...ink} />
        <path d="M70 196 L184 196" stroke={P.tomatoDeep} strokeWidth="5" />
        <circle cx="86" cy="226" r="14" fill={P.ink} />
        <circle cx="86" cy="226" r="5" fill={P.steel} />
        <circle cx="172" cy="226" r="14" fill={P.ink} />
        <circle cx="172" cy="226" r="5" fill={P.steel} />
        <path d="M150 188 L196 96" stroke={P.ink} strokeWidth="12" strokeLinecap="round" />
        <path d="M150 188 L196 96" stroke={P.wood} strokeWidth="6" strokeLinecap="round" />
        <ellipse cx="198" cy="92" rx="18" ry="10" fill={P.wood} {...ink} strokeWidth={3} transform="rotate(-30 198 92)" />
      </g>
      <Kid who="deco" x={50} y={92} size={92} face="happy" rotate={-8} />
      <Kid who="lina" x={110} y={110} size={80} face="wow" rotate={6} />
    </Frame>
  );
}

export function LabCover({ decorative }: { decorative?: boolean }) {
  return (
    <Frame decorative={decorative} bg={P.plum700} label="Capa de Laboratório de Péssimas Ideias: Lina segurando um frasco borbulhante entre engrenagens">
      <Burst cx={160} cy={120} color={P.plum600} count={14} />
      <g fill={P.plum500} {...ink} strokeWidth={3}>
        <path d="M40 46 m-24 0 a24 24 0 1 0 48 0 a24 24 0 1 0 -48 0" />
        <path d="M274 190 m-30 0 a30 30 0 1 0 60 0 a30 30 0 1 0 -60 0" />
      </g>
      <g fill="none" stroke={P.ink} strokeWidth="9" strokeDasharray="7 7">
        <circle cx="40" cy="46" r="28" />
        <circle cx="274" cy="190" r="34" />
      </g>
      <circle cx="40" cy="46" r="8" fill={P.sun} {...ink} strokeWidth={3} />
      <circle cx="274" cy="190" r="10" fill={P.sun} {...ink} strokeWidth={3} />
      <rect x="0" y="200" width="320" height="40" fill={P.plum900} />
      <path d="M0 200 L320 200" stroke={P.ink} strokeWidth="3" />
      <g>
        <path d="M222 120 L222 80 L242 80 L242 120 L262 186 Q264 200 248 200 L216 200 Q200 200 202 186 Z" fill={P.lime} {...ink} />
        <path d="M206 170 L258 170 L262 186 Q264 200 248 200 L216 200 Q200 200 202 186 Z" fill={P.limeDeep} />
        <path d="M222 120 L222 80 L242 80 L242 120 L262 186 Q264 200 248 200 L216 200 Q200 200 202 186 Z" fill="none" {...ink} />
        <circle cx="226" cy="150" r="6" fill={P.white} opacity="0.7" />
        <circle cx="240" cy="132" r="4" fill={P.white} opacity="0.7" />
        <path d="M232 76 Q214 54 236 40 Q260 26 244 8" fill="none" stroke={P.lime} strokeWidth="10" strokeLinecap="round" />
        <path d="M232 76 Q214 54 236 40 Q260 26 244 8" fill="none" stroke={P.ink} strokeWidth="2" strokeLinecap="round" strokeDasharray="2 10" />
      </g>
      <path d="M280 60 L292 40 L286 58 L300 54 L284 80" fill={P.sun} {...ink} strokeWidth={3} />
      <path d="M24 130 L36 112 L32 128 L44 126 L30 148" fill={P.sun} {...ink} strokeWidth={3} />
      <Kid who="lina" x={64} y={44} size={150} face="wow" rotate={-4} />
    </Frame>
  );
}

export function LancheCover({ decorative }: { decorative?: boolean }) {
  return (
    <Frame decorative={decorative} bg={P.tangerine} label="Capa de Guerra de Lanche: Déco gritando enquanto comida voa pela cantina">
      <Burst cx={170} cy={110} color={P.sun} count={18} />
      <circle cx="170" cy="110" r="54" fill={P.tomato} opacity="0.5" />
      <g transform="translate(46 58) rotate(-20)">
        <path d="M-26 6 Q-28 -16 0 -18 Q28 -16 26 6 Z" fill={P.sunPale} {...ink} />
        <path d="M-26 6 L26 6 L24 12 L-24 12 Z" fill={P.lime} {...ink} strokeWidth={3} />
        <path d="M-24 12 L24 12 L22 22 L-22 22 Z" fill={P.tomato} {...ink} strokeWidth={3} />
        <path d="M-22 22 Q0 30 22 22" fill={P.sunPale} {...ink} strokeWidth={3} />
      </g>
      <g transform="translate(270 54) rotate(30)">
        <path d="M-30 6 Q-10 -18 26 -8 Q10 6 -30 10 Z" fill={P.sun} {...ink} />
        <path d="M26 -8 L32 -14" stroke={P.woodDeep} strokeWidth="5" strokeLinecap="round" />
      </g>
      <g transform="translate(270 180) rotate(-14)">
        <rect x="-18" y="-24" width="36" height="48" rx="3" fill={P.sky} {...ink} />
        <path d="M-10 -24 L-6 -40 L4 -42" fill="none" stroke={P.tomato} strokeWidth="4" strokeLinecap="round" />
        <circle cx="0" cy="4" r="10" fill={P.tangerine} stroke={P.ink} strokeWidth="2.5" />
      </g>
      <g transform="translate(46 190)">
        <path d="M-24 10 L-18 -14 Q0 -24 18 -14 L24 10 Z" fill="#c98a5e" {...ink} />
        <path d="M-18 -14 Q0 -30 18 -14 Q10 -6 0 -10 Q-10 -6 -18 -14 Z" fill={P.bubblegum} {...ink} strokeWidth={3} />
      </g>
      {[
        [96, 40],
        [236, 112],
        [120, 200],
        [210, 26],
      ].map(([x, y]) => (
        <circle key={`${x}${y}`} cx={x} cy={y} r="7" fill={P.plum500} {...ink} strokeWidth={3} />
      ))}
      <path d="M70 50 L90 44 M66 62 L86 62 M250 70 L236 78 M254 82 L240 92" stroke={P.ink} strokeWidth="3" strokeLinecap="round" />
      <Kid who="deco" x={92} y={44} size={150} face="wow" rotate={6} />
    </Frame>
  );
}

export function CasaCover({ decorative }: { decorative?: boolean }) {
  return (
    <Frame decorative={decorative} bg={P.plum800} label="Capa de Casa Estranha: uma casa torta à noite com janelas acesas e uma cadeira flutuando">
      {[
        [30, 30],
        [80, 64],
        [290, 24],
        [230, 70],
        [140, 18],
        [20, 120],
        [300, 120],
      ].map(([x, y]) => (
        <circle key={`${x}${y}`} cx={x} cy={y} r="2.4" fill={P.sunPale} />
      ))}
      <circle cx="262" cy="56" r="28" fill={P.sunPale} {...ink} />
      <circle cx="252" cy="48" r="6" fill="#e8d28a" />
      <circle cx="270" cy="66" r="4" fill="#e8d28a" />
      <path d="M0 210 Q80 196 160 206 Q240 214 320 200 L320 240 L0 240 Z" fill={P.plum950} />
      <g>
        <path d="M96 210 L104 116 L82 118 L160 50 L234 112 L214 116 L224 210 Z" fill={P.plum600} {...ink} />
        <path d="M200 120 L206 210 L224 210 L214 116 Z" fill={P.plum700} />
        <path d="M196 84 L202 56 L218 58 L216 98" fill={P.plum600} {...ink} />
        <path d="M150 72 L170 72 L170 96 L150 96 Z" fill={P.sun} {...ink} strokeWidth={3} transform="rotate(8 160 84)" />
        <rect x="118" y="130" width="30" height="34" fill={P.sun} {...ink} transform="rotate(-8 133 147)" />
        <rect x="176" y="136" width="26" height="30" fill={P.sun} {...ink} transform="rotate(10 189 151)" />
        <path d="M134 130 L134 164 M118 146 L148 146" stroke={P.ink} strokeWidth="3" transform="rotate(-8 133 147)" />
        <path d="M150 210 L150 176 Q160 166 170 176 L170 210 Z" fill={P.ink} />
        <circle cx="128" cy="140" r="4" fill={P.ink} />
        <circle cx="138" cy="140" r="4" fill={P.ink} />
      </g>
      <g transform="translate(260 150) rotate(150)">
        <rect x="-18" y="-4" width="36" height="8" fill={P.wood} {...ink} strokeWidth={3} />
        <path d="M-15 4 L-15 24 M15 4 L15 24 M-15 -4 L-15 -26 L15 -26 L15 -4" stroke={P.ink} strokeWidth="4" fill="none" />
      </g>
      <g transform="translate(62 96) rotate(-24)">
        <path d="M-18 -12 L0 -6 L18 -12 L18 12 L0 18 L-18 12 Z" fill={P.mint} {...ink} strokeWidth={3} />
        <path d="M0 -6 L0 18" stroke={P.ink} strokeWidth="3" />
      </g>
      <Kid who="mila" x={8} y={150} size={84} face="normal" rotate={-6} />
    </Frame>
  );
}

export function RecreioCover({ decorative }: { decorative?: boolean }) {
  return (
    <Frame decorative={decorative} bg={P.sky} label="Capa de Operação: Recreio: Bruno com walkie-talkie e o plano da missão no pátio da escola">
      <rect x="0" y="0" width="320" height="240" fill={P.skyPale} opacity="0.4" />
      <path d="M0 150 L320 150 L320 240 L0 240 Z" fill="#9fd36a" />
      <path d="M0 150 L320 150" stroke={P.ink} strokeWidth="3" />
      <path d="M180 150 L180 70 L310 70 L310 150 Z" fill={P.cream2} {...ink} />
      <path d="M170 74 L245 30 L320 74 Z" fill={P.tomato} {...ink} />
      <circle cx="262" cy="34" r="12" fill={P.white} {...ink} strokeWidth={3} />
      <path d="M254 30 Q262 26 270 30 M252 38 Q262 42 272 38" stroke={P.ink} strokeWidth="2" fill="none" />
      <rect x="200" y="92" width="28" height="26" fill={P.sky} {...ink} strokeWidth={3} />
      <rect x="260" y="92" width="28" height="26" fill={P.sky} {...ink} strokeWidth={3} />
      <g transform="rotate(-8 80 70)">
        <rect x="20" y="20" width="120" height="96" fill={P.paper} {...ink} />
        <path d="M34 92 Q60 50 90 70 T126 40" fill="none" stroke={P.tomato} strokeWidth="3" strokeDasharray="5 5" />
        <path d="M120 34 L132 46 M132 34 L120 46" stroke={P.tomato} strokeWidth="4" strokeLinecap="round" />
        <circle cx="38" cy="92" r="5" fill={P.mint} {...ink} strokeWidth={2.5} />
        <text x="30" y="38" fontSize="12" fill={P.ink} style={{ fontFamily: "var(--font-patrick)" }}>
          PLANO #47
        </text>
      </g>
      <g transform="translate(150 30) rotate(-14)">
        <path d="M0 0 L40 10 L8 16 Z" fill={P.white} {...ink} strokeWidth={3} />
        <path d="M8 16 L12 26 L18 13" fill={P.cream2} {...ink} strokeWidth={3} />
      </g>
      <path d="M128 40 L140 36 M128 50 L142 50" stroke={P.ink} strokeWidth="2.5" strokeLinecap="round" />
      <Kid who="bruno" x={96} y={90} size={128} face="normal" rotate={-4} />
      <g transform="translate(212 196) rotate(14)">
        <rect x="-14" y="-26" width="28" height="46" rx="5" fill={P.inkSoft} {...ink} />
        <path d="M8 -26 L8 -44" stroke={P.ink} strokeWidth="5" strokeLinecap="round" />
        <circle cx="0" cy="-12" r="6" fill={P.lime} stroke={P.ink} strokeWidth="2.5" />
        <path d="M-8 4 L8 4 M-8 10 L8 10" stroke={P.steel} strokeWidth="3" />
      </g>
      <g transform="translate(160 158) rotate(-4)">
        <path d="M-32 -6 Q-30 -16 -16 -14 L-4 -10 L4 -10 L16 -14 Q30 -16 32 -6 Q30 4 16 2 L6 -2 L-6 -2 L-16 2 Q-30 4 -32 -6 Z" fill={P.ink} />
        <path d="M-24 -10 L-12 -10" stroke={P.white} strokeWidth="2.5" strokeLinecap="round" />
      </g>
    </Frame>
  );
}

export const COVERS: Record<string, (props: { decorative?: boolean }) => React.JSX.Element> = {
  "rua-sem-saida": RuaCover,
  "laboratorio-de-pessimas-ideias": LabCover,
  "guerra-de-lanche": LancheCover,
  "casa-estranha": CasaCover,
  "operacao-recreio": RecreioCover,
};

export function GameCover({ slug, decorative }: { slug: string; decorative?: boolean }) {
  const Cover = COVERS[slug];
  return Cover ? <Cover decorative={decorative} /> : null;
}
