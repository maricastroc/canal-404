import { describe, expect, it } from "vitest";
import { emptySave, loadSave, SAVE_KEY, writeSave } from "./save";

const backups = () => Object.keys(window.localStorage).filter((k) => k.startsWith(`${SAVE_KEY}:backup:`));

describe("Ladeira Abaixo save", () => {
  it("saves and loads the garage, the track records, the wins and the track goals", () => {
    const save = { cart: "lina" as const, ghost: true, unlocked: ["lina" as const], tracks: { feira: { time: 36.5, show: 8200, splits: [3.1, 4.2, Number.NaN] } }, wins: { feira: { deco: 3, lina: 1 } }, feats: { feira: ["awnings" as const] }, champions: { arlindo: ["deco" as const, "lina" as const] } };
    writeSave(save);
    expect(loadSave()).toEqual(save);
  });

  it("keeps a copy of a save it cannot read and starts empty without erasing it", () => {
    const future = JSON.stringify({ version: 2, cart: "mila" });
    window.localStorage.setItem(SAVE_KEY, future);
    expect(loadSave()).toEqual(emptySave());
    expect(backups().map((k) => window.localStorage.getItem(k))).toEqual([future]);
    expect(window.localStorage.getItem(SAVE_KEY)).toBe(future);
    window.localStorage.setItem(SAVE_KEY, "{");
    expect(loadSave()).toEqual(emptySave());
    expect(backups()).toHaveLength(2);
  });

  it("drops unknown values and never hands out a locked cart", () => {
    window.localStorage.setItem(
      SAVE_KEY,
      JSON.stringify({
        version: 1,
        cart: "mila",
        ghost: "yes",
        unlocked: ["deco", "skate", "lina"],
        tracks: { arlindo: { time: -3, show: 10 }, feira: { time: 40, show: -5, splits: "x" }, test: { time: 30 } },
        wins: { arlindo: { deco: -2, skate: 4 }, antena: { bruno: 2.7, mila: "3" }, test: { deco: 9 } },
        feats: { arlindo: ["loop", "gnome", "gnome"], feira: "awnings", test: ["gnome"] },
        champions: { antena: ["skate", "mila"], feira: [] },
      }),
    );
    expect(loadSave()).toEqual({ cart: "deco", ghost: false, unlocked: ["lina"], tracks: { feira: { time: 40, show: 0, splits: [] } }, wins: { antena: { bruno: 2 } }, feats: { arlindo: ["gnome"] }, champions: { antena: ["mila"] } });
  });
});
