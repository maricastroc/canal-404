"use client";

import Link from "@/i18n/Link";
import { MissionIcon } from "@/components/art/Icons";
import { useCopy, useLocale } from "@/i18n/client";
import { localized } from "@/i18n/copy";
import { useSound } from "@/lib/audio/hooks";
import { useMissionToday } from "@/lib/missions/hooks";
import { missionText } from "@/lib/missions/text";
import { missionPlace, StateChip } from "./parts";

const COPY = localized({
  "pt-BR": { label: "Missão 404 do dia" },
  en: { label: "Mission 404 of the Day" },
});

export function MissionTeaser() {
  const feed = useMissionToday();
  const { play, hover } = useSound();
  const copy = useCopy(COPY);
  const locale = useLocale();
  if (feed.status !== "ready" || !feed.data) return null;
  const { mission, you } = feed.data;
  const place = missionPlace(mission, locale);
  const text = missionText(mission, locale);
  return (
    <Link
      href="/mission"
      onPointerEnter={(e) => e.pointerType === "mouse" && hover()}
      onClick={() => play("click")}
      className="press on-dark mx-auto mt-6 flex max-w-3xl -rotate-[0.6deg] flex-wrap items-center gap-3 rounded-xl border-[3px] border-ink bg-plum-800 p-2 pr-3 text-cream shadow-[var(--shadow-ink)] sm:flex-nowrap"
    >
      <span className="grid size-12 shrink-0 place-items-center rounded-lg border-[3px] border-ink bg-tomato text-ink">
        <MissionIcon className="size-7" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block font-display text-xs uppercase tracking-widest text-sun">
          {copy.label} · {place.game}
        </span>
        <span className="block truncate font-display text-xl uppercase leading-tight tracking-wide">{text.title}</span>
        <span className="block truncate text-sm font-semibold text-cream-2">{text.objective}</span>
      </span>
      <StateChip state={you?.state ?? "new"} />
    </Link>
  );
}
