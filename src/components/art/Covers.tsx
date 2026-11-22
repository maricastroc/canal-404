import dynamic from "next/dynamic";
import { BrunoHead, DecoHead, LinaHead, MilaHead, type Face } from "@/components/characters/Heads";
import { localized } from "@/i18n/copy";
import { DEFAULT_LOCALE, type Locale } from "@/i18n/locales";
import { P } from "@/lib/palette";
import { arcPoint, Fork, House, Sparkle4 } from "./DeadEndStreetArt";

const OffAirVacationCoverArt = dynamic(() => import("./OffAirVacationArt").then((m) => m.OffAirVacationCoverArt));
const OperationRecessCoverArt = dynamic(() => import("./OperationRecessArt").then((m) => m.OperationRecessCoverArt));
const PajamaWarCoverArt = dynamic(() => import("./PajamaWarArt").then((m) => m.PajamaWarCoverArt));
const PastBedtimeCoverArt = dynamic(() => import("./PastBedtimeArt").then((m) => m.PastBedtimeCoverArt));
const TalentShowCoverArt = dynamic(() => import("./TalentShowArt").then((m) => m.TalentShowCoverArt));
const DownhillDerbyCoverArt = dynamic(() => import("./DownhillDerbyArt").then((m) => m.DownhillDerbyCoverArt));

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

const COVER_ALT = localized({
  "pt-BR": {
    "dead-end-street": "Capa de Rua Sem Saída: Déco e Lina num carrinho com uma colher gigante lançando um tênis em direção a uma pilha de vasos com um gnomo",
    "bad-ideas-lab": "Capa de Laboratório de Péssimas Ideias: Lina atrás da bancada, com um frasco borbulhando, engrenagens e uma lâmpada acesa",
    "food-fight": "Capa de Guerra de Lanche: na cantina, Déco se prepara para arremessar um sanduíche enquanto a Mila se protege de um pudim com uma bandeja",
    "strange-house": "Capa de Casa Estranha: uma casa torta à noite com janelas acesas e uma cadeira flutuando",
    "operation-recess": "Capa de Operação: Recreio: no corredor da escola, Bruno ergue a espada de papelão contra um monitor que apita bloqueando o caminho para a diretoria",
    "pajama-war": "Capa de Guerra do Pijama: Lia, Nico e Bia numa guerra de travesseiros no quarto, com penas voando",
    "off-air-vacation": "Capa de Férias Fora do Ar: Déco chega ao Resort 404 com mala e mapa e encara o Sr. Bigodes, sério demais atrás do balcão da recepção, enquanto o relógio da fachada está parado às 4:04 e a TV ao lado só mostra chuvisco",
    "downhill-derby": "Capa de Ladeira Abaixo: Déco pula uma lombada no carrinho de madeira, na frente da Lina e seu ventilador, da Mila na banheira de guarda-chuva e do Bruno, preocupado, numa ladeira do bairro com a antena do Canal 404 no morro",
    "past-bedtime": "Capa de Madrugada: de madrugada, o Bruno passa na ponta dos pés pela sala escura, logo depois do facho da lanterna da Vó, rumo ao videocassete piscando 12:00, enquanto a Pipoca dorme e o Pixel vigia de cima da TV",
    "talent-show": "Capa de Ao Vivo no 404: no palco do Canal 404, sob o letreiro luminoso do 404, o Déco toca um balde virado debaixo do holofote, com a Lina no teclado, a Mila no gravador e o Bruno no chocalho, enquanto o júri levanta as placas de nota, uma delas com um 10, e a plateia assiste lá da frente",
  },
  en: {
    "dead-end-street": "Dead End Street cover: Déco and Lina in a cart with a giant spoon, launching a sneaker at a stack of flowerpots with a gnome",
    "bad-ideas-lab": "Bad Ideas Lab cover: Lina behind the workbench, with a bubbling flask, gears and a lit light bulb",
    "food-fight": "Food Fight cover: in the cafeteria, Déco gets ready to throw a sandwich while Mila blocks a pudding with a tray",
    "strange-house": "Strange House cover: a crooked house at night with lit windows and a floating chair",
    "operation-recess": "Operation: Recess cover: in the school hallway, Bruno raises his cardboard sword at a whistle-blowing hall monitor who blocks the way to the principal's office",
    "pajama-war": "Pajama War cover: Lia, Nico and Bia in a pillow war in the bedroom, with feathers flying",
    "off-air-vacation": "Off-Air Vacation cover: Déco arrives at Resort 404 with a suitcase and a map and faces Mr. Bigodes, far too serious behind the front desk, while the clock on the building is stuck at 4:04 and the TV next to it only shows static",
    "downhill-derby": "Downhill Derby cover: Déco jumps a speed bump in his wooden cart ahead of Lina and her fan, Mila in her bathtub with an umbrella and a worried Bruno, down a neighborhood hill with the Canal 404 antenna on the hilltop",
    "past-bedtime": "Past Bedtime cover: in the middle of the night, Bruno tiptoes across the dark living room just past the beam of Grandma's flashlight, heading for the VCR blinking 12:00, while Pipoca sleeps and Pixel keeps watch from on top of the TV",
    "talent-show": "Live on 404 cover: on the Canal 404 stage, under the lit 404 sign, Déco drums on an upside-down bucket in the spotlight, with Lina on keys, Mila on the tape recorder and Bruno on the shaker, while the jury raises their score paddles, one of them a 10, and the audience watches from the front",
  },
});

