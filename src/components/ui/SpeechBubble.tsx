import type { ReactNode } from "react";

type Tail = "left" | "right" | "bottom" | "top";

const tails: Record<Tail, string> = {
  left: "left-0 top-[46%] -translate-x-[78%] -rotate-[8deg]",
  right: "right-0 top-[46%] translate-x-[78%] rotate-[8deg] scale-x-[-1]",
  bottom: "bottom-0 left-[22%] translate-y-[80%] rotate-[-80deg]",
  top: "top-0 left-[22%] -translate-y-[80%] rotate-[80deg]",
};

export function SpeechBubble({
  children,
  tail = "left",
  className = "",
}: {
  children: ReactNode;
  tail?: Tail;
  className?: string;
}) {
  return (
    <div
      className={`relative rounded-[22px_26px_20px_24px/24px_20px_26px_22px] border-[3px] border-ink bg-paper px-[1em] py-[0.7em] text-ink shadow-[var(--shadow-ink)] ${className}`}
    >
      <svg
        viewBox="0 0 40 30"
        aria-hidden
        className={`absolute h-[1.6em] w-[2em] ${tails[tail]}`}
        style={{ overflow: "visible" }}
      >
        <path d="M40 4 Q18 10 2 22 Q22 22 40 22" fill="#fbf5e6" stroke="#1d1830" strokeWidth="3.4" strokeLinejoin="round" />
        <path d="M41 7 L41 19" stroke="#fbf5e6" strokeWidth="5" />
      </svg>
      {children}
    </div>
  );
}
