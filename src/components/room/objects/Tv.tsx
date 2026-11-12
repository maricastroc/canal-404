"use client";

import type { CSSProperties, MouseEvent, Ref } from "react";
import { PlayIcon, RewindIcon, ZoomIcon } from "@/components/art/Icons";
import { IntentLink } from "@/components/ui/IntentLink";
import { missionCta, missionHint, useMissionOnAir } from "../MissionOnAir";
import { spotStyle, SPOTS, type Spot } from "../layout";
import { useBroadcast, useTimeline } from "../tapes/broadcast";
import { TAPE_PROGRAMS } from "../tapes";
import { isTape } from "./tapes";
import { CHANNELS, ChannelContent, type ChannelId } from "./TvChannels";
import { TV_BOX, TV_KNOB, TV_SCREEN, TvKnob, TvSet } from "./TvSet";

const pct = (v: number, total: number) => `${(v / total) * 100}%`;

export type TvBadge = "new" | null;

export type TvNext = { number: string; name: string; onTune: () => void };

const BADGE_LABEL: Record<Exclude<TvBadge, null>, string> = { new: "Inédito" };

export const SCREEN_RADIUS = `${(34 / TV_SCREEN.w) * 100}% / ${(34 / TV_SCREEN.h) * 100}%`;

export const TV_ZOOM_BUTTON = { cx: 322, cy: 329, r: 21 };

type ScreenProps = {
  channel: ChannelId;
  badge: TvBadge;
  next?: TvNext | null;
  switching: boolean;
  osd: boolean;
  flash: boolean;
  rewinding: boolean;
  onLaunch: (href: string, play: boolean) => void;
  onZoom?: () => void;
  onHint?: (hint: string | null, spot: Spot) => void;
  onHoverSound?: () => void;
  screenRef?: Ref<HTMLDivElement>;
  className?: string;
  style?: CSSProperties;
};

function RewindButton({ channel, onHoverSound, raised }: { channel: ChannelId; onHoverSound?: () => void; raised: boolean }) {
  const program = isTape(channel) ? TAPE_PROGRAMS[channel] : null;
  const { replay } = useBroadcast();
  const { phase } = useTimeline([0, program?.length ?? Number.MAX_SAFE_INTEGER]);
  if (!program?.rewind || !program.length || phase === 0) return null;
  return (
    <div className={`pointer-events-none absolute inset-x-0 bottom-0 z-20 flex justify-center ${raised ? "pb-[17%]" : "pb-[6%]"}`}>
      <button
        type="button"
        onClick={replay}
        onPointerEnter={(e) => e.pointerType === "mouse" && onHoverSound?.()}
        className="pointer-events-auto flex items-center gap-[0.4em] rounded-full border-[3px] border-ink bg-sun px-[0.9em] py-[0.25em] font-display text-[max(10px,7.2cqw)] uppercase leading-none tracking-wide text-ink shadow-[0_3px_0_0_var(--color-ink)] [--focus:var(--color-cream)] transition-transform duration-150 hover:-translate-y-0.5 hover:scale-105 active:translate-y-0.5"
        style={{ animation: "pop-in 0.3s ease-out both" }}
      >
        <RewindIcon className="size-[1em] text-ink" />
        {program.rewind}
      </button>
    </div>
  );
}

