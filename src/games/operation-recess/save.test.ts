import { describe, expect, it } from "vitest";
import { addSticker, emptySave, loadSave, SAVE_KEY, writeSave } from "./save";

const backups = () => Object.keys(window.localStorage).filter((k) => k.startsWith(`${SAVE_KEY}:backup:`));

describe("Operação: Recreio sticker album", () => {
  it("saves and loads the album, keeping each sticker once in album order", () => {
    const save = emptySave();
    expect(addSticker(save, "rope")).toBe(true);
    expect(addSticker(save, "marbles")).toBe(true);
    expect(addSticker(save, "rope")).toBe(false);
    writeSave(save);
    expect(loadSave()).toEqual({ stickers: ["marbles", "rope"] });
  });

  it("keeps a copy of an album it cannot read and starts empty without erasing it", () => {
    const future = JSON.stringify({ version: 2, stickers: ["kite"] });
    window.localStorage.setItem(SAVE_KEY, future);
    expect(loadSave()).toEqual(emptySave());
    expect(backups().map((k) => window.localStorage.getItem(k))).toEqual([future]);
    expect(window.localStorage.getItem(SAVE_KEY)).toBe(future);
  });

  it("drops unknown and repeated stickers", () => {
    window.localStorage.setItem(SAVE_KEY, JSON.stringify({ version: 1, stickers: ["kite", "skate", "kite", 3, "ball"] }));
    expect(loadSave()).toEqual({ stickers: ["ball", "kite"] });
  });
});
