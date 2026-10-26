import { describe, expect, it } from "vitest";
import { COVERS } from "@/components/art/Covers";
import { GAME_LOGOS } from "@/components/art/GameLogos";
import { guestCardClass } from "@/components/art/GameCast";
import { NAV_ITEMS } from "@/components/layout/nav";
import { CHARACTERS } from "@/lib/characters";
import { LEVELS as LAB_LEVELS } from "./bad-ideas-lab/levels";
import { GAME_LOADERS } from "./loaders";
import { SAVE_KEY } from "./off-air-vacation/config";
import { LEVELS as RECESS_LEVELS } from "./operation-recess/levels";
import { ARENAS } from "./pajama-war/arenas";
import { KIDS } from "./pajama-war/config";
import { CATEGORY_LABELS, GAMES, PLAYABLE, getGame } from "./registry";

const ids = <T extends { id: string }>(list: T[]) => list.map((x) => x.id);

describe("game registry", () => {
  it("has unique slugs", () => {
    const slugs = GAMES.map((g) => g.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
  });

  it("has a loader for every playable game and no loader without a game", () => {
    expect(Object.keys(GAME_LOADERS).sort()).toEqual(PLAYABLE.map((g) => g.slug).sort());
  });

  it("has a cover and a logo for every game", () => {
    for (const game of GAMES) {
      expect(COVERS[game.slug], game.slug).toBeTypeOf("function");
      expect(GAME_LOGOS[game.slug], game.slug).toBeTypeOf("function");
    }
  });

  it("uses known categories and cast members", () => {
    const cast = new Set(CHARACTERS.map((c) => c.id));
    for (const game of GAMES) {
      expect(CATEGORY_LABELS[game.category], game.slug).toBeTruthy();
      for (const who of game.cast) expect(cast.has(who), `${game.slug}: ${who}`).toBe(true);
    }
  });

  it("gives every playable game controls, a how-to and an objective", () => {
    for (const game of PLAYABLE) {
      expect(game.controls?.length, game.slug).toBeGreaterThan(0);
      expect(game.howTo?.length, game.slug).toBeGreaterThan(0);
      expect(game.objective, game.slug).toBeTruthy();
    }
  });

  it("has art for every guest", () => {
    for (const game of GAMES) {
      for (const guest of game.guests ?? []) expect(guestCardClass(guest.id), `${game.slug}: ${guest.id}`).not.toBe("bg-cream");
    }
  });

  it("lists the same levels as each leveled game", () => {
    expect(ids(getGame("bad-ideas-lab")?.levels ?? [])).toEqual(ids(LAB_LEVELS));
    expect(ids(getGame("operation-recess")?.levels ?? [])).toEqual(ids(RECESS_LEVELS));
    expect(ids(getGame("pajama-war")?.levels ?? [])).toEqual(ids(ARENAS));
  });

  it("lists the Pajama War kids as guests", () => {
    expect(ids(getGame("pajama-war")?.guests ?? [])).toEqual(KIDS);
  });

  it("points the resumable game to the key it saves to", () => {
    expect(getGame("off-air-vacation")?.resumable).toBe(SAVE_KEY);
  });

  it("finds games by slug", () => {
    expect(getGame("food-fight")?.title).toBe("Guerra de Lanche");
    expect(getGame("nope")).toBeUndefined();
  });

  it("links the game of the week to a playable game", () => {
    const weekly = NAV_ITEMS.find((n) => n.icon === "star");
    const slug = weekly?.href.replace("/games/", "");
    expect(PLAYABLE.some((g) => g.slug === slug)).toBe(true);
  });
});
