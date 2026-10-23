"use client";

import { forwardRef, type ReactNode } from "react";
import { spotStyle, type Spot } from "./layout";

type CommonProps = {
  spot: Spot;
  label: string;
  hint?: string;
  onHint?: (hint: string | null, spot: Spot) => void;
  onHoverSound?: () => void;
  hit?: "shape" | "box";
  className?: string;
  children: ReactNode;
  z?: number;
  pressed?: boolean;
  describedBy?: string;
};

type ButtonProps = CommonProps & {
  onActivate: () => void;
};

const base =
  "group absolute block cursor-pointer select-none rounded-2xl outline-offset-4 [-webkit-touch-callout:none] focus-visible:z-40";

const art =
  "block h-full w-full transition-[transform,filter] duration-200 ease-out group-hover:-translate-y-1 group-hover:drop-shadow-[0_0_14px_rgba(255,214,120,0.75)] group-focus-visible:-translate-y-1 group-focus-visible:drop-shadow-[0_0_14px_rgba(255,214,120,0.75)] group-active:translate-y-0.5";

export function hitClass(hit: "shape" | "box") {
  return hit === "shape"
    ? "pointer-events-none [&_svg]:pointer-events-none [&_svg>g]:[pointer-events:visiblePainted]"
    : "";
}

export const RoomButton = forwardRef<HTMLButtonElement, ButtonProps>(function RoomButton(
  { spot, label, hint, onHint, onHoverSound, hit = "shape", className = "", children, onActivate, z = 10, pressed, describedBy },
  ref,
) {
  return (
    <button
      ref={ref}
      type="button"
      aria-pressed={pressed}
      aria-describedby={describedBy}
      onClick={onActivate}
      onPointerEnter={(e) => {
        if (e.pointerType === "mouse") {
          onHoverSound?.();
          if (hint) onHint?.(hint, spot);
        }
      }}
      onPointerLeave={(e) => {
        if (e.pointerType === "mouse") onHint?.(null, spot);
      }}
      onFocus={() => {
        if (hint) onHint?.(hint, spot);
      }}
      onBlur={() => onHint?.(null, spot)}
      className={`${base} ${hitClass(hit)} ${className}`}
      style={{ ...spotStyle(spot), zIndex: z }}
    >
      <span className="sr-only">{label}</span>
      <span className={art}>{children}</span>
    </button>
  );
});
