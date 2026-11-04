import { act, render } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { BroadcastProvider } from "./broadcast";
import { FORBIDDEN_BEATS, FORBIDDEN_LENGTH, FORBIDDEN_MESSAGE, forbiddenTape } from "./ForbiddenTape";

type BeatName = keyof typeof FORBIDDEN_BEATS;

function playFrom(ms: number) {
  const { Screen } = forbiddenTape;
  const since = performance.now() - ms;
  return render(
    <BroadcastProvider value={{ since, take: 0, zoomed: false, replay: () => {} }}>
      <Screen />
    </BroadcastProvider>,
  );
}

const beat = (view: ReturnType<typeof render>) => Object.keys(FORBIDDEN_BEATS)[Number(view.container.querySelector("[data-beat]")?.getAttribute("data-beat"))] as BeatName;

describe("forbidden program", () => {
  it("is a short sequence that plays once", () => {
    expect(forbiddenTape.length).toBe(FORBIDDEN_LENGTH);
    expect(forbiddenTape.loop).toBeUndefined();
    expect(FORBIDDEN_LENGTH).toBeGreaterThanOrEqual(8000);
    expect(FORBIDDEN_LENGTH).toBeLessThanOrEqual(10000);
    const marks = Object.values(FORBIDDEN_BEATS);
    marks.forEach((at, i) => i && expect(at).toBeGreaterThan(marks[i - 1]));
    expect(marks.at(-1)).toBeLessThan(FORBIDDEN_LENGTH);
  });

  it("startles the room mascot, plays static at the cut and ejects itself at the end", () => {
    const cues = forbiddenTape.cues ?? [];
    expect(cues[0]).toEqual({ at: FORBIDDEN_BEATS.notice, mascot: { expression: "surprised" } });
    expect(cues[1]).toEqual({ at: FORBIDDEN_BEATS.noise, sound: "static" });
    const last = cues.at(-1)!;
    expect(last.at).toBe(FORBIDDEN_LENGTH);
    expect(last.eject).toBe(true);
    expect(Array.isArray(last.mascot?.line) && last.mascot.line.length).toBeGreaterThanOrEqual(2);
    expect(cues.filter((cue) => cue.eject)).toHaveLength(1);
  });
});

describe("forbidden screen", () => {
  beforeEach(() => {
    vi.useFakeTimers({ toFake: ["setTimeout", "clearTimeout", "performance"] });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("walks through the beats in order", () => {
    const view = playFrom(100);
    const seen: BeatName[] = [beat(view)];
    let now = 100;
    for (const at of Object.values(FORBIDDEN_BEATS).slice(1)) {
      act(() => vi.advanceTimersByTime(at + 50 - now));
      now = at + 50;
      seen.push(beat(view));
    }
    expect(seen).toEqual(Object.keys(FORBIDDEN_BEATS));
  });

  it("hits 0:04:04 on the tape counter the moment he notices the camera", () => {
    expect(playFrom(FORBIDDEN_BEATS.notice - 50).container).toHaveTextContent("SP 0:04:03");
    expect(playFrom(FORBIDDEN_BEATS.notice + 50).container).toHaveTextContent("SP 0:04:04");
  });

  it("ends on the message and keeps it after a remount", () => {
    const first = playFrom(FORBIDDEN_BEATS.card + 200);
    expect(beat(first)).toBe("card");
    expect(first.container).toHaveTextContent(FORBIDDEN_MESSAGE.join(""));
    first.unmount();
    const again = playFrom(FORBIDDEN_LENGTH + 500);
    expect(beat(again)).toBe("card");
    expect(again.container).toHaveTextContent(FORBIDDEN_MESSAGE.join(""));
  });
});
