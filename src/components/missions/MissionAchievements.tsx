"use client";

import Link from "next/link";
import { LockedBadge, StarBadge } from "@/components/art/Badges";
import { MISSION_ACHIEVEMENTS } from "@/lib/missions/achievements";
import { MISSION_TIME_ZONE } from "@/lib/missions/calendar";
import { dayStamp } from "@/lib/missions/format";
import { useMissionToday } from "@/lib/missions/hooks";

const dateFormat = new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric", timeZone: MISSION_TIME_ZONE });

export function MissionAchievements() {
  const feed = useMissionToday();
  const joined = Boolean(feed.competition.player);
  const unlocked = feed.data?.you?.achievements ?? [];
  const count = unlocked.length;
  const note =
    feed.status === "unconfigured"
      ? "Os selos chegam quando o placar do canal estrear."
      : !joined
        ? "Tire a carteirinha e cumpra a Missão 404 do Dia para ganhar selos."
        : feed.status === "offline"
          ? "Sem sinal do canal agora. Seus selos continuam guardados."
          : null;
  return (
    <div className="mt-8" data-testid="mission-achievements">
      <div className="flex flex-wrap items-end justify-between gap-2">
        <h3 className="font-display text-2xl uppercase tracking-wide text-cream [text-shadow:2px_3px_0_var(--color-ink)]">Selos da Missão 404</h3>
        <p className="rounded-lg border-[3px] border-ink bg-lime px-3 py-0.5 font-display text-sm uppercase tracking-wider text-ink shadow-[var(--shadow-ink-sm)]">
          {count}/{MISSION_ACHIEVEMENTS.length}
        </p>
      </div>
      <p className="mt-1 font-hand text-lg text-cream-2">
        Conferidos pelo canal e guardados na sua carteirinha.{" "}
        <Link href="/mission" className="underline decoration-2 underline-offset-2">
          Ver a missão de hoje
        </Link>
        .
      </p>
      {note ? <p className="mt-2 rounded-lg border-[3px] border-ink bg-sun px-3 py-1.5 font-semibold text-ink">{note}</p> : null}
      <ul className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {MISSION_ACHIEVEMENTS.map((a) => {
          const got = unlocked.find((u) => u.id === a.id);
          return (
            <li key={a.id} className={`flex items-center gap-3 rounded-2xl border-[3px] border-ink p-3 shadow-[var(--shadow-ink)] ${got ? "paper" : "bg-plum-800 text-cream"}`}>
              <div className="w-16 shrink-0">{got ? <StarBadge color={a.color} className="w-full" /> : <LockedBadge className="w-full" />}</div>
              <div className="min-w-0">
                <p className={`font-display text-lg uppercase leading-tight ${got ? "text-ink" : "text-plum-300"}`}>{a.title}</p>
                <p className={`text-sm leading-snug ${got ? "text-ink-soft" : "text-cream-2"}`}>{got ? a.description : <span className="font-hand text-base">Como ganhar: {a.hint}</span>}</p>
                {got ? (
                  <p className="mt-0.5 font-display text-[11px] uppercase tracking-wider text-plum-600">
                    Em {dateFormat.format(new Date(got.unlockedAt))}
                    {got.day && a.id === "mission-champion" ? ` · missão de ${dayStamp(got.day).date}` : ""}
                  </p>
                ) : null}
                <span className="sr-only">{got ? "Conquistado." : "Ainda não conquistado."}</span>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
