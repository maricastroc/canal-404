import { BrunoHead, DecoHead, LinaHead, MilaHead, type Face } from "@/components/characters/Heads";
import { P } from "@/lib/palette";
import { arcPoint, Fork, House, Sparkle4 } from "./DeadEndStreetArt";
import { OffAirVacationCoverArt } from "./OffAirVacationArt";
import { PajamaWarCoverArt } from "./PajamaWarArt";

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

const ARC = { from: { x: 200, y: 118 }, via: { x: 246, y: 0 }, to: { x: 286, y: 112 } };

const arcAt = (t: number) => arcPoint(ARC.from, ARC.via, ARC.to, t);

function Pot({ cx, bottom, w, h, fill, rim }: { cx: number; bottom: number; w: number; h: number; fill: string; rim: string }) {
  const top = bottom - h;
  const lip = h * 0.32;
  return (
    <g stroke={P.ink} strokeWidth={3} strokeLinejoin="round">
      <path d={`M${cx - w / 2 + 3} ${top + lip} L${cx + w / 2 - 3} ${top + lip} L${cx + w / 2 - 6} ${bottom} L${cx - w / 2 + 6} ${bottom} Z`} fill={fill} />
      <path d={`M${cx + w / 2 - 9} ${top + lip} L${cx + w / 2 - 3} ${top + lip} L${cx + w / 2 - 6} ${bottom} L${cx + w / 2 - 12} ${bottom} Z`} fill={P.ink} opacity={0.18} stroke="none" />
      <rect x={cx - w / 2} y={top} width={w} height={lip} rx={3} fill={rim} />
    </g>
  );
}

