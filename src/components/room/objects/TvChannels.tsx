import { Mascot404 } from "@/components/mascot/Mascot404";
import { P } from "@/lib/palette";

export type ChannelId = "street" | "house" | "bars" | "cartoon" | "lost" | "tape";

export type Channel = {
  id: ChannelId;
  number: string;
  name: string;
  cta?: { href: string; label: string; context: string; play?: boolean };
};

export const CHANNELS: Record<ChannelId, Channel> = {
  street: {
    id: "street",
    number: "03",
    name: "Jogo da semana: Rua Sem Saída",
    cta: { href: "/play/rua-sem-saida", label: "Jogar agora", context: "Rua Sem Saída, o jogo da semana", play: true },
  },
  house: {
    id: "house",
    number: "05",
    name: "Prévia: Casa Estranha (em breve)",
    cta: { href: "/games/casa-estranha", label: "Ver detalhes", context: "Casa Estranha, jogo em breve" },
  },
  bars: { id: "bars", number: "07", name: "Fora do ar: barras coloridas" },
  cartoon: {
    id: "cartoon",
    number: "09",
    name: "Desenho: 404 e o Controle Perdido",
    cta: { href: "/characters", label: "Personagens", context: "conhecer a turma do CANAL 404" },
  },
  lost: { id: "lost", number: "00", name: "Transmissão perdida" },
  tape: { id: "tape", number: "AV", name: "Fita misteriosa no videocassete" },
};

export const CHANNEL_ORDER: ChannelId[] = ["street", "house", "bars", "cartoon"];

const display = { fontFamily: "var(--font-luckiest)" };

function Cloud({ x, y, s = 1 }: { x: number; y: number; s?: number }) {
  return (
    <path
      transform={`translate(${x} ${y}) scale(${s})`}
      d="M0 18 Q-2 4 12 4 Q16 -8 30 -4 Q40 -12 50 0 Q64 0 62 14 Q66 24 54 24 L6 24 Q-4 24 0 18 Z"
      fill={P.white}
      stroke={P.ink}
      strokeWidth="3"
      strokeLinejoin="round"
    />
  );
}

function StreetScreen() {
  return (
    <svg viewBox="0 0 294 246" className="absolute inset-0 h-full w-full" preserveAspectRatio="xMidYMid slice" aria-hidden>
      <rect width="294" height="246" fill="#82d3f7" />
      <circle cx="244" cy="44" r="20" fill={P.sun} stroke={P.ink} strokeWidth="3" />
      <g style={{ animation: "float 6s ease-in-out infinite" }}>
        <Cloud x={24} y={34} s={0.9} />
        <Cloud x={150} y={20} s={0.7} />
      </g>
      <path d="M0 150 L30 120 L60 150 L60 120 L92 96 L124 120 L124 150 L160 128 L196 150 L230 112 L266 140 L294 128 L294 170 L0 170 Z" fill="#c9a6e8" stroke={P.ink} strokeWidth="3" strokeLinejoin="round" />
      <rect x="72" y="122" width="12" height="12" fill={P.sun} stroke={P.ink} strokeWidth="2" />
      <rect x="236" y="130" width="12" height="12" fill={P.sun} stroke={P.ink} strokeWidth="2" />
      <rect y="168" width="294" height="78" fill={P.lime} />
      {Array.from({ length: 13 }, (_, i) => i * 24 - 4).map((x) => (
        <path key={x} d={`M${x} 196 L${x} 154 L${x + 10} 146 L${x + 20} 154 L${x + 20} 196 Z`} fill={P.tangerine} stroke={P.ink} strokeWidth="2.5" strokeLinejoin="round" />
      ))}
      <path d="M0 166 L294 166 M0 186 L294 186" stroke={P.ink} strokeWidth="3" />
      <rect y="196" width="294" height="50" fill="#d8a066" />
      <path d="M0 196 L294 196" stroke={P.ink} strokeWidth="3" />
      <g style={{ animation: "screen-shoe 3.6s cubic-bezier(.3,.1,.6,1) infinite" }}>
        <g transform="translate(-30 160)">
          <path d="M0 0 Q2 -10 12 -10 L20 -10 Q24 -2 34 -2 Q42 0 40 8 L0 8 Z" fill={P.tomato} stroke={P.ink} strokeWidth="2.5" strokeLinejoin="round" />
          <path d="M2 8 L40 8" stroke={P.white} strokeWidth="3" />
        </g>
      </g>
      <g transform="rotate(-8 150 90)" style={display}>
        <text x="150" y="88" textAnchor="middle" fontSize="54" fill={P.sun} stroke={P.ink} strokeWidth="8" paintOrder="stroke" strokeLinejoin="round">
          RUA
        </text>
        <text x="152" y="124" textAnchor="middle" fontSize="32" fill={P.white} stroke={P.ink} strokeWidth="7" paintOrder="stroke" strokeLinejoin="round">
          SEM SAÍDA
        </text>
      </g>
      <g transform="rotate(-6 50 22)">
        <rect x="10" y="12" width="96" height="22" rx="4" fill={P.tomato} stroke={P.ink} strokeWidth="3" />
        <text x="58" y="29" textAnchor="middle" fontSize="12.5" fill={P.white} style={display} letterSpacing="0.5">
          JOGO DA SEMANA
        </text>
      </g>
    </svg>
  );
}

