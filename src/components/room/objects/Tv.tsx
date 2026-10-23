"use client";

import Link from "next/link";
import type { MouseEvent } from "react";
import { PlayTriangle } from "@/components/art/Icons";
import { spotStyle, SPOTS, type Spot } from "../layout";
import { CHANNELS, ChannelContent, type ChannelId } from "./TvChannels";
import { TV_BOX, TV_KNOB, TV_SCREEN, TvKnob, TvSet } from "./TvSet";

const pct = (v: number, total: number) => `${(v / total) * 100}%`;

type Props = {
  channel: ChannelId;
  switching: boolean;
  osd: boolean;
  knobAngle: number;
  flash: boolean;
  onKnob: () => void;
  onLaunch: (href: string, play: boolean) => void;
  onHint: (hint: string | null, spot: Spot) => void;
  onHoverSound: () => void;
};

export function Tv({ channel, switching, osd, knobAngle, flash, onKnob, onLaunch, onHint, onHoverSound }: Props) {
  const spot = SPOTS.tv;
  const info = CHANNELS[channel];
  const screenStyle = {
    left: pct(TV_SCREEN.x, TV_BOX.w),
    top: pct(TV_SCREEN.y, TV_BOX.h),
    width: pct(TV_SCREEN.w, TV_BOX.w),
    height: pct(TV_SCREEN.h, TV_BOX.h),
    borderRadius: `${(34 / TV_SCREEN.w) * 100}% / ${(34 / TV_SCREEN.h) * 100}%`,
  };
  const knobStyle = {
    left: pct(TV_KNOB.cx - TV_KNOB.r, TV_BOX.w),
    top: pct(TV_KNOB.cy - TV_KNOB.r, TV_BOX.h),
    width: pct(TV_KNOB.r * 2, TV_BOX.w),
    height: pct(TV_KNOB.r * 2, TV_BOX.h),
  };

  const handleLaunch = (event: MouseEvent<HTMLAnchorElement>) => {
    if (!info.cta) return;
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.button !== 0) return;
    event.preventDefault();
    onLaunch(info.cta.href, Boolean(info.cta.play));
  };

  const screenHint =
    channel === "rua"
      ? "Esse é o jogo da semana! Clica na tela pra jogar."
      : channel === "casa"
        ? "Casa Estranha ainda está em produção. Dá pra espiar os detalhes."
        : channel === "desenho"
          ? "Reprise do meu desenho! Clica pra conhecer a turma."
          : null;

  return (
    <div className="absolute" style={{ ...spotStyle(spot), zIndex: 12 }}>
      <div className="pointer-events-none absolute inset-0">
        <TvSet glow />
      </div>
      <div
        className="absolute overflow-hidden bg-[#173a3a] shadow-[inset_0_0_24px_rgba(0,0,0,0.55)]"
        style={screenStyle}
      >
        <div key={channel} aria-hidden className="absolute inset-0" style={{ animation: "channel-in 220ms ease-out both" }}>
          <ChannelContent id={channel} />
        </div>
        {info.cta && (
          <Link
            href={info.cta.href}
            onClick={handleLaunch}
            onPointerEnter={(e) => {
              if (e.pointerType !== "mouse") return;
              onHoverSound();
              if (screenHint) onHint(screenHint, spot);
            }}
            onPointerLeave={(e) => {
              if (e.pointerType === "mouse") onHint(null, spot);
            }}
            onFocus={() => screenHint && onHint(screenHint, spot)}
            onBlur={() => onHint(null, spot)}
            className="group absolute inset-0 z-10 flex items-end justify-center pb-[6%] [--focus:var(--color-sun)] focus-visible:outline-offset-[-6px]"
            style={{ borderRadius: "inherit" }}
          >
            <span className="flex items-center gap-[0.4em] rounded-full border-[3px] border-ink bg-sun px-[0.9em] py-[0.25em] font-display text-[clamp(10px,1.15vw,19px)] uppercase leading-none tracking-wide text-ink shadow-[0_3px_0_0_var(--color-ink)] transition-transform duration-150 group-hover:-translate-y-0.5 group-hover:scale-105 group-active:translate-y-0.5">
              {info.cta.label}
              <span className="sr-only">: {info.cta.context}</span>
              <PlayTriangle className="size-[1em] text-ink" />
            </span>
          </Link>
        )}
        <div aria-hidden className="pointer-events-none absolute inset-0 scanlines opacity-70" />
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 bg-white"
          style={{ animation: "screen-flicker 5s ease-in-out infinite" }}
        />
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 top-0 h-[14%] bg-gradient-to-b from-transparent via-white/15 to-transparent"
          style={{ animation: "roll-bar 9s linear infinite" }}
        />
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              "radial-gradient(ellipse at 28% 18%, rgba(255,255,255,.32) 0, rgba(255,255,255,0) 34%), radial-gradient(ellipse at 50% 50%, rgba(0,0,0,0) 58%, rgba(0,0,0,.42) 100%)",
          }}
        />
        {switching && (
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 z-20"
            style={{ backgroundImage: "var(--static)", backgroundSize: "160px", animation: "static-shift 0.24s steps(4) infinite" }}
          />
        )}
        {osd && (
          <p
            aria-hidden
            className="pointer-events-none absolute right-[6%] top-[5%] z-30 font-display text-[clamp(11px,1.5vw,26px)] leading-none text-lime"
            style={{ textShadow: "2px 2px 0 #1d1830" }}
          >
            CH {info.number}
          </p>
        )}
        {flash && (
          <div aria-hidden className="pointer-events-none absolute inset-0 z-40 bg-white" style={{ animation: "flash-out 380ms ease-out both" }} />
        )}
      </div>
      <button
        type="button"
        onClick={onKnob}
        aria-label={`Mudar de canal. Canal atual: ${info.number}, ${info.name}`}
        onPointerEnter={(e) => {
          if (e.pointerType !== "mouse") return;
          onHoverSound();
          onHint("Esse botão muda de canal. Dizem que tem um canal que não devia existir...", spot);
        }}
        onPointerLeave={(e) => e.pointerType === "mouse" && onHint(null, spot)}
        onFocus={() => onHint("Esse botão muda de canal. Dizem que tem um canal que não devia existir...", spot)}
        onBlur={() => onHint(null, spot)}
        className="absolute z-10 cursor-pointer rounded-full [--focus:var(--color-sun)] transition-transform duration-150 hover:scale-110 active:scale-95"
        style={knobStyle}
      >
        <TvKnob angle={knobAngle} />
      </button>
    </div>
  );
}
