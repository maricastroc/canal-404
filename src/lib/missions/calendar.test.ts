import { describe, expect, it } from "vitest";
import { acceptsResults, addDays, dayEnd, dayStart, daysBetween, isDayKey, missionDay, MISSION_GRACE_MS } from "./calendar";

describe("mission calendar in America/Fortaleza", () => {
  it("changes the day at midnight in Fortaleza, not in UTC", () => {
    expect(missionDay(new Date("2026-11-05T02:59:59.999Z"))).toBe("2026-11-04");
    expect(missionDay(new Date("2026-11-05T03:00:00.000Z"))).toBe("2026-11-05");
    expect(missionDay(new Date("2026-11-05T00:30:00.000Z"))).toBe("2026-11-04");
  });

  it("turns the year and leap days over at the right time", () => {
    expect(missionDay(new Date("2027-01-01T02:59:59.000Z"))).toBe("2026-12-31");
    expect(missionDay(new Date("2027-01-01T03:00:00.000Z"))).toBe("2027-01-01");
    expect(missionDay(new Date("2028-02-29T12:00:00.000Z"))).toBe("2028-02-29");
  });

  it("gives the exact start and end of a mission day", () => {
    expect(dayStart("2026-11-05").toISOString()).toBe("2026-11-05T03:00:00.000Z");
    expect(dayEnd("2026-11-05").toISOString()).toBe("2026-11-06T03:00:00.000Z");
    expect(dayEnd("2026-12-31").toISOString()).toBe("2027-01-01T03:00:00.000Z");
  });

  it("walks the calendar across months and years", () => {
    expect(addDays("2026-11-30", 1)).toBe("2026-12-01");
    expect(addDays("2027-01-01", -1)).toBe("2026-12-31");
    expect(addDays("2028-02-28", 1)).toBe("2028-02-29");
    expect(daysBetween("2026-12-30", "2027-01-02")).toBe(3);
  });

  it("validates day keys", () => {
    expect(isDayKey("2026-11-04")).toBe(true);
    expect(isDayKey("2026-02-30")).toBe(false);
    expect(isDayKey("2026-1-4")).toBe(false);
    expect(isDayKey("2026-11-04T00:00")).toBe(false);
    expect(isDayKey(20261104)).toBe(false);
  });

  it("accepts results for a day until one hour after it ends", () => {
    const end = dayEnd("2026-11-04").getTime();
    expect(acceptsResults("2026-11-04", new Date(end - 1))).toBe(true);
    expect(acceptsResults("2026-11-04", new Date(end + MISSION_GRACE_MS))).toBe(true);
    expect(acceptsResults("2026-11-04", new Date(end + MISSION_GRACE_MS + 1))).toBe(false);
    expect(acceptsResults("2026-11-04", new Date(dayStart("2026-11-04").getTime() - 1))).toBe(false);
  });
});
