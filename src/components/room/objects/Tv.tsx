"use client";

import Link from "next/link";
import type { MouseEvent } from "react";
import { PlayIcon } from "@/components/art/Icons";
import { spotStyle, SPOTS, type Spot } from "../layout";
import { CHANNELS, ChannelContent, type ChannelId } from "./TvChannels";
import { TV_BOX, TV_KNOB, TV_SCREEN, TvKnob, TvSet } from "./TvSet";

const pct = (v: number, total: number) => `${(v / total) * 100}%`;

export type TvBadge = "weekly" | "new" | null;

export type TvNext = { number: string; name: string; onTune: () => void };

type Props = {
  channel: ChannelId;
  badge: TvBadge;
  next: TvNext | null;
  switching: boolean;
  osd: boolean;
  knobAngle: number;
  flash: boolean;
  onKnob: () => void;
  onLaunch: (href: string, play: boolean) => void;
  onHint: (hint: string | null, spot: Spot) => void;
  onHoverSound: () => void;
};

const BADGE_LABEL: Record<Exclude<TvBadge, null>, string> = { weekly: "Jogo da semana", new: "Inédito" };

export function Tv({ channel, badge, next, switching, osd, knobAngle, flash, onKnob, onLaunch, onHint, onHoverSound }: Props) {
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

  const screenHint = info.game
    ? badge === "weekly"
      ? `${info.game.title} é o jogo da semana! Clica na tela pra jogar.`
      : badge === "new"
        ? `${info.game.title}: programa inédito pra você! Clica na tela pra jogar.`
        : `Reprise de ${info.game.title}! Clica na tela pra jogar.`
    : (info.hint ?? null);
  const ctaContext = info.cta ? (badge ? `${info.cta.context}, ${BADGE_LABEL[badge].toLowerCase()}` : info.cta.context) : "";

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
            className={`group absolute inset-0 z-10 flex items-end justify-center [--focus:var(--color-sun)] focus-visible:outline-offset-[-6px] ${next ? "pb-[17%]" : "pb-[6%]"}`}
            style={{ borderRadius: "inherit" }}
          >
            <span className="flex items-center gap-[0.4em] rounded-full border-[3px] border-ink bg-sun px-[0.9em] py-[0.25em] font-display text-[clamp(10px,1.15vw,19px)] uppercase leading-none tracking-wide text-ink shadow-[0_3px_0_0_var(--color-ink)] transition-transform duration-150 group-hover:-translate-y-0.5 group-hover:scale-105 group-active:translate-y-0.5">
              {info.cta.label}
              <span className="sr-only">: {ctaContext}</span>
              <PlayIcon className="size-[1em] text-ink" />
            </span>
          </Link>
        )}
        {badge && info.game && (
          <span
            aria-hidden
            className={`pointer-events-none absolute left-[5%] top-[6%] z-[15] -rotate-6 rounded-[4px] border-[2.5px] border-ink px-[0.5em] py-[0.15em] font-display text-[clamp(7px,0.78vw,13px)] uppercase leading-none tracking-wide shadow-[0_2px_0_0_var(--color-ink)] ${
              badge === "weekly" ? "bg-tomato text-cream" : "bg-sun text-ink"
            }`}
          >
            {BADGE_LABEL[badge]}
          </span>
        )}
        {next && (
          <button
            type="button"
            onClick={next.onTune}
            onPointerEnter={(e) => e.pointerType === "mouse" && onHoverSound()}
            aria-label={`A seguir: ${next.name}, canal ${next.number}. Sintonizar agora`}
            className="absolute inset-x-0 bottom-0 z-20 flex h-[13%] min-h-6 items-center gap-[0.5em] overflow-hidden border-t-[2px] border-ink bg-plum-950/90 px-[6%] text-left [--focus:var(--color-sun)] focus-visible:outline-offset-[-4px] hover:bg-plum-900"
          >
            <span className="shrink-0 rounded-[3px] bg-sun px-[0.4em] font-display text-[clamp(8px,0.62vw,10px)] uppercase leading-[1.5] text-ink">A seguir</span>
            <span className="line-clamp-2 min-w-0 font-display text-[clamp(8px,0.66vw,11px)] uppercase leading-[1.1] tracking-wide text-cream">
              {next.name}
            </span>
            <span aria-hidden className="ml-auto shrink-0 font-display text-[clamp(7px,0.78vw,13px)] leading-none text-sun">
              ▸
            </span>
          </button>
        )}
        <div aria-hidden className="pointer-events-none absolute inset-0 scanlines opacity-70" />
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 bg-white opacity-[0.12]"
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
          <div
            aria-hidden
            className="pointer-events-none absolute inset-x-0 top-0 z-30 flex items-baseline gap-[0.5em] bg-plum-950/85 px-[6%] py-[2.5%] font-display uppercase leading-none text-lime"
            style={{ textShadow: "2px 2px 0 #1d1830" }}
          >
            <span className="shrink-0 text-[clamp(10px,1.2vw,20px)]">CH {info.number}</span>
            <span className="min-w-0 truncate text-[clamp(7px,0.78vw,13px)] tracking-wide">{info.game?.title ?? info.name}</span>
          </div>
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
