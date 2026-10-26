import { describe, expect, it } from "vitest";
import { ACHIEVEMENTS, SECRETS, SECRET_IDS, achievementById, secretById } from "./definitions";

describe("progress definitions", () => {
  it("have unique ids", () => {
    expect(new Set(SECRET_IDS).size).toBe(SECRETS.length);
    expect(new Set(ACHIEVEMENTS.map((a) => a.id)).size).toBe(ACHIEVEMENTS.length);
  });

  it("give every secret and achievement a title, description and hint", () => {
    for (const item of [...SECRETS, ...ACHIEVEMENTS]) {
      expect(item.title, item.id).toBeTruthy();
      expect(item.description, item.id).toBeTruthy();
      expect(item.hint, item.id).toBeTruthy();
    }
  });

  it("look up items by id", () => {
    expect(secretById("cat")?.id).toBe("cat");
    expect(achievementById("explorer")?.id).toBe("explorer");
  });
});
