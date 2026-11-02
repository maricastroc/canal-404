import { afterEach, describe, expect, it, vi } from "vitest";
import { addTelemetrySink, isStaleChunkError, reportError, resetTelemetryForTests, track } from "./telemetry";

afterEach(() => {
  resetTelemetryForTests();
  delete window.umami;
});

describe("track", () => {
  it("sends the event to every sink and to Umami when it is loaded", () => {
    const sink = vi.fn();
    const umami = vi.fn();
    addTelemetrySink(sink);
    window.umami = { track: umami };
    track({ name: "game_start", game: "food-fight", level: "-", attempt: 1, fresh: false });
    const props = { game: "food-fight", level: "-", attempt: 1, fresh: false };
    expect(sink).toHaveBeenCalledWith("game_start", props);
    expect(umami).toHaveBeenCalledWith("game_start", props);
  });

  it("does nothing visible when no analytics is configured", () => {
    expect(() => track({ name: "game_load_error", game: "lab", message: "x" })).not.toThrow();
  });

  it("rounds numbers, drops invalid ones and shortens long text", () => {
    const sink = vi.fn();
    addTelemetrySink(sink);
    track({ name: "game_finish", game: "a".repeat(300), level: "pixel", attempt: 2, won: true, score: 1234.6, stars: 3, seconds: Number.NaN });
    const [, props] = sink.mock.calls[0];
    expect(props.game).toHaveLength(120);
    expect(props.score).toBe(1235);
    expect(props).not.toHaveProperty("seconds");
  });

  it("keeps working when a sink throws", () => {
    const after = vi.fn();
    addTelemetrySink(() => {
      throw new Error("boom");
    });
    addTelemetrySink(after);
    track({ name: "game_abandon", game: "x", level: "-", attempt: 1, seconds: 3, paused: true });
    expect(after).toHaveBeenCalled();
  });

  it("stops sending after the sink is removed", () => {
    const sink = vi.fn();
    const remove = addTelemetrySink(sink);
    remove();
    track({ name: "game_load_error", game: "x", message: "y" });
    expect(sink).not.toHaveBeenCalled();
  });
});

describe("reportError", () => {
  it("reports each error once with its type and message", () => {
    const sink = vi.fn();
    addTelemetrySink(sink);
    reportError("window", new TypeError("x is undefined"));
    reportError("window", new TypeError("x is undefined"));
    expect(sink).toHaveBeenCalledTimes(1);
    expect(sink).toHaveBeenCalledWith("client_error", { source: "window", message: "TypeError: x is undefined" });
  });

  it("caps how many errors a page can report", () => {
    const sink = vi.fn();
    addTelemetrySink(sink);
    for (let i = 0; i < 20; i += 1) reportError("window", `erro ${i}`);
    expect(sink.mock.calls.length).toBe(8);
  });
});

describe("isStaleChunkError", () => {
  it("recognizes failed code downloads after a new deploy", () => {
    expect(isStaleChunkError(new Error("Loading chunk 42 failed."))).toBe(true);
    expect(isStaleChunkError(new TypeError("Failed to fetch dynamically imported module: /x.js"))).toBe(true);
    expect(isStaleChunkError(new Error("jogo sem carregador"))).toBe(false);
  });
});
