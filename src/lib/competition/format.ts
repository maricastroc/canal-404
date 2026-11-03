import { BOARD_META, type GameSlug, type Metric } from "./boards";

export function formatDuration(ms: number) {
  const total = Math.max(0, Math.round(ms / 1000));
  const hours = Math.floor(total / 3600);
  const minutes = Math.floor((total % 3600) / 60);
  const seconds = total % 60;
  if (hours) return `${hours}h ${String(minutes).padStart(2, "0")}min`;
  if (minutes) return `${minutes}min ${String(seconds).padStart(2, "0")}s`;
  return `${seconds}s`;
}

export function formatMetric(metric: Metric, value: number) {
  if (metric.unit === "points") return `${value.toLocaleString("pt-BR")} pts`;
  if (metric.unit === "time") return formatDuration(value);
  const [one, many] = metric.noun ?? ["", ""];
  return `${value.toLocaleString("pt-BR")} ${value === 1 ? one : many}`.trim();
}

export function formatBest(game: GameSlug, metrics: number[], count = 2) {
  return BOARD_META[game].metrics
    .slice(0, count)
    .map((metric, i) => formatMetric(metric, metrics[i] ?? 0))
    .join(" · ");
}

export function ordinal(position: number) {
  return `${position.toLocaleString("pt-BR")}º`;
}
