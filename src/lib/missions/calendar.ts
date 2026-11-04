export const MISSION_TIME_ZONE = "America/Fortaleza";

export const MISSION_GRACE_MS = 60 * 60 * 1000;

const DAY_MS = 86_400_000;

const DAY_KEY = /^(\d{4})-(\d{2})-(\d{2})$/;

const dateParts = new Intl.DateTimeFormat("en-US", { timeZone: MISSION_TIME_ZONE, year: "numeric", month: "2-digit", day: "2-digit" });

const offsetFormat = new Intl.DateTimeFormat("en-US", { timeZone: MISSION_TIME_ZONE, timeZoneName: "longOffset" });

function part(parts: Intl.DateTimeFormatPart[], type: Intl.DateTimeFormatPartTypes) {
  return parts.find((p) => p.type === type)?.value ?? "";
}

export function isDayKey(value: unknown): value is string {
  if (typeof value !== "string") return false;
  const match = DAY_KEY.exec(value);
  if (!match) return false;
  const [, y, m, d] = match.map(Number);
  const date = new Date(Date.UTC(y, m - 1, d));
  return date.getUTCFullYear() === y && date.getUTCMonth() === m - 1 && date.getUTCDate() === d;
}

export function missionDay(now: Date) {
  const parts = dateParts.formatToParts(now);
  return `${part(parts, "year")}-${part(parts, "month")}-${part(parts, "day")}`;
}

function utcMidnight(day: string) {
  const [y, m, d] = day.split("-").map(Number);
  return Date.UTC(y, m - 1, d);
}

function offsetMs(at: number) {
  const name = part(offsetFormat.formatToParts(new Date(at)), "timeZoneName");
  const match = /GMT([+-])(\d{2}):(\d{2})/.exec(name);
  if (!match) return 0;
  const minutes = Number(match[2]) * 60 + Number(match[3]);
  return (match[1] === "-" ? -1 : 1) * minutes * 60_000;
}

export function dayStart(day: string) {
  const guess = utcMidnight(day);
  return new Date(guess - offsetMs(guess - offsetMs(guess)));
}

export function addDays(day: string, amount: number) {
  const date = new Date(utcMidnight(day) + amount * DAY_MS);
  return date.toISOString().slice(0, 10);
}

export function dayEnd(day: string) {
  return dayStart(addDays(day, 1));
}

export function dayNumber(day: string) {
  return Math.round(utcMidnight(day) / DAY_MS);
}

export function daysBetween(from: string, to: string) {
  return dayNumber(to) - dayNumber(from);
}

export function acceptsResults(day: string, now: Date) {
  const time = now.getTime();
  return time >= dayStart(day).getTime() && time <= dayEnd(day).getTime() + MISSION_GRACE_MS;
}
