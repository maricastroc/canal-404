import { describe, expect, it } from "vitest";
import { addDays } from "./calendar";
import { pickMission } from "./select";

function days(from: string, count: number) {
  return Array.from({ length: count }, (_, i) => addDays(from, i));
}

const PUBLISHED_BEFORE_FIVE_GAMES: Record<string, string> = {
  "2026-11-01": "lab-juice-fast",
  "2026-11-02": "food-two-stars",
  "2026-11-03": "lab-pixel-fast",
  "2026-11-04": "food-spotless",
  "2026-11-05": "lab-juice-fan-and-ramp",
  "2026-11-06": "food-two-stars",
  "2026-11-07": "lab-pixel-fast",
  "2026-11-08": "food-right-on-time",
  "2026-11-09": "lab-finale-every-part",
  "2026-11-10": "food-streak-eight",
  "2026-11-11": "lab-remote-three-parts",
  "2026-11-12": "food-lunch-lady",
  "2026-11-13": "lab-pixel-two-ramps",
  "2026-11-14": "food-right-on-time",
  "2026-11-15": "lab-juice-fast",
};

describe("daily mission selection", () => {
  it("keeps every day before the five-game rotation exactly as it was scheduled", () => {
    for (const [day, key] of Object.entries(PUBLISHED_BEFORE_FIVE_GAMES)) expect(pickMission(day).key, day).toBe(key);
  });

  it("never repeats a mission or a game on consecutive days", () => {
    const keys = days("2026-01-01", 1100).map((d) => pickMission(d));
    for (let i = 1; i < keys.length; i += 1) {
      expect(keys[i].key, addDays("2026-01-01", i)).not.toBe(keys[i - 1].key);
      expect(keys[i].game).not.toBe(keys[i - 1].game);
    }
  });
});