function HouseScreen() {
  return (
    <svg viewBox="0 0 294 246" className="absolute inset-0 h-full w-full" preserveAspectRatio="xMidYMid slice" aria-hidden>
      <rect width="294" height="246" fill={P.plum800} />
      {[
        [30, 30],
        [80, 60],
        [260, 26],
        [200, 70],
        [130, 20],
        [40, 110],
      ].map(([x, y]) => (
        <circle key={`${x}${y}`} cx={x} cy={y} r="2" fill={P.sunPale} />
      ))}
      <circle cx="232" cy="56" r="24" fill={P.sunPale} stroke={P.ink} strokeWidth="3" />
      <circle cx="224" cy="50" r="5" fill="#e8d28a" />
      <path d="M70 210 L76 120 L60 120 L118 66 L170 116 L156 118 L164 210 Z" fill={P.plum600} stroke={P.ink} strokeWidth="3.5" strokeLinejoin="round" />
      <path d="M150 96 L154 70 L166 72 L164 104" fill={P.plum600} stroke={P.ink} strokeWidth="3" />
      <rect x="92" y="128" width="22" height="26" fill={P.sun} stroke={P.ink} strokeWidth="3" transform="rotate(-6 103 141)" />
      <rect x="128" y="138" width="20" height="22" fill={P.sun} stroke={P.ink} strokeWidth="3" transform="rotate(8 138 149)" />
      <path d="M106 210 L106 176 Q114 168 122 176 L122 210 Z" fill={P.ink} />
      <g style={{ animation: "float 3s ease-in-out infinite" }}>
        <g transform="translate(206 140) rotate(160)">
          <rect x="-14" y="-4" width="28" height="6" fill={P.wood} stroke={P.ink} strokeWidth="2.5" />
          <path d="M-12 2 L-12 18 M12 2 L12 18 M-12 -4 L-12 -20 L12 -20 L12 -4" stroke={P.ink} strokeWidth="3" fill="none" />
        </g>
      </g>
      <rect y="208" width="294" height="38" fill={P.plum900} />
      <text x="147" y="234" textAnchor="middle" fontSize="24" fill={P.mint} stroke={P.ink} strokeWidth="5" paintOrder="stroke" style={display}>
        CASA ESTRANHA
      </text>
      <g transform="rotate(12 236 166)">
        <rect x="196" y="150" width="84" height="30" rx="4" fill="none" stroke={P.tomato} strokeWidth="4" />
        <text x="238" y="173" textAnchor="middle" fontSize="18" fill={P.tomato} style={display}>
          EM BREVE
        </text>
      </g>
    </svg>
  );
}

function BarsScreen() {
  const bars = ["#f2efe6", "#f7d94c", "#5fd8e6", "#68d36a", "#e05fd0", "#ea4a46", "#3f5bd8"];
  return (
    <div className="absolute inset-0">
      <svg viewBox="0 0 294 246" className="absolute inset-0 h-full w-full" preserveAspectRatio="none" aria-hidden>
        {bars.map((c, i) => (
          <rect key={c} x={i * 42} y="0" width="42" height="170" fill={c} />
        ))}
        {bars
          .slice()
          .reverse()
          .map((c, i) => (
            <rect key={`b${c}`} x={i * 42} y="170" width="42" height="22" fill={c} opacity="0.85" />
          ))}
        <rect y="192" width="294" height="54" fill="#1b1b2b" />
        <rect x="40" y="200" width="44" height="40" fill="#f2efe6" />
        <rect x="126" y="200" width="44" height="40" fill={P.plum600} />
      </svg>
      <div className="absolute left-1/2 top-[34%] -translate-x-1/2 -translate-y-1/2 rotate-[-3deg] border-[3px] border-ink bg-ink px-3 py-1 font-display text-[clamp(10px,1.3vw,22px)] tracking-wide text-cream">
        SEM SINAL
      </div>
      <Mascot404 expression="static" className="absolute bottom-[4%] right-[6%] w-[22%]" />
    </div>
  );
}

