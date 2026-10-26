import { describe, expect, it } from "vitest";
import * as street from "./dead-end-street/config";
import * as lunch from "./food-fight/config";

describe("Rua Sem Saída", () => {
  it("only loads projectiles that exist", () => {
    for (const id of street.AMMO) expect(street.PROJECTILES[id], id).toBeDefined();
  });

  it("brings every projectile type at least once", () => {
    expect(new Set(street.AMMO)).toEqual(new Set(Object.keys(street.PROJECTILES)));
  });

  it("has targets in every round and none in a round that does not exist", () => {
    street.WAVES.forEach((_, i) => expect(street.TARGETS.some((t) => t.wave === i + 1), `round ${i + 1}`).toBe(true));
    for (const t of street.TARGETS) {
      expect(t.wave, t.id).toBeGreaterThanOrEqual(1);
      expect(t.wave, t.id).toBeLessThanOrEqual(street.WAVES.length);
    }
  });

  it("places targets on screen and above the ground", () => {
    for (const t of street.TARGETS) {
      expect(t.x, t.id).toBeGreaterThan(street.ANCHOR.x);
      expect(t.x, t.id).toBeLessThan(street.W);
      expect(t.y + t.h / 2, t.id).toBeLessThanOrEqual(street.GROUND_Y + 1);
    }
  });

  it("needs more points for three stars than for two", () => {
    expect(street.SCORE.threeStars).toBeGreaterThan(street.SCORE.twoStars);
  });
});

describe("Guerra de Lanche", () => {
  it("starts the round with the gentlest phase", () => {
    expect(lunch.PHASES[0].from).toBe(0);
    expect(lunch.PHASES[0].maxActive).toBe(1);
  });

  it("gets harder as the round goes on", () => {
    lunch.PHASES.slice(1).forEach((p, i) => {
      const prev = lunch.PHASES[i];
      expect(p.from).toBeGreaterThan(prev.from);
      expect(p.from).toBeLessThan(lunch.ROUND_MS);
      expect(p.windup).toBeLessThanOrEqual(prev.windup);
      expect(p.maxActive).toBeGreaterThanOrEqual(prev.maxActive);
    });
  });

  it("schedules the lunch lady and the brawl inside the round", () => {
    for (const t of lunch.LUNCH_LADY_TIMES) expect(t).toBeLessThan(lunch.ROUND_MS);
    expect(lunch.EVENTS.brawlAt + lunch.EVENTS.brawlMs).toBeLessThan(lunch.ROUND_MS);
    expect(lunch.EVENTS.brawlers).toBeLessThanOrEqual(lunch.SLOTS.length);
  });

  it("gives the tougher rival more points and more health", () => {
    expect(lunch.RIVALS.big.hp).toBeGreaterThan(lunch.RIVALS.cap.hp);
    expect(lunch.RIVALS.big.points).toBeGreaterThan(lunch.RIVALS.cap.points);
    expect(lunch.RIVALS.speedy.windup).toBeLessThan(lunch.RIVALS.cap.windup);
  });

  it("has one snack spot per ammo", () => {
    expect(lunch.AMMO_SPOTS).toHaveLength(lunch.AMMO_MAX);
  });
});
