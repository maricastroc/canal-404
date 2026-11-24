import { dateFormat, formatNumber, ordinal as localOrdinal } from "@/i18n/format";
import type { Locale } from "@/i18n/locales";
import { boardMeta, type GameSlug, type Metric } from "./boards";

export function formatDuration(ms: number) {
  const total = Math.max(0, Math.round(ms / 1000));
  const hours = Math.floor(total / 3600);
  const minutes = Math.floor((total % 3600) / 60);
  const seconds = total % 60;
  if (hours) return `${hours}h ${String(minutes).padStart(2, "0")}min`;
  if (minutes) return `${minutes}min ${String(seconds).padStart(2, "0")}s`;
  return `${seconds}s`;
}

export function machineSeconds(steps: number, locale: Locale) {
  return `${formatNumber(steps / 60, locale, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} s`;
}

export function formatMetric(metric: Metric, value: number, locale: Locale) {
  if (metric.unit === "points") return `${formatNumber(value, locale)} pts`;
  if (metric.unit === "time") return formatDuration(value);
  if (metric.unit === "steps") return machineSeconds(value, locale);
  if (metric.unit === "racetime") return `${formatNumber(value / 1000, locale, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} s`;
  const [one, many] = metric.noun ?? ["", ""];
  return `${formatNumber(value, locale)} ${value === 1 ? one : many}`.trim();
}

export function formatMetricValue(metric: Metric, value: number, locale: Locale) {
  if (metric.unit === "points" || metric.unit === "count") return formatNumber(value, locale);
  return formatMetric(metric, value, locale);
}

export function formatMetricLong(metric: Metric, value: number, locale: Locale) {
  if (metric.unit !== "points") return formatMetric(metric, value, locale);
  const words = locale === "en" ? ["point", "points"] : ["ponto", "pontos"];
  return `${formatNumber(value, locale)} ${value === 1 ? words[0] : words[1]}`;
}

export function formatBest(game: GameSlug, metrics: number[], locale: Locale, count = 2) {
  return boardMeta(game, locale)
    .metrics.slice(0, count)
    .map((metric, i) => formatMetric(metric, metrics[i] ?? 0, locale))
    .join(" · ");
}

export function ordinal(position: number, locale: Locale) {
  return localOrdinal(position, locale);
}

export function finishDate(iso: string, locale: Locale) {
  return dateFormat(locale, { day: "numeric", month: "long", year: "numeric" }).format(new Date(iso));
}