export function DeadEndStreetCover({ decorative }: { decorative?: boolean }) {
  const dots = [0.1, 0.2, 0.3, 0.4, 0.62, 0.72, 0.82, 0.92].map((t) => ({ t, ...arcAt(t) }));
  const shoe = arcAt(0.51);
  return (
    <Frame decorative={decorative} bg="#82d3f7" label="Capa de Rua Sem Saída: Déco e Lina num carrinho com uma colher gigante lançando um tênis em direção a uma pilha de vasos com um gnomo">
      <rect y="96" width="320" height="70" fill={P.skyPale} opacity={0.55} />
      <g>
        {Array.from({ length: 10 }, (_, i) => {
          const a = (i / 10) * Math.PI * 2;
          const f = (n: number) => n.toFixed(1);
          return <path key={i} d={`M${f(46 + Math.cos(a) * 28)} ${f(40 + Math.sin(a) * 28)} L${f(46 + Math.cos(a) * 36)} ${f(40 + Math.sin(a) * 36)}`} stroke={P.sunDeep} strokeWidth={4} strokeLinecap="round" />;
        })}
        <circle cx="46" cy="40" r="20" fill={P.sun} {...ink} />
        <path d="M34 48 Q46 58 58 46" fill="none" stroke={P.sunDeep} strokeWidth={4} strokeLinecap="round" />
      </g>
      <g transform="translate(112 -8)">
        <path d="M30 60 Q28 44 46 44 Q52 30 68 36 Q80 26 92 40 Q108 40 104 58 Z" fill={P.white} {...ink} strokeWidth={3} />
        <path d="M36 58 Q60 52 98 56" fill="none" stroke={P.skyPale} strokeWidth={4} strokeLinecap="round" />
      </g>
      <g transform="translate(-6 66) scale(0.6)">
        <path d="M30 60 Q28 44 46 44 Q52 30 68 36 Q80 26 92 40 Q108 40 104 58 Z" fill={P.white} {...ink} strokeWidth={4.5} />
      </g>
      <House x={184} w={54} h={34} peak={26} wall={P.sunPale} roof={P.skyDeep} />
      <House x={250} w={66} h={42} peak={32} wall={P.plum300} roof={P.tomatoDeep} />
      <g>
        {Array.from({ length: 17 }, (_, i) => i * 20 - 6).map((x) => (
          <g key={x}>
            <path d={`M${x} 192 L${x} 158 L${x + 8} 149 L${x + 16} 158 L${x + 16} 192 Z`} fill={P.cream} stroke={P.ink} strokeWidth={3} strokeLinejoin="round" />
            <path d={`M${x + 9} 150 L${x + 16} 158 L${x + 16} 192 L${x + 9} 192 Z`} fill={P.cream2} />
            <path d={`M${x + 16} 158 L${x + 16} 192`} stroke={P.ink} strokeWidth={3} strokeLinecap="round" />
          </g>
        ))}
        <path d="M-4 168 L324 168 L324 175 L-4 175 Z M-4 182 L324 182 L324 189 L-4 189 Z" fill={P.wood} stroke={P.ink} strokeWidth={3} strokeLinejoin="round" />
        <path d="M-4 173 L324 173 M-4 187 L324 187" stroke={P.woodDeep} strokeWidth={2} />
      </g>
      <rect y="192" width="320" height="14" fill={P.lime} />
      <path d="M0 192 L320 192" stroke={P.ink} strokeWidth={3} />
      <rect y="192" width="320" height="5" fill={P.ink} opacity={0.14} />
      <path d="M0 206 L320 206" stroke={P.ink} strokeWidth={3} />
      <rect y="206" width="320" height="34" fill="#d8a066" />
      <path d="M20 224 L40 224 M120 232 L146 232 M230 222 L256 222 M280 234 L304 234" stroke="#b97f45" strokeWidth={3} strokeLinecap="round" />
      <g stroke={P.leafDeep} strokeWidth={3} strokeLinecap="round" fill="none">
        <path d="M8 204 L6 197 M12 204 L14 196 M16 204 L20 198" />
        <path d="M232 204 L230 198 M236 204 L238 197 M240 204 L244 199" />
      </g>
      <ellipse cx="290" cy="203" rx="26" ry="5" fill={P.ink} opacity={0.22} />
      <Pot cx={290} bottom={202} w={38} h={19} fill={P.tangerineDeep} rim={P.tangerine} />
      <Pot cx={290} bottom={183} w={32} h={16} fill={P.sunDeep} rim={P.sun} />
      <Pot cx={290} bottom={167} w={26} h={14} fill={P.bubblegumDeep} rim={P.bubblegum} />
      <g stroke={P.ink} strokeWidth={3} strokeLinejoin="round" strokeLinecap="round">
        <path d="M281 142 Q282 160 290 162 Q298 160 299 142 Q290 150 281 142 Z" fill={P.white} />
        <ellipse cx="290" cy="140" rx="9" ry="6" fill={P.blush} />
        <circle cx="290" cy="142" r="3" fill={P.bubblegum} strokeWidth={2} />
        <path d="M280 136 L290 106 L300 136 Q290 140 280 136 Z" fill={P.tomato} />
        <path d="M290 106 L296 120" stroke={P.tomatoDeep} strokeWidth={3} />
      </g>
      <Sparkle4 x={304} y={112} r={7} fill={P.sunPale} />
      <Sparkle4 x={272} y={128} r={5} fill={P.white} />
      <g>
        {dots.map(({ t, x, y }) => {
          const r = 6.5 - t * 3;
          return (
            <g key={t}>
              <circle cx={x} cy={y} r={r + 2.5} fill={P.ink} opacity={0.9 - t * 0.35} />
              <circle cx={x} cy={y} r={r} fill={P.tangerine} />
            </g>
          );
        })}
      </g>
      <g transform={`translate(${shoe.x.toFixed(1)} ${shoe.y.toFixed(1)}) rotate(-14)`}>
        <path d="M-34 -6 L-24 -6 M-38 3 L-26 3 M-32 12 L-24 12" stroke={P.ink} strokeWidth={3} strokeLinecap="round" />
        <path d="M-17 -14 L-3 -14 L3 -4 Q13 -3 19 -1 Q24 1 23 7 L-17 7 Z" fill={P.tomato} {...ink} strokeWidth={3} />
        <path d="M-3 -14 L3 -4 L-6 -3 Z" fill={P.tomatoDeep} {...ink} strokeWidth={2} />
        <path d="M-17 -14 L-17 7" stroke={P.ink} strokeWidth={3} strokeLinecap="round" />
        <path d="M2 -6 L7 -9 M6 -3 L11 -6" stroke={P.white} strokeWidth={2.5} strokeLinecap="round" />
        <path d="M-19 7 L24 7 L24 12 L-19 12 Z" fill={P.white} {...ink} strokeWidth={3} />
      </g>
      <ellipse cx="114" cy="232" rx="108" ry="6" fill={P.ink} opacity={0.22} />
      <Kid who="deco" x={30} y={98} size={76} face="happy" rotate={-4} />
      <Kid who="lina" x={110} y={104} size={70} face="wow" rotate={4} />
      <g>
        <path d="M30 176 Q4 176 8 206" fill="none" stroke={P.ink} strokeWidth={10} strokeLinecap="round" />
        <path d="M30 176 Q4 176 8 206" fill="none" stroke={P.wood} strokeWidth={4.5} strokeLinecap="round" />
        <path d="M22 171 L208 171 L198 212 L32 212 Z" fill={P.tomato} {...ink} />
        <path d="M22 171 L208 171 L207 180 L23 180 Z" fill={P.tomatoDeep} {...ink} strokeWidth={3} />
        <path d="M30 198 L200 198" stroke={P.tomatoDeep} strokeWidth={4} strokeLinecap="round" />
        <path d="M34 187 L90 187" stroke={P.blush} strokeWidth={3.5} strokeLinecap="round" opacity={0.8} />
        <circle cx="62" cy="218" r="15" fill={P.ink} />
        <circle cx="62" cy="218" r="9" fill={P.steelDeep} />
        <circle cx="62" cy="218" r="4" fill={P.steel} />
        <circle cx="168" cy="218" r="15" fill={P.ink} />
        <circle cx="168" cy="218" r="9" fill={P.steelDeep} />
        <circle cx="168" cy="218" r="4" fill={P.steel} />
        <path d="M54 211 Q58 207 64 208" stroke={P.white} strokeWidth={2.5} strokeLinecap="round" fill="none" opacity={0.7} />
        <path d="M160 211 Q164 207 170 208" stroke={P.white} strokeWidth={2.5} strokeLinecap="round" fill="none" opacity={0.7} />
      </g>
      <Fork x={192} y={176} s={1.7} pouch={{ x: 2, y: -28 }} tension={0} />
      <Sparkle4 x={20} y={130} r={9} fill={P.sunPale} />
    </Frame>
  );
}

