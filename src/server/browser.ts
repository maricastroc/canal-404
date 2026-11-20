type Engine = "blink" | "webkit" | "gecko" | "other";

function major(userAgent: string, pattern: RegExp) {
  const value = Number(pattern.exec(userAgent)?.[1]);
  return Number.isInteger(value) && value > 0 && value < 1000 ? value : 0;
}

function engineOf(userAgent: string): { engine: Engine; version: number } {
  if (/\b(iPhone|iPad|iPod)\b/.test(userAgent)) {
    return { engine: "webkit", version: major(userAgent, /\bVersion\/(\d+)/) || major(userAgent, /\bOS (\d+)_/) };
  }
  if (/\bFirefox\/\d/.test(userAgent)) return { engine: "gecko", version: major(userAgent, /\bFirefox\/(\d+)/) };
  if (/\b(Chrome|Chromium)\/\d/.test(userAgent)) return { engine: "blink", version: major(userAgent, /\b(?:Chrome|Chromium)\/(\d+)/) };
  if (/\bAppleWebKit\/\d/.test(userAgent)) return { engine: "webkit", version: major(userAgent, /\bVersion\/(\d+)/) };
  return { engine: "other", version: 0 };
}

export function browserLabel(userAgent: string | null) {
  const text = userAgent?.slice(0, 512) ?? "";
  const { engine, version } = engineOf(text);
  const mobile = /\b(iPhone|iPad|iPod|Android)\b|Mobi/.test(text);
  return `${engine}-${version}-${mobile ? "mobile" : "desktop"}`;
}
