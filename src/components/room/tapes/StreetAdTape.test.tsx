import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { BroadcastProvider } from "./broadcast";
import { AD_FRAMES, AD_LOOP, streetAdTape } from "./StreetAdTape";

function playFrom(ms: number) {
  const { Screen } = streetAdTape;
  return render(
    <BroadcastProvider value={{ since: performance.now() - ms, take: 0, zoomed: false, replay: () => {} }}>
      <Screen />
    </BroadcastProvider>,
  );
}

describe("street ad tape", () => {
  it("stays a short commercial that ends on its longest frame, the call to play", () => {
    expect(AD_LOOP).toBeGreaterThanOrEqual(8000);
    expect(AD_LOOP).toBeLessThanOrEqual(10000);
    const lengths = AD_FRAMES.map((frame, i) => (AD_FRAMES[i + 1]?.at ?? AD_LOOP) - frame.at);
    expect(Math.max(...lengths)).toBe(lengths.at(-1));
    for (const cue of streetAdTape.cues ?? []) expect(cue.at).toBeLessThan(AD_LOOP);
  });

  it("joins the commercial on the current frame instead of starting over", () => {
    playFrom(AD_FRAMES.at(-1)!.at + 900);
    expect(screen.getByText("JOGUE JÁ!")).toBeInTheDocument();
    expect(screen.queryByText("CALÇADA?")).not.toBeInTheDocument();
  });

  it("keeps the fine print on the order frame", () => {
    playFrom(AD_FRAMES[3].at + 600);
    expect(screen.getByText("PEÇA JÁ!*")).toBeInTheDocument();
    expect(screen.getByText("*Peça pra sua mãe. Estilingue vendido separadamente.")).toBeInTheDocument();
  });
});
