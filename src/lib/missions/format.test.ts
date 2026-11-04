import { describe, expect, it } from "vitest";
import { clock, dayName, dayStamp, formatMissionBest, formatPlace, hourOf, spokenClock } from "./format";

describe("mission formatting", () => {
  it("shows the countdown like a VCR clock and says it in words", () => {
    expect(clock(9 * 3600_000 + 13 * 60_000 + 59_000)).toBe("09:13:59");
    expect(clock(-5)).toBe("00:00:00");
    expect(spokenClock(9 * 3600_000 + 14 * 60_000)).toBe("9 horas e 14 min");
    expect(spokenClock(3600_000)).toBe("1 hora");
    expect(spokenClock(30_000)).toBe("menos de 1 minuto");
    expect(spokenClock(5 * 60_000)).toBe("5 minutos");
  });

  it("prints the mission day without depending on the browser's time zone", () => {
    expect(dayStamp("2026-11-04")).toEqual({ weekday: "QUA", date: "04/11" });
    expect(dayName("2026-11-04")).toBe("quarta-feira, 4 de novembro");
  });

  it("prints the time of day in Fortaleza", () => {
    expect(hourOf("2026-11-05T02:30:00.000Z")).toBe("23:30");
  });

  it("shows machine time for the Laboratório and the board metrics for other games", () => {
    expect(formatMissionBest("bad-ideas-lab", [1, 245])).toBe("1 peça · 4,08 s");
    expect(formatMissionBest("food-fight", [8200, 0, 9])).toBe("8.200 pts · 0 pudins levados");
    expect(formatPlace(3, 1204)).toBe("3º de 1.204");
  });
});
