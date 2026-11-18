import { Head } from "@/components/art/PajamaWarArt";
import { Feather, Pillow } from "@/components/art/PajamaWarProps";
import { P } from "@/lib/palette";

export function PajamaScreen() {
  return (
    <svg viewBox="0 0 294 246" className="absolute inset-0 h-full w-full" preserveAspectRatio="xMidYMid slice" aria-hidden>
      <rect width="294" height="246" fill="#5b3f9c" />
      <path d="M0 20 Q36 38 74 20 Q110 38 148 20 Q184 38 220 20 Q256 38 294 20" fill="none" stroke={P.ink} strokeWidth="2.5" />
      {Array.from({ length: 12 }, (_, i) => (
        <circle key={i} cx={12 + i * 25} cy={24 + Math.abs(Math.sin((i + 0.5) * 0.8)) * 9} r="4.5" fill={["#ffd36b", "#ff8fc4", "#8ff0d8"][i % 3]} stroke={P.ink} strokeWidth="1.5" />
      ))}
      <rect y="150" width="294" height="60" fill="#b8774a" />
      <path d="M0 150 L294 150" stroke={P.ink} strokeWidth="3.5" />
      <g style={{ animation: "float 2.4s ease-in-out infinite" }}>
        <Pillow x={148} y={96} w={52} rotate={-20} tint="#ffdcec" />
      </g>
      <Feather x={170} y={70} rotate={-30} s={1.2} />
      <Feather x={120} y={120} rotate={20} s={1.1} />
      <Head who="lia" x={20} y={66} size={92} face="fierce" rotate={-6} />
      <Head who="bia" x={186} y={70} size={88} face="ouch" rotate={8} flip />
    </svg>
  );
}