function CartoonScreen() {
  return (
    <div className="absolute inset-0 bg-[#ffe7a8]">
      <svg viewBox="0 0 294 246" className="absolute inset-0 h-full w-full" preserveAspectRatio="xMidYMid slice" aria-hidden>
        <rect width="294" height="246" fill="#ffe7a8" />
        {[0, 1, 2, 3, 4, 5, 6].map((i) => (
          <rect key={i} x={i * 48} y="0" width="24" height="190" fill="#ffd98a" />
        ))}
        <rect y="186" width="294" height="60" fill={P.bubblegum} />
        <path d="M0 186 L294 186" stroke={P.ink} strokeWidth="3" />
        <g style={{ animation: "screen-remote 2.4s ease-in-out infinite" }}>
          <rect x="196" y="120" width="22" height="48" rx="6" fill={P.inkSoft} stroke={P.ink} strokeWidth="3" />
          <circle cx="207" cy="132" r="4" fill={P.tomato} />
          <circle cx="202" cy="146" r="2.5" fill={P.cream} />
          <circle cx="212" cy="146" r="2.5" fill={P.cream} />
        </g>
        <rect x="0" y="212" width="294" height="34" fill={P.ink} opacity="0.85" />
      </svg>
      <div className="absolute bottom-[16%] left-[10%] w-[36%]" style={{ animation: "screen-run 0.5s ease-in-out infinite alternate" }}>
        <Mascot404 pose="full" expression="excited" className="w-full" />
      </div>
      <p className="absolute inset-x-0 bottom-[3%] text-center font-display text-[clamp(7px,0.85vw,14px)] tracking-wide text-sun">
        EP. 12 — O CONTROLE PERDIDO
      </p>
    </div>
  );
}

function LostScreen() {
  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center gap-[6%] bg-plum-950 px-[8%] text-center">
      <p
        className="font-display text-[clamp(10px,1.5vw,24px)] leading-none text-mint"
        style={{ animation: "glitch 2.2s steps(1) infinite" }}
      >
        TRANSMISSÃO PERDIDA
      </p>
      <p className="font-hand text-[clamp(8px,1vw,16px)] leading-tight text-cream">31/12/2007 — 23:59</p>
      <p className="font-hand text-[clamp(8px,1.05vw,17px)] leading-tight text-sun">
        Se você está vendo isso, o canal nunca saiu do ar.
      </p>
    </div>
  );
}

function TapeScreen() {
  return (
    <div className="absolute inset-0 bg-[#2a3a6a]">
      <div className="absolute inset-0 flex items-end justify-center pb-[14%]">
        <div className="w-[38%]" style={{ animation: "screen-dance 0.6s ease-in-out infinite alternate" }}>
          <Mascot404 pose="wave" expression="wink" className="w-full" />
        </div>
      </div>
      <p className="absolute left-[7%] top-[7%] font-display text-[clamp(8px,1vw,16px)] text-cream">▶ PLAY</p>
      <p className="absolute right-[7%] top-[7%] font-display text-[clamp(8px,1vw,16px)] text-cream">SP 0:04:04</p>
      <p className="absolute inset-x-[6%] bottom-[4%] text-center font-hand text-[clamp(8px,1vw,16px)] leading-tight text-sun">
        NÃO ERA PRA VOCÊ VER ISSO
      </p>
      <div className="absolute inset-x-0 h-[12%] bg-white/25 mix-blend-overlay" style={{ animation: "roll-bar 2.8s linear infinite" }} />
    </div>
  );
}

export function ChannelContent({ id }: { id: ChannelId }) {
  switch (id) {
    case "street":
      return <StreetScreen />;
    case "house":
      return <HouseScreen />;
    case "bars":
      return <BarsScreen />;
    case "cartoon":
      return <CartoonScreen />;
    case "lost":
      return <LostScreen />;
    case "tape":
      return <TapeScreen />;
  }
}
