import { act, render } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { BroadcastProvider } from "./broadcast";
import { RESORT_GLITCH, RESORT_LOOP, RESORT_SHOTS, resortTape } from "./ResortTape";

function playFrom(ms: number) {
  const { Screen } = resortTape;
  const since = performance.now() - ms;
  return render(
    <BroadcastProvider value={{ since, take: 0, zoomed: false, replay: () => {} }}>
      <Screen />
    </BroadcastProvider>,
  );
}

const shot = (view: ReturnType<typeof render>) => Number(view.container.querySelector("[data-shot]")?.getAttribute("data-shot"));
const stamp = (view: ReturnType<typeof render>) => view.container.querySelector("[data-stamp]")?.getAttribute("data-stamp");
const strange = (view: ReturnType<typeof render>) => view.container.querySelector("[data-strange]") !== null;

describe("resort program", () => {
  it("loops four shots with the strange moment inside the hotel shot", () => {
    expect(resortTape.loop).toBe(RESORT_LOOP);
    expect(resortTape.length).toBeUndefined();
    expect(RESORT_SHOTS).toHaveLength(4);
    RESORT_SHOTS.forEach((s, i) => {
      if (i) expect(s.at).toBeGreaterThan(RESORT_SHOTS[i - 1].at);
      expect(s.line.startsWith("— ")).toBe(true);
    });
    expect(RESORT_GLITCH.from).toBeGreaterThan(RESORT_SHOTS[1].at);
    expect(RESORT_GLITCH.to).toBeLessThan(RESORT_SHOTS[2].at);
  });

  it("makes the room mascot react once, at the strange moment", () => {
    expect(resortTape.cues).toEqual([{ at: RESORT_GLITCH.from, mascot: { expression: "confused", line: expect.any(String) }, sound: "static" }]);
  });
});

describe("resort screen", () => {
  beforeEach(() => {
    vi.useFakeTimers({ toFake: ["setTimeout", "clearTimeout", "performance"] });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("opens on the beach with the camcorder date ticking", () => {
    const view = playFrom(1200);
    expect(shot(view)).toBe(0);
    expect(view.container).toHaveTextContent(RESORT_SHOTS[0].line);
    expect(stamp(view)).toBe("17 JUL 2004 14:03:13");
    act(() => vi.advanceTimersByTime(1000));
    expect(stamp(view)).toBe("17 JUL 2004 14:03:14");
  });

  it("jumps the clock at each cut, like a home video", () => {
    const view = playFrom(RESORT_SHOTS[3].at + 100);
    expect(shot(view)).toBe(3);
    expect(stamp(view)).toBe("17 JUL 2004 14:09:31");
  });

  it("shows the other date and the 404 windows only during the strange moment", () => {
    const view = playFrom(RESORT_GLITCH.from - 50);
    expect(strange(view)).toBe(false);
    expect(view.container.querySelectorAll("text")).toHaveLength(0);
    act(() => vi.advanceTimersByTime(100));
    expect(strange(view)).toBe(true);
    expect(stamp(view)).toBe("04 DEZ 2004 04:04:04");
    expect(Array.from(view.container.querySelectorAll("text")).filter((t) => t.textContent === "404")).toHaveLength(9);
    act(() => vi.advanceTimersByTime(RESORT_GLITCH.to - RESORT_GLITCH.from));
    expect(strange(view)).toBe(false);
    expect(stamp(view)?.startsWith("17 JUL 2004")).toBe(true);
  });

  it("joins the same shot and second when it remounts or loops", () => {
    const at = RESORT_SHOTS[2].at + 1500;
    const first = playFrom(at);
    const before = { shot: shot(first), stamp: stamp(first) };
    first.unmount();
    const again = playFrom(at);
    expect({ shot: shot(again), stamp: stamp(again) }).toEqual(before);
    again.unmount();
    const looped = playFrom(at + RESORT_LOOP);
    expect({ shot: shot(looped), stamp: stamp(looped) }).toEqual(before);
    expect(looped.container).toHaveTextContent("DEZ 2004");
  });
});
