type Value = string | number | boolean;
type Props = Record<string, Value>;

export type TelemetryEvent =
  | { name: "game_start"; game: string; level: string; attempt: number; fresh: boolean }
  | { name: "game_finish"; game: string; level: string; attempt: number; won: boolean; score: number; stars: number; seconds: number }
  | { name: "game_abandon"; game: string; level: string; attempt: number; seconds: number; paused: boolean }
  | { name: "game_load_error"; game: string; message: string }
  | { name: "client_error"; source: string; message: string };

type Sink = (name: string, props: Props) => void;

declare global {
  interface Window {
    umami?: { track: (name: string, data?: Props) => void };
  }
}

const MAX_TEXT = 120;
const MAX_ERRORS = 8;
const sinks = new Set<Sink>();
const reported = new Set<string>();

export function addTelemetrySink(sink: Sink) {
  sinks.add(sink);
  return () => {
    sinks.delete(sink);
  };
}

function clean(props: Record<string, unknown>): Props {
  const out: Props = {};
  for (const [key, value] of Object.entries(props)) {
    if (typeof value === "string") out[key] = value.slice(0, MAX_TEXT);
    else if (typeof value === "number" && Number.isFinite(value)) out[key] = Math.round(value);
    else if (typeof value === "boolean") out[key] = value;
  }
  return out;
}

export function track(event: TelemetryEvent) {
  if (typeof window === "undefined") return;
  const { name, ...rest } = event;
  const props = clean(rest);
  for (const sink of sinks) {
    try {
      sink(name, props);
    } catch {}
  }
  try {
    window.umami?.track(name, props);
  } catch {}
}

export function errorMessage(error: unknown) {
  if (error instanceof Error) return `${error.name}: ${error.message}`;
  if (typeof error === "string") return error;
  return "Erro desconhecido";
}

export function reportError(source: string, error: unknown) {
  const message = errorMessage(error).slice(0, MAX_TEXT);
  const key = `${source}|${message}`;
  if (reported.has(key) || reported.size >= MAX_ERRORS) return;
  reported.add(key);
  track({ name: "client_error", source, message });
}

export function isStaleChunkError(error: unknown) {
  return /ChunkLoadError|Loading chunk|dynamically imported module|Importing a module script failed/i.test(errorMessage(error));
}

export function resetTelemetryForTests() {
  sinks.clear();
  reported.clear();
}