export function BadIdeasLabCover({ decorative }: { decorative?: boolean }) {
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

export function FoodFightCover({ decorative }: { decorative?: boolean }) {
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

export function StrangeHouseCover({ decorative }: { decorative?: boolean }) {
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

export function OperationRecessCover({ decorative }: { decorative?: boolean }) {
  return (
    <Frame decorative={decorative} bg="#f3e6c4" label="Capa de Operação: Recreio: Bruno ergue uma espada de papelão contra um monitor de apito no corredor da escola">
      <rect x="0" y="0" width="320" height="150" fill="#f3e6c4" />
      <g fill="#e8d8b0">
        <rect x="30" y="0" width="8" height="150" />
        <rect x="110" y="0" width="8" height="150" />
        <rect x="190" y="0" width="8" height="150" />
        <rect x="270" y="0" width="8" height="150" />
      </g>
      <rect x="0" y="118" width="320" height="52" fill={P.mint} />
      <path d="M0 118 L320 118" stroke={P.mintDeep} strokeWidth="5" />
      <rect x="0" y="170" width="320" height="70" fill="#e6dcc4" />
      {Array.from({ length: 16 }, (_, i) => (
        <rect key={i} x={(i % 8) * 40 + ((Math.floor(i / 8) % 2) * 20)} y={186 + Math.floor(i / 8) * 26} width="20" height="13" fill="#c9bfa6" />
      ))}
      <path d="M0 170 L320 170" stroke={P.ink} strokeWidth="3" />
      <g transform="translate(202 52)" {...ink}>
        <rect x="0" y="0" width="34" height="118" rx="3" fill={P.sky} />
        <rect x="34" y="0" width="34" height="118" rx="3" fill={P.sun} />
        <rect x="68" y="0" width="34" height="118" rx="3" fill={P.sky} />
        <path d="M8 14 L26 14 M8 20 L26 20 M42 14 L60 14 M42 20 L60 20 M76 14 L94 14 M76 20 L94 20" strokeWidth={2.5} />
      </g>
      <Burst cx={104} cy={120} color="#ffe39a" count={14} r={150} />
      <g transform="translate(26 22) rotate(-6)">
        <rect x="0" y="0" width="56" height="70" rx="3" fill={P.white} {...ink} strokeWidth={3} />
        <rect x="5" y="5" width="46" height="18" fill={P.tomato} />
        <text x="28" y="18" textAnchor="middle" fontSize="9" fill={P.white} style={{ fontFamily: "var(--font-luckiest)" }}>
          SILÊNCIO
        </text>
        <circle cx="28" cy="44" r="13" fill={P.sunPale} {...ink} strokeWidth={2.5} />
        <path d="M21 50 L35 50" stroke={P.ink} strokeWidth="3" />
      </g>
      <g transform="translate(236 70)">
        <path d="M-36 100 L-30 46 Q-28 34 -14 32 L14 32 Q28 34 30 46 L36 100 Z" fill="#3f5bd8" {...ink} />
        <path d="M-28 40 L-8 40 L-8 100 L-32 100 Z" fill={P.sun} {...ink} strokeWidth={3} />
        <path d="M8 40 L28 40 L32 100 L8 100 Z" fill={P.sun} {...ink} strokeWidth={3} />
        <path d="M-32 74 L-8 74 M8 74 L32 74" stroke={P.white} strokeWidth="5" />
        <ellipse cx="0" cy="6" rx="26" ry="28" fill="#f2c9a6" {...ink} />
        <path d="M-28 -6 Q-26 -32 0 -32 Q26 -32 28 -6 Z" fill={P.leaf} {...ink} />
        <path d="M-30 -8 L-58 -4 Q-60 2 -52 2 L-26 0 Z" fill={P.leafDeep} {...ink} strokeWidth={3} />
        <path d="M-18 -4 L-4 2 M18 -4 L4 2" stroke={P.ink} strokeWidth="5" strokeLinecap="round" />
        <circle cx="-9" cy="6" r="3.5" fill={P.ink} />
        <circle cx="9" cy="6" r="3.5" fill={P.ink} />
        <rect x="-30" y="16" width="22" height="11" rx="4" fill="#c9d4e4" {...ink} strokeWidth={3} />
        <circle cx="-26" cy="22" r="3" fill={P.ink} />
        <g fill="none" stroke={P.screenDeep} strokeWidth="4" strokeLinecap="round">
          <path d="M-42 12 Q-50 22 -42 32" />
          <path d="M-54 6 Q-66 22 -54 38" />
        </g>
      </g>
      <text x="236" y="16" textAnchor="middle" fontSize="40" fill={P.tomato} stroke={P.ink} strokeWidth="6" paintOrder="stroke" style={{ fontFamily: "var(--font-luckiest)" }} transform="translate(0 20)">
        !
      </text>
      <g transform="translate(112 134) rotate(-74)">
        <rect x="-6" y="-8" width="20" height="16" rx="4" fill="#c9d4e4" {...ink} strokeWidth={3} />
        <rect x="12" y="-14" width="8" height="28" rx="2" fill="#a96d36" {...ink} strokeWidth={3} />
        <path d="M20 -7 L104 -7 Q114 0 104 7 L20 7 Z" fill="#d9a066" {...ink} />
        <path d="M28 -2 L96 -2 M28 3 L90 3" stroke="#b07a44" strokeWidth="2" />
      </g>
      <Kid who="bruno" x={44} y={92} size={124} face="normal" rotate={-6} />
    </Frame>
  );
}

export function PajamaWarCover({ decorative }: { decorative?: boolean }) {
  return (
    <Frame decorative={decorative} bg="#5b3f9c" label="Capa de Guerra do Pijama: Lia, Nico e Bia numa guerra de travesseiros no quarto, com penas voando">
      <PajamaWarCoverArt />
    </Frame>
  );
}

export function OffAirVacationCover({ decorative }: { decorative?: boolean }) {
  return (
    <Frame decorative={decorative} bg="#5cb9f0" label="Capa de Férias Fora do Ar: Déco chega a um resort na praia com o Sr. Bigodes, a gaivota Marisa e uma antena do Canal 404">
      <OffAirVacationCoverArt />
    </Frame>
  );
}

export const COVERS: Record<string, (props: { decorative?: boolean }) => React.JSX.Element> = {
  "dead-end-street": DeadEndStreetCover,
  "bad-ideas-lab": BadIdeasLabCover,
  "food-fight": FoodFightCover,
  "pajama-war": PajamaWarCover,
  "operation-recess": OperationRecessCover,
  "off-air-vacation": OffAirVacationCover,
};

export function GameCover({ slug, decorative }: { slug: string; decorative?: boolean }) {
  const Cover = COVERS[slug];
  return Cover ? <Cover decorative={decorative} /> : null;
}
