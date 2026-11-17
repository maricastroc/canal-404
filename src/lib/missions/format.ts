import { dateFormat, formatNumber } from "@/i18n/format";
import type { Locale } from "@/i18n/locales";
import { formatBest, ordinal } from "@/lib/competition/format";
import type { GameSlug } from "@/lib/competition/boards";
import { MISSION_TIME_ZONE } from "./calendar";

export function formatMissionBest(game: GameSlug, metrics: number[], locale: Locale) {
  return formatBest(game, metrics, locale);
}

export function formatPlace(position: number, total: number, locale: Locale) {
  return `${ordinal(position, locale)} ${locale === "en" ? "of" : "de"} ${formatNumber(total, locale)}`;
}

export function clock(ms: number) {
  const total = Math.max(0, Math.floor(ms / 1000));
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  return [h, m, s].map((n) => String(n).padStart(2, "0")).join(":");
}

export function spokenClock(ms: number, locale: Locale) {
  const minutes = Math.max(0, Math.ceil(ms / 60_000));
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (locale === "en") {
    if (h === 0) return m <= 1 ? "less than 1 minute" : `${m} minutes`;
    return m === 0 ? `${h} ${h === 1 ? "hour" : "hours"}` : `${h} ${h === 1 ? "hour" : "hours"} and ${m} min`;
  }
  if (h === 0) return m <= 1 ? "menos de 1 minuto" : `${m} minutos`;
  return m === 0 ? `${h} ${h === 1 ? "hora" : "horas"}` : `${h} ${h === 1 ? "hora" : "horas"} e ${m} min`;
}

function utc(day: string) {
  const [y, m, d] = day.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d, 12));
}

export function dayStamp(day: string, locale: Locale) {
  return {
    weekday: dateFormat(locale, { weekday: "short", timeZone: "UTC" }).format(utc(day)).replace(".", "").toUpperCase(),
    date: dateFormat(locale, { day: "2-digit", month: "2-digit", timeZone: "UTC" }).format(utc(day)),
  };
}

export function dayName(day: string, locale: Locale) {
  return dateFormat(locale, { weekday: "long", day: "numeric", month: "long", timeZone: "UTC" }).format(utc(day));
}

export function hourOf(iso: string, locale: Locale) {
  return dateFormat(locale, { hour: "2-digit", minute: "2-digit", timeZone: MISSION_TIME_ZONE }).format(new Date(iso));
}
