import Link from "next/link";
import type { ComponentProps, ReactNode } from "react";

const tones = {
  sun: "bg-sun",
  mint: "bg-mint",
  bubblegum: "bg-bubblegum",
  tangerine: "bg-tangerine",
  plum: "bg-plum-300",
  sky: "bg-sky",
  cream: "bg-cream",
  tomato: "bg-tomato",
} as const;

export type Tone = keyof typeof tones;

export function toneBg(tone: Tone) {
  return tones[tone];
}

export function PaperPanel({
  children,
  className = "",
  as: Tag = "section",
  ...rest
}: { children: ReactNode; className?: string; as?: "section" | "div" | "article" } & Omit<ComponentProps<"section">, "ref">) {
  return (
    <Tag
      className={`paper relative border-[3px] border-ink shadow-[var(--shadow-ink-lg)] wobbly ${className}`}
      {...rest}
    >
      {children}
    </Tag>
  );
}

export function PageTitle({
  children,
  kicker,
  className = "",
  tone = "sun",
}: {
  children: ReactNode;
  kicker?: ReactNode;
  className?: string;
  tone?: Tone;
}) {
  return (
    <div className={`text-center ${className}`}>
      {kicker && (
        <p
          className={`mb-2 inline-block -rotate-2 rounded-md border-[3px] border-ink px-3 py-0.5 font-display text-sm uppercase tracking-wider text-ink shadow-[var(--shadow-ink-sm)] ${toneBg(tone)}`}
        >
          {kicker}
        </p>
      )}
      <h1 className="font-display text-[clamp(2.2rem,6vw,4.4rem)] uppercase leading-[0.95] tracking-wide text-ink [text-shadow:3px_4px_0_var(--color-cream-3)]">
        {children}
      </h1>
    </div>
  );
}

export function Tag({ children, tone = "plum", className = "" }: { children: ReactNode; tone?: Tone; className?: string }) {
  return (
    <span
      className={`inline-flex items-center rounded-md border-2 border-ink px-2 py-0.5 font-display text-[11px] uppercase tracking-wider text-ink ${toneBg(tone)} ${className}`}
    >
      {children}
    </span>
  );
}

const buttonBase =
  "press inline-flex items-center justify-center gap-2 border-[3px] border-ink font-display uppercase tracking-wide text-ink shadow-[var(--shadow-ink)] wobbly-sm disabled:cursor-not-allowed disabled:opacity-60";

const sizes = {
  sm: "min-h-10 px-3 py-1 text-sm",
  md: "min-h-12 px-5 py-2 text-lg",
  lg: "min-h-16 px-8 py-3 text-2xl",
};

export function InkLink({
  tone = "sun",
  size = "md",
  className = "",
  children,
  ...rest
}: { tone?: Tone; size?: keyof typeof sizes; className?: string; children: ReactNode } & ComponentProps<typeof Link>) {
  return (
    <Link className={`${buttonBase} ${sizes[size]} ${toneBg(tone)} ${className}`} {...rest}>
      {children}
    </Link>
  );
}

export function InkButton({
  tone = "sun",
  size = "md",
  className = "",
  children,
  ...rest
}: { tone?: Tone; size?: keyof typeof sizes; className?: string; children: ReactNode } & ComponentProps<"button">) {
  return (
    <button type="button" className={`${buttonBase} ${sizes[size]} ${toneBg(tone)} ${className}`} {...rest}>
      {children}
    </button>
  );
}

export function Sticker({ children, className = "", tone = "sun" }: { children: ReactNode; className?: string; tone?: Tone }) {
  return (
    <span
      className={`inline-block rotate-3 rounded-lg border-[3px] border-ink px-2.5 py-1 font-display text-xs uppercase tracking-wider text-ink shadow-[var(--shadow-ink-sm)] ${toneBg(tone)} ${className}`}
    >
      {children}
    </span>
  );
}
