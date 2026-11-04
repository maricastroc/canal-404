import { formatBest, ordinal } from "@/lib/competition/format";
import type { GameSlug } from "@/lib/competition/boards";
import { MISSION_TIME_ZONE } from "./calendar";
import { machineSeconds } from "./goals";

export function formatMissionBest(game: GameSlug, metrics: number[]) {
  if (game === "bad-ideas-lab") {
    const parts = metrics[0] ?? 0;
    return `${parts} ${parts === 1 ? "peça" : "peças"} · ${machineSeconds(metrics[1] ?? 0)}`;
  }
  return formatBest(game, metrics);
}

export function formatPlace(position: number, total: number) {
  return `${ordinal(position)} de ${total.toLocaleString("pt-BR")}`;
}

export function clock(ms: number) {
  const total = Math.max(0, Math.floor(ms / 1000));
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  return [h, m, s].map((n) => String(n).padStart(2, "0")).join(":");
}

export function spokenClock(ms: number) {
  const minutes = Math.max(0, Math.ceil(ms / 60_000));
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h === 0) return m <= 1 ? "menos de 1 minuto" : `${m} minutos`;
  return m === 0 ? `${h} ${h === 1 ? "hora" : "horas"}` : `${h} ${h === 1 ? "hora" : "horas"} e ${m} min`;
}

const weekday = new Intl.DateTimeFormat("pt-BR", { weekday: "short", timeZone: "UTC" });
const longDate = new Intl.DateTimeFormat("pt-BR", { weekday: "long", day: "numeric", month: "long", timeZone: "UTC" });
const shortDate = new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "2-digit", timeZone: "UTC" });
const timeOfDay = new Intl.DateTimeFormat("pt-BR", { hour: "2-digit", minute: "2-digit", timeZone: MISSION_TIME_ZONE });

function utc(day: string) {
  const [y, m, d] = day.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d, 12));
}

export function dayStamp(day: string) {
  return { weekday: weekday.format(utc(day)).replace(".", "").toUpperCase(), date: shortDate.format(utc(day)) };
}

export function dayName(day: string) {
  return longDate.format(utc(day));
}

export function hourOf(iso: string) {
  return timeOfDay.format(new Date(iso));
}