export function TvScreen({ channel, badge, next = null, switching, osd, flash, rewinding, onLaunch, onZoom, onHint, onHoverSound, screenRef, className = "", style }: ScreenProps) {
  const spot = SPOTS.tv;
  const mission = useMissionOnAir();
  const info = channel === "mission" && mission ? { ...CHANNELS[channel], cta: missionCta(mission), hint: missionHint(mission) } : CHANNELS[channel];
  const { take, since } = useBroadcast();
  const fullCta = info.cta && !info.cta.pill;

  const handleLaunch = (event: MouseEvent<HTMLAnchorElement>) => {
    if (!info.cta) return;
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.button !== 0) return;
    event.preventDefault();
    onLaunch(info.cta.href, Boolean(info.cta.play));
  };

  const screenHint = info.game
    ? badge === "new"
      ? `${info.game.title}: programa inédito pra você! Clica na tela pra jogar.`
      : `Reprise de ${info.game.title}! Clica na tela pra jogar.`
    : (info.hint ?? null);
  const ctaContext = info.cta ? (badge ? `${info.cta.context}, ${BADGE_LABEL[badge].toLowerCase()}` : info.cta.context) : "";

  return (
    <div
      ref={screenRef}
      data-testid="tv-screen"
      data-channel={channel}
      data-since={Math.round(since)}
      className={`absolute overflow-hidden bg-[#173a3a] shadow-[inset_0_0_24px_rgba(0,0,0,0.55)] [container-type:size] ${className}`}
      style={{ borderRadius: SCREEN_RADIUS, ...style }}
    >
      <div key={`${channel}-${take}`} aria-hidden className="absolute inset-0" style={{ animation: "channel-in 220ms ease-out both" }}>
        <ChannelContent id={channel} />
      </div>
      {onZoom && !fullCta && (
        <button
          type="button"
          tabIndex={-1}
          aria-hidden
          onClick={onZoom}
          onPointerEnter={(e) => {
            if (e.pointerType !== "mouse") return;
            onHint?.(screenHint ?? "Clica na tela pra ver de perto.", spot);
          }}
          onPointerLeave={(e) => e.pointerType === "mouse" && onHint?.(null, spot)}
          className="absolute inset-0 z-[9] cursor-zoom-in"
          style={{ borderRadius: "inherit" }}
        />
      )}
      {info.cta && (
        <IntentLink
          href={info.cta.href}
          onClick={handleLaunch}
          onPointerEnter={(e) => {
            if (e.pointerType !== "mouse") return;
            onHoverSound?.();
            if (screenHint) onHint?.(screenHint, spot);
          }}
          onPointerLeave={(e) => {
            if (e.pointerType === "mouse") onHint?.(null, spot);
          }}
          onFocus={() => screenHint && onHint?.(screenHint, spot)}
          onBlur={() => onHint?.(null, spot)}
          className={
            fullCta
              ? `group absolute inset-0 z-10 flex items-end justify-center [--focus:var(--color-sun)] focus-visible:outline-offset-[-6px] ${next ? "pb-[17%]" : "pb-[6%]"}`
              : `group absolute bottom-0 left-1/2 z-10 flex -translate-x-1/2 justify-center rounded-full [--focus:var(--color-cream)] ${next ? "mb-[17%]" : "mb-[6%]"}`
          }
          style={fullCta ? { borderRadius: "inherit" } : undefined}
        >
          <span className="flex items-center gap-[0.4em] whitespace-nowrap rounded-full border-[3px] border-ink bg-sun px-[0.9em] py-[0.25em] font-display text-[max(10px,7.8cqw)] uppercase leading-none tracking-wide text-ink shadow-[0_3px_0_0_var(--color-ink)] transition-transform duration-150 group-hover:-translate-y-0.5 group-hover:scale-105 group-active:translate-y-0.5">
            {info.cta.label}
            <span className="sr-only">: {ctaContext}</span>
            <PlayIcon className="size-[1em] text-ink" />
          </span>
        </IntentLink>
      )}
      <RewindButton key={`rewind-${channel}-${take}`} channel={channel} onHoverSound={onHoverSound} raised={Boolean(next)} />
      {badge && info.game && (
        <span
          aria-hidden
          className="pointer-events-none absolute left-[5%] top-[6%] z-[15] -rotate-6 rounded-[4px] border-[2.5px] border-ink bg-sun px-[0.5em] py-[0.15em] font-display text-[max(7px,5.3cqw)] uppercase leading-none tracking-wide text-ink shadow-[0_2px_0_0_var(--color-ink)]"
        >
          {BADGE_LABEL[badge]}
        </span>
      )}
      {next && (
        <button
          type="button"
          onClick={next.onTune}
          onPointerEnter={(e) => e.pointerType === "mouse" && onHoverSound?.()}
          aria-label={`A seguir: ${next.name}, canal ${next.number}. Sintonizar agora`}
          className="absolute inset-x-0 bottom-0 z-20 flex h-[13%] min-h-6 items-center gap-[0.5em] overflow-hidden border-t-[2px] border-ink bg-plum-950/90 px-[6%] text-left [--focus:var(--color-sun)] focus-visible:outline-offset-[-4px] hover:bg-plum-900"
        >
          <span className="shrink-0 rounded-[3px] bg-sun px-[0.4em] font-display text-[max(8px,4.2cqw)] uppercase leading-[1.5] text-ink">A seguir</span>{" "}
          <span className="line-clamp-2 min-w-0 font-display text-[max(8px,4.5cqw)] uppercase leading-[1.1] tracking-wide text-cream">{next.name}</span>
          <span aria-hidden className="ml-auto shrink-0 font-display text-[max(7px,5.3cqw)] leading-none text-sun">
            ▸
          </span>
        </button>
      )}
      <div aria-hidden className="pointer-events-none absolute inset-0 scanlines opacity-70" />
      <div aria-hidden className="pointer-events-none absolute inset-0 bg-white opacity-[0.12]" style={{ animation: "screen-flicker 5s ease-in-out infinite" }} />
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
      {(switching || rewinding) && (
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 z-20"
          style={{ backgroundImage: "var(--static)", backgroundSize: "160px", animation: "static-shift 0.24s steps(4) infinite", opacity: rewinding ? 0.55 : 1 }}
        />
      )}
      {rewinding && (
        <p aria-hidden className="pointer-events-none absolute left-[6%] top-[6%] z-30 font-display text-[max(9px,8.1cqw)] leading-none text-cream" style={{ textShadow: "2px 2px 0 #1d1830" }}>
          ◀◀ REW
        </p>
      )}
      {osd && (
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 top-0 z-30 flex items-baseline gap-[0.5em] bg-plum-950/85 px-[6%] py-[2.5%] font-display uppercase leading-none text-lime"
          style={{ textShadow: "2px 2px 0 #1d1830" }}
        >
          <span className="shrink-0 text-[max(10px,8.1cqw)]">CH {info.number}</span>
          <span className="min-w-0 truncate text-[max(7px,5.3cqw)] tracking-wide">{info.game?.title ?? info.name}</span>
        </div>
      )}
      {flash && <div aria-hidden className="pointer-events-none absolute inset-0 z-40 bg-white" style={{ animation: "flash-out 380ms ease-out both" }} />}
    </div>
  );
}