type CoverProps = { decorative?: boolean; locale?: Locale };

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

export function DeadEndStreetCover({ decorative, locale = DEFAULT_LOCALE }: CoverProps) {
  const dots = [0.1, 0.2, 0.3, 0.4, 0.62, 0.72, 0.82, 0.92].map((t) => ({ t, ...arcAt(t) }));
  const shoe = arcAt(0.51);
  return (
    <Frame decorative={decorative} bg="#82d3f7" label={COVER_ALT[locale]["dead-end-street"]}>
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

function Gear({ cx, cy, r, teeth, fill, spin = 0 }: { cx: number; cy: number; r: number; teeth: number; fill: string; spin?: number }) {
  const outer = r;
  const inner = r * 0.8;
  const pts: string[] = [];
  for (let i = 0; i < teeth; i += 1) {
    const a = ((i / teeth) * 360 + spin) * (Math.PI / 180);
    const step = (Math.PI * 2) / teeth;
    const at = (ang: number, rad: number) => `${(cx + Math.cos(ang) * rad).toFixed(1)} ${(cy + Math.sin(ang) * rad).toFixed(1)}`;
    pts.push(at(a - step * 0.3, inner), at(a - step * 0.18, outer), at(a + step * 0.18, outer), at(a + step * 0.3, inner));
  }
  return (
    <g>
      <path d={`M${pts.join(" L")} Z`} fill={fill} {...ink} strokeWidth={3} />
      <circle cx={cx} cy={cy} r={inner * 0.72} fill="none" stroke={P.plum700} strokeWidth={3} opacity={0.6} />
      <circle cx={cx} cy={cy} r={r * 0.3} fill={P.sun} {...ink} strokeWidth={3} />
      <circle cx={cx} cy={cy} r={r * 0.1} fill={P.ink} />
    </g>
  );
}

export function BadIdeasLabCover({ decorative, locale = DEFAULT_LOCALE }: CoverProps) {
  return (
    <Frame decorative={decorative} bg={P.plum700} label={COVER_ALT[locale]["bad-ideas-lab"]}>
      <Burst cx={160} cy={120} color={P.plum600} count={14} />
      <Gear cx={42} cy={52} r={30} teeth={10} fill={P.plum500} spin={8} />
      <Gear cx={86} cy={24} r={17} teeth={8} fill={P.plum300} spin={4} />
      <Gear cx={292} cy={186} r={32} teeth={10} fill={P.plum500} spin={12} />
      <g transform="translate(286 54) rotate(14)">
        <path d="M-27 -16 L-37 -21 M27 -16 L37 -21 M-24 4 L-35 8 M24 4 L35 8 M0 -38 L0 -48" stroke={P.tangerine} strokeWidth="4" strokeLinecap="round" />
        <path d="M0 -32 Q21 -32 21 -12 Q21 0 10 8 L10 16 L-10 16 L-10 8 Q-21 0 -21 -12 Q-21 -32 0 -32 Z" fill={P.sunPale} {...ink} strokeWidth={3.5} />
        <path d="M-12 -16 Q-12 -25 -4 -27" fill="none" stroke={P.white} strokeWidth="3" strokeLinecap="round" />
        <path d="M-5 -6 L0 -14 L5 -6" fill="none" {...ink} strokeWidth={2.6} />
        <rect x="-11" y="16" width="22" height="12" rx="3" fill={P.steel} {...ink} strokeWidth={3.5} />
        <path d="M-11 22 L11 22" stroke={P.ink} strokeWidth="2" />
      </g>
      <path d="M22 96 L42 92 L34 110 L50 108 L24 136 L30 116 L16 118 Z" fill={P.sun} {...ink} strokeWidth={3} />
      <g fill={P.lime} {...ink} strokeWidth={3}>
        <circle cx="238" cy="58" r="8" />
        <circle cx="226" cy="38" r="10" />
        <circle cx="242" cy="16" r="12" />
      </g>
      <g fill={P.white} opacity="0.75">
        <circle cx="235" cy="55" r="2.4" />
        <circle cx="222" cy="34" r="3" />
        <circle cx="238" cy="11" r="3.4" />
      </g>
      <Kid who="lina" x={64} y={44} size={150} face="wow" rotate={-4} />
      <g transform="translate(0 -2)">
        <path d="M222 120 L222 80 L242 80 L242 120 L262 186 Q264 200 248 200 L216 200 Q200 200 202 186 Z" fill={P.lime} {...ink} />
        <path d="M206 170 L258 170 L262 186 Q264 200 248 200 L216 200 Q200 200 202 186 Z" fill={P.limeDeep} />
        <path d="M222 120 L222 80 L242 80 L242 120 L262 186 Q264 200 248 200 L216 200 Q200 200 202 186 Z" fill="none" {...ink} />
        <rect x="218" y="74" width="28" height="8" rx="3" fill={P.lime} {...ink} strokeWidth={3} />
        <path d="M226 92 L226 118 Q218 146 212 168" fill="none" stroke={P.white} strokeWidth="4" strokeLinecap="round" opacity="0.55" />
        <circle cx="238" cy="150" r="6" fill={P.white} opacity="0.7" />
        <circle cx="246" cy="132" r="4" fill={P.white} opacity="0.7" />
        <circle cx="234" cy="104" r="3" fill={P.white} opacity="0.7" />
      </g>
      <rect x="0" y="204" width="320" height="36" fill={P.woodDeep} />
      <rect x="-4" y="197" width="328" height="11" rx="3" fill={P.wood} {...ink} strokeWidth={3.5} />
      <path d="M6 201 L314 201" stroke="#d99566" strokeWidth="2.5" strokeLinecap="round" />
      <path d="M0 208 L320 208" stroke={P.ink} strokeWidth="3" />
      <path d="M40 218 L40 240 M120 218 L120 240 M200 218 L200 240 M280 218 L280 240" stroke={P.woodDark} strokeWidth="3" />
      <g transform="translate(38 184) rotate(18)">
        <rect x="-30" y="-5" width="60" height="10" rx="4" fill={P.sun} {...ink} strokeWidth={3} />
        <path d="M-24 -2 L24 -2" stroke="#fff3c4" strokeWidth="2" strokeLinecap="round" />
        <path d="M-14 -4 L-18 4 M-4 -4 L-8 4 M6 -4 L2 4 M16 -4 L12 4" stroke="#e0a21f" strokeWidth="2.5" strokeLinecap="round" />
        <circle cx="-24" cy="0" r="2" fill={P.steel} {...ink} strokeWidth={1.5} />
        <circle cx="24" cy="0" r="2" fill={P.steel} {...ink} strokeWidth={1.5} />
      </g>
      <g transform="translate(25 165)">
        <circle r="9" fill="#8fd4f7" {...ink} strokeWidth={3} />
        <path d="M-5.6 1.8 Q-2.8 -4.6 3.6 -2.8 Q0 0 1.8 5.6 Q-3.6 5.6 -5.6 1.8 Z" fill={P.bubblegum} />
        <circle cx="-3.6" cy="-4" r="2" fill={P.white} />
      </g>
      <path d="M10 153 L5 148 M18 150 L16 143" stroke={P.ink} strokeWidth="2.5" strokeLinecap="round" />
    </Frame>
  );
}

function Arm({ from, to, bend, sleeve, skin, w = 13 }: { from: { x: number; y: number }; to: { x: number; y: number }; bend: number; sleeve: string; skin: string; w?: number }) {
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  const len = Math.sqrt(dx * dx + dy * dy);
  const via = { x: Math.round(((from.x + to.x) / 2 - (dy / len) * bend) * 10) / 10, y: Math.round(((from.y + to.y) / 2 + (dx / len) * bend) * 10) / 10 };
  const d = `M${from.x} ${from.y} Q${via.x} ${via.y} ${to.x} ${to.y}`;
  const cuff = { x: Math.round((0.5 * from.x + 0.5 * via.x) * 10) / 10, y: Math.round((0.5 * from.y + 0.5 * via.y) * 10) / 10 };
  return (
    <g>
      <path d={d} fill="none" stroke={P.ink} strokeWidth={w + 7} strokeLinecap="round" />
      <path d={d} fill="none" stroke={skin} strokeWidth={w} strokeLinecap="round" />
      <path d={`M${from.x} ${from.y} L${cuff.x} ${cuff.y}`} fill="none" stroke={P.ink} strokeWidth={w + 11} strokeLinecap="round" />
      <path d={`M${from.x} ${from.y} L${cuff.x} ${cuff.y}`} fill="none" stroke={sleeve} strokeWidth={w + 4} strokeLinecap="round" />
    </g>
  );
}

function CoverSandwich({ x, y, s = 1, rotate = 0 }: { x: number; y: number; s?: number; rotate?: number }) {
  return (
    <g transform={`translate(${x} ${y}) rotate(${rotate}) scale(${s})`}>
      <path d="M-26 6 Q-28 -16 0 -18 Q28 -16 26 6 Z" fill={P.sunPale} {...ink} />
      <path d="M-12 -10 L-10 -12 M0 -12 L2 -14 M10 -9 L12 -11" stroke={P.cream3} strokeWidth="3" strokeLinecap="round" />
      <path d="M-27 6 Q-18 2 -10 7 Q0 2 8 7 Q18 2 27 6 L25 12 L-25 12 Z" fill={P.lime} {...ink} strokeWidth={3} />
      <path d="M-24 12 L24 12 L22 19 L-22 19 Z" fill={P.tomato} {...ink} strokeWidth={3} />
      <path d="M-22 19 Q0 28 22 19 L20 23 Q0 31 -20 23 Z" fill={P.sunPale} {...ink} strokeWidth={3} />
    </g>
  );
}

function Grapes({ x, y, rotate = 0 }: { x: number; y: number; rotate?: number }) {
  const g: [number, number][] = [[-7, -6], [7, -6], [0, 0], [-8, 7], [8, 7], [0, 13], [0, -12]];
  return (
    <g transform={`translate(${x} ${y}) rotate(${rotate})`}>
      <path d="M0 -18 Q2 -26 8 -28" fill="none" stroke={P.woodDeep} strokeWidth="4" strokeLinecap="round" />
      <path d="M2 -22 Q12 -28 14 -20 Q8 -16 2 -22 Z" fill={P.lime} {...ink} strokeWidth={2.5} />
      {g.map(([gx, gy]) => (
        <g key={`${gx}${gy}`}>
          <circle cx={gx} cy={gy} r="7" fill={P.plum500} {...ink} strokeWidth={3} />
          <circle cx={gx - 2.4} cy={gy - 2.4} r="1.8" fill={P.plum300} />
        </g>
      ))}
    </g>
  );
}

export function FoodFightCover({ decorative, locale = DEFAULT_LOCALE }: CoverProps) {
  const deco = { skin: P.skinTan, shirt: P.sun };
  const mila = { skin: "#f6dcc4", shirt: P.plum800 };
  const flags = [P.tomato, P.sun, P.mint, P.plum500, P.bubblegum, P.sky];
  return (
    <Frame decorative={decorative} bg={P.tangerine} label={COVER_ALT[locale]["food-fight"]}>
      <defs>
        <pattern id="ff-cover-cloth" width="20" height="20" patternUnits="userSpaceOnUse">
          <rect width="20" height="20" fill={P.white} />
          <rect width="10" height="10" fill={P.tomato} />
          <rect x="10" y="10" width="10" height="10" fill={P.tomato} />
        </pattern>
      </defs>
      <Burst cx={150} cy={118} color={P.sun} count={18} />
      <circle cx="150" cy="118" r="70" fill={P.sunPale} opacity="0.45" />
      <path d="M-4 10 Q80 30 160 18 Q240 6 324 22" fill="none" stroke={P.ink} strokeWidth="2.5" />
      {Array.from({ length: 11 }, (_, i) => {
        const x = 6 + i * 30;
        const t = x / 320;
        const y = Math.round((t < 0.5 ? 10 + 18 * Math.sin(t * Math.PI * 2) * 0.5 : 18 + 4 * Math.sin((t - 0.5) * Math.PI * 2)) * 10) / 10;
        return <path key={x} d={`M${x - 11} ${y} L${x + 11} ${y + 1} L${x} ${y + 20} Z`} fill={flags[i % flags.length]} {...ink} strokeWidth={2.5} />;
      })}
      <path d="M268 50 L244 52 M264 64 L240 62" stroke={P.ink} strokeWidth="3.5" strokeLinecap="round" />
      <Grapes x={212} y={46} rotate={-30} />
      <path d="M312 92 L290 96 M316 108 L294 106" stroke={P.ink} strokeWidth="3.5" strokeLinecap="round" />
      <g transform="translate(36 132) rotate(-18)">
        <path d="M-10 -10 Q-22 -4 -20 6 M-6 -16 Q-20 -14 -24 -6" fill="none" stroke={P.ink} strokeWidth="3" strokeLinecap="round" />
      </g>
      <Kid who="deco" x={64} y={40} size={150} face="normal" rotate={-4} />
      <Kid who="mila" x={198} y={104} size={98} face="wow" rotate={6} />
      <Arm from={{ x: 94, y: 192 }} to={{ x: 58, y: 70 }} bend={-16} sleeve={deco.shirt} skin={deco.skin} />
      <path d="M30 46 Q22 66 30 86 M18 54 Q12 70 18 84" fill="none" stroke={P.ink} strokeWidth="3.5" strokeLinecap="round" />
      <CoverSandwich x={52} y={52} s={0.95} rotate={-28} />
      <circle cx={58} cy={70} r={9} fill={deco.skin} {...ink} strokeWidth={3.5} />
      <g transform="translate(250 104) rotate(-14)">
        <rect x="-38" y="-20" width="76" height="40" rx="9" fill={P.steel} {...ink} strokeWidth={4} />
        <rect x="-31" y="-13" width="28" height="12" rx="4" fill={P.white} opacity="0.55" />
        <rect x="3" y="-13" width="28" height="12" rx="4" fill={P.white} opacity="0.55" />
        <rect x="-31" y="3" width="62" height="10" rx="4" fill={P.white} opacity="0.55" />
        <path d="M-22 6 Q-28 -4 -18 -10 Q-16 -20 -4 -18 Q4 -26 14 -18 Q26 -20 24 -8 Q32 -2 24 6 Q14 12 0 10 Q-12 12 -22 6 Z" fill={P.sunPale} {...ink} strokeWidth={3} />
        <path d="M14 -18 Q26 -20 24 -8 Q32 -2 24 6 Q20 8 16 8 Q24 -4 14 -18 Z" fill={P.sunDeep} opacity="0.6" />
        <path d="M-16 -10 Q-10 -18 -2 -14 Q6 -22 14 -16 Q22 -16 20 -9 Q12 -5 4 -9 Q-6 -4 -16 -10 Z" fill="#9a5426" {...ink} strokeWidth={2.5} />
        <path d="M-12 -8 Q-13 2 -9 8 Q-5 4 -7 -7 M12 -9 Q12 0 16 4 Q19 0 17 -9" fill="#9a5426" {...ink} strokeWidth={2} />
        <path d="M-6 -12 Q0 -15 6 -13" fill="none" stroke="#c97a3c" strokeWidth="2" strokeLinecap="round" />
        <circle cx="-34" cy="-14" r="3.4" fill={P.sunPale} {...ink} strokeWidth={2} />
        <circle cx="34" cy="-22" r="3" fill={P.sunPale} {...ink} strokeWidth={2} />
        <circle cx="-26" cy="-30" r="2.4" fill="#9a5426" {...ink} strokeWidth={1.6} />
        <path d="M28 -16 L38 -22 M-26 -16 L-36 -20" stroke={P.ink} strokeWidth="3" strokeLinecap="round" />
      </g>
      <circle cx={214} cy={124} r={8} fill={mila.skin} {...ink} strokeWidth={3.5} />
      <circle cx={286} cy={106} r={8} fill={mila.skin} {...ink} strokeWidth={3.5} />
      <path d="M302 132 Q312 140 306 152" fill="none" stroke={P.ink} strokeWidth="3" strokeLinecap="round" />
      <rect x="-6" y="194" width="332" height="50" fill="url(#ff-cover-cloth)" />
      <rect x="-6" y="194" width="332" height="10" fill={P.ink} opacity="0.18" />
      <rect x="-6" y="188" width="332" height="10" rx="3" fill="#e8b46a" {...ink} strokeWidth={4} />
      <path d="M4 191 L316 191" stroke={P.sunPale} strokeWidth="2.5" strokeLinecap="round" />
      <g transform="translate(184 189) rotate(10)">
        <rect x="-11" y="-30" width="22" height="30" rx="2.5" fill={P.sky} {...ink} strokeWidth={3.5} />
        <circle cx="0" cy="-14" r="6" fill={P.tangerine} stroke={P.ink} strokeWidth="2.5" />
        <path d="M-4 -30 L-2 -42 L6 -44" fill="none" stroke={P.tomato} strokeWidth="3.5" strokeLinecap="round" />
      </g>
      <g transform="translate(24 184)">
        <path d="M-12 4 Q-14 -10 0 -12 Q14 -10 12 4 Z" fill={P.tomato} {...ink} strokeWidth={3} />
        <path d="M0 -12 Q1 -18 5 -20" fill="none" stroke={P.woodDeep} strokeWidth="3" strokeLinecap="round" />
        <path d="M-6 -6 Q-4 -9 -1 -9" fill="none" stroke={P.white} strokeWidth="2.5" strokeLinecap="round" />
      </g>
    </Frame>
  );
}

export function StrangeHouseCover({ decorative, locale = DEFAULT_LOCALE }: CoverProps) {
  return (
    <Frame decorative={decorative} bg={P.plum800} label={COVER_ALT[locale]["strange-house"]}>
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

export function OperationRecessCover({ decorative, locale = DEFAULT_LOCALE }: CoverProps) {
  return (
    <Frame decorative={decorative} bg="#f3e6c4" label={COVER_ALT[locale]["operation-recess"]}>
      <OperationRecessCoverArt />
    </Frame>
  );
}

export function PajamaWarCover({ decorative, locale = DEFAULT_LOCALE }: CoverProps) {
  return (
    <Frame decorative={decorative} bg="#5b3f9c" label={COVER_ALT[locale]["pajama-war"]}>
      <PajamaWarCoverArt />
    </Frame>
  );
}

export function OffAirVacationCover({ decorative, locale = DEFAULT_LOCALE }: CoverProps) {
  return (
    <Frame decorative={decorative} bg="#5cb9f0" label={COVER_ALT[locale]["off-air-vacation"]}>
      <OffAirVacationCoverArt />
    </Frame>
  );
}

export function DownhillDerbyCover({ decorative, locale = DEFAULT_LOCALE }: CoverProps) {
  return (
    <Frame decorative={decorative} bg="#8fd4f7" label={COVER_ALT[locale]["downhill-derby"]}>
      <DownhillDerbyCoverArt />
    </Frame>
  );
}

export function PastBedtimeCover({ decorative, locale = DEFAULT_LOCALE }: CoverProps) {
  return (
    <Frame decorative={decorative} bg="#241e45" label={COVER_ALT[locale]["past-bedtime"]}>
      <PastBedtimeCoverArt />
    </Frame>
  );
}

export function TalentShowCover({ decorative, locale = DEFAULT_LOCALE }: CoverProps) {
  return (
    <Frame decorative={decorative} bg={P.plum900} label={COVER_ALT[locale]["talent-show"]}>
      <TalentShowCoverArt />
    </Frame>
  );
}

export const COVERS: Record<string, (props: CoverProps) => React.JSX.Element> = {
  "dead-end-street": DeadEndStreetCover,
  "bad-ideas-lab": BadIdeasLabCover,
  "food-fight": FoodFightCover,
  "pajama-war": PajamaWarCover,
  "operation-recess": OperationRecessCover,
  "off-air-vacation": OffAirVacationCover,
  "downhill-derby": DownhillDerbyCover,
  "past-bedtime": PastBedtimeCover,
  "talent-show": TalentShowCover,
};

export function GameCover({ slug, decorative, locale }: { slug: string } & CoverProps) {
  const Cover = COVERS[slug];
  return Cover ? <Cover decorative={decorative} locale={locale} /> : null;
}
