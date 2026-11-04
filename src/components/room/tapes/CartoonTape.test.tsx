import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { BroadcastProvider } from "./broadcast";
import { BEATS, CARTOON_LOOP, cartoonTape } from "./CartoonTape";

function playFrom(ms: number) {
  const { Screen } = cartoonTape;
  return render(
    <BroadcastProvider value={{ since: performance.now() - ms, take: 0, zoomed: false, replay: () => {} }}>
      <Screen />
    </BroadcastProvider>,
  );
}

describe("cartoon tape", () => {
  it("fits the whole gag and its cues in one short loop", () => {
    expect(CARTOON_LOOP).toBeGreaterThanOrEqual(8000);
    expect(CARTOON_LOOP).toBeLessThanOrEqual(10000);
    BEATS.forEach((beat, i) => expect(beat.at).toBeGreaterThan(i ? BEATS[i - 1].at : -1));
    expect(BEATS.at(-1)!.at).toBeLessThan(CARTOON_LOOP);
    for (const cue of cartoonTape.cues ?? []) expect(cue.at).toBeLessThan(CARTOON_LOOP);
  });

  it("joins the episode on the current beat instead of starting over", () => {
    const sneeze = BEATS.find((beat) => beat.shot === "sneeze")!;
    playFrom(sneeze.at + 200);
    expect(screen.getByText("ATCHIM!")).toBeInTheDocument();
    expect(screen.queryByText(BEATS[0].line!)).not.toBeInTheDocument();
  });

  it("loops back to the denial after the aftermath", () => {
    playFrom(CARTOON_LOOP + 300);
    expect(screen.getByText(BEATS[0].line!)).toBeInTheDocument();
    expect(screen.queryByText("ATCHIM!")).not.toBeInTheDocument();
  });
});