type Props = Omit<ScreenProps, "screenRef" | "style" | "className"> & {
  knobAngle: number;
  zoomed: boolean;
  onKnob: () => void;
  onZoom: () => void;
  screenRef?: Ref<HTMLDivElement>;
  zoomButtonRef?: Ref<HTMLButtonElement>;
};

export function Tv({ knobAngle, zoomed, onKnob, onZoom, screenRef, zoomButtonRef, ...screen }: Props) {
  const spot = SPOTS.tv;
  const info = CHANNELS[screen.channel];
  const { onHint, onHoverSound } = screen;
  const screenStyle = {
    left: pct(TV_SCREEN.x, TV_BOX.w),
    top: pct(TV_SCREEN.y, TV_BOX.h),
    width: pct(TV_SCREEN.w, TV_BOX.w),
    height: pct(TV_SCREEN.h, TV_BOX.h),
  };
  const knobStyle = {
    left: pct(TV_KNOB.cx - TV_KNOB.r, TV_BOX.w),
    top: pct(TV_KNOB.cy - TV_KNOB.r, TV_BOX.h),
    width: pct(TV_KNOB.r * 2, TV_BOX.w),
    height: pct(TV_KNOB.r * 2, TV_BOX.h),
  };
  const zoomStyle = {
    left: pct(TV_ZOOM_BUTTON.cx - TV_ZOOM_BUTTON.r, TV_BOX.w),
    top: pct(TV_ZOOM_BUTTON.cy - TV_ZOOM_BUTTON.r, TV_BOX.h),
    width: pct(TV_ZOOM_BUTTON.r * 2, TV_BOX.w),
    height: pct(TV_ZOOM_BUTTON.r * 2, TV_BOX.h),
  };
  const knobHint = "Esse botão muda de canal. Dizem que tem um canal que não devia existir...";
  const zoomHint = "Chega mais perto da TV.";

  return (
    <div className="absolute" style={{ ...spotStyle(spot), zIndex: 12 }}>
      <div className="pointer-events-none absolute inset-0">
        <TvSet glow />
      </div>
      <TvScreen {...screen} screenRef={screenRef} onZoom={zoomed ? undefined : onZoom} style={{ ...screenStyle, visibility: zoomed ? "hidden" : undefined }} />
      <button
        type="button"
        onClick={onKnob}
        aria-label={`Mudar de canal. Canal atual: ${info.number}, ${info.name}`}
        onPointerEnter={(e) => {
          if (e.pointerType !== "mouse") return;
          onHoverSound?.();
          onHint?.(knobHint, spot);
        }}
        onPointerLeave={(e) => e.pointerType === "mouse" && onHint?.(null, spot)}
        onFocus={() => onHint?.(knobHint, spot)}
        onBlur={() => onHint?.(null, spot)}
        className="absolute z-10 cursor-pointer rounded-full [--focus:var(--color-sun)] transition-transform duration-150 hover:scale-110 active:scale-95"
        style={knobStyle}
      >
        <TvKnob angle={knobAngle} />
      </button>
      <button
        ref={zoomButtonRef}
        type="button"
        onClick={onZoom}
        aria-label="Ver a TV de perto"
        aria-haspopup="dialog"
        onPointerEnter={(e) => {
          if (e.pointerType !== "mouse") return;
          onHoverSound?.();
          onHint?.(zoomHint, spot);
        }}
        onPointerLeave={(e) => e.pointerType === "mouse" && onHint?.(null, spot)}
        onFocus={() => onHint?.(zoomHint, spot)}
        onBlur={() => onHint?.(null, spot)}
        className="absolute z-10 grid cursor-zoom-in place-items-center rounded-full border-[2.5px] border-ink bg-cream text-ink shadow-[0_2px_0_0_var(--color-ink)] [--focus:var(--color-sun)] transition-transform duration-150 hover:scale-110 active:scale-95"
        style={zoomStyle}
      >
        <ZoomIcon className="size-[62%]" />
      </button>
    </div>
  );
}
