"use client";

import Link from "@/i18n/Link";
import { LockedBadge, StarBadge } from "@/components/art/Badges";
import { useCopy, useLocale } from "@/i18n/client";
import { localized } from "@/i18n/copy";
import { dateFormat } from "@/i18n/format";
import { missionAchievements } from "@/lib/missions/achievements";
import { MISSION_TIME_ZONE } from "@/lib/missions/calendar";
import { dayStamp } from "@/lib/missions/format";
import { useMissionToday } from "@/lib/missions/hooks";

const COPY = localized({
  "pt-BR": {
    unconfigured: "Os selos chegam quando o placar do canal estrear.",
    notJoined: "Tire a carteirinha e cumpra a Missão 404 do Dia para ganhar selos.",
    offline: "Sem sinal do canal agora. Seus selos continuam guardados.",
    title: "Selos da Missão 404",
    intro: "Cumpra a Missão 404 do Dia e cole os selos na sua carteirinha.",
    today: "Ver a missão de hoje",
    on: (date: string) => `Em ${date}`,
    missionOf: (date: string) => ` · missão de ${date}`,
    earned: "Conquistado.",
    locked: "Ainda não conquistado.",
  },
  en: {
    unconfigured: "Stamps arrive when the channel's board premieres.",
    notJoined: "Get your membership card and complete the Mission 404 of the Day to earn stamps.",
    offline: "No signal from the channel right now. Your stamps are still saved.",
    title: "Mission 404 stamps",
    intro: "Complete the Mission 404 of the Day and stick the stamps on your membership card.",
    today: "See today's mission",
    on: (date: string) => `On ${date}`,
    missionOf: (date: string) => ` · mission from ${date}`,
    earned: "Earned.",
    locked: "Not earned yet.",
  },
});

export function MissionAchievements() {
  const copy = useCopy(COPY);
  const locale = useLocale();
  const feed = useMissionToday();
  const joined = Boolean(feed.competition.player);
  const unlocked = feed.data?.you?.achievements ?? [];
  const count = unlocked.length;
  const achievements = missionAchievements(locale);
  const dates = dateFormat(locale, { day: "2-digit", month: "2-digit", year: "numeric", timeZone: MISSION_TIME_ZONE });
  const note = feed.status === "unconfigured" ? copy.unconfigured : !joined ? copy.notJoined : feed.status === "offline" ? copy.offline : null;
  return (
    <div className="mt-8" data-testid="mission-achievements">
      <div className="flex flex-wrap items-end justify-between gap-2">
        <h3 className="font-display text-2xl uppercase leading-none tracking-wide text-cream [text-shadow:2px_3px_0_var(--color-ink)]">{copy.title}</h3>
        <p className="tag-label rounded-lg border-[3px] border-ink bg-lime px-3 py-1 text-sm text-ink shadow-[var(--shadow-ink-sm)]">
          {count}/{achievements.length}
        </p>
      </div>
      <p className="copy mt-2 text-cream-2">
        {copy.intro}{" "}
        <Link href="/mission" className="underline decoration-2 underline-offset-2">
          {copy.today}
        </Link>
        .
      </p>
      {note ? <p className="copy mt-3 rounded-lg border-[3px] border-ink bg-sun px-3 py-1.5 font-semibold text-ink">{note}</p> : null}
      <ul className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {achievements.map((a) => {
          const got = unlocked.find((u) => u.id === a.id);
          return (
            <li key={a.id} className={`flex items-center gap-4 rounded-2xl border-[3px] border-ink p-4 shadow-[var(--shadow-ink)] ${got ? "paper" : "bg-plum-800 text-cream"}`}>
              <div className="w-14 shrink-0">{got ? <StarBadge color={a.color} className="w-full" /> : <LockedBadge className="w-full" />}</div>
              <div className="min-w-0">
                <p className={`card-title ${got ? "text-ink" : "text-plum-300"}`}>{a.title}</p>
                <p className={`copy-sm mt-1 ${got ? "text-ink-soft" : "text-cream-2"}`}>{got ? a.description : a.hint}</p>
                {got ? (
                  <p className="tag-label mt-1.5 text-plum-600">
                    {copy.on(dates.format(new Date(got.unlockedAt)))}
                    {got.day && a.id === "mission-champion" ? copy.missionOf(dayStamp(got.day, locale).date) : ""}
                  </p>
                ) : null}
                <span className="sr-only">{got ? copy.earned : copy.locked}</span>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
