import { describe, expect, it } from "vitest";
import { ARENAS } from "./arenas";
import { resultCopy, winShout } from "./copy";

const base = { total: ARENAS.length, won: true, place: 1, kid: "lia" as const, winner: "lia" as const };

describe("Guerra do Pijama result copy", () => {
  it("cheers the first win in each arena and points to the next one", () => {
    expect(resultCopy({ ...base, arena: 0, beatenBefore: [false, false, false] }).text).toBe("O quarto ficou pequeno pra você! A guerra continua na sala.");
    expect(resultCopy({ ...base, arena: 1, beatenBefore: [true, false, false] }).text).toBe("Nem o sofá segurou essa vitória! Próxima parada: quintal.");
    const yard = resultCopy({ ...base, arena: 2, beatenBefore: [true, true, false] });
    expect(yard.text).toBe("Você dominou a guerra de travesseiros!");
    expect(yard.title).toBe("Campeã do pijama!");
    expect(resultCopy({ ...base, kid: "nico", arena: 2, beatenBefore: [true, true, false] }).title).toBe("Campeão do pijama!");
  });

  it("changes the message when an arena is played again", () => {
    expect(resultCopy({ ...base, arena: 0, beatenBefore: [true, false, false] }).text).toBe("O quarto é seu de novo. A sala ainda está esperando.");
    expect(resultCopy({ ...base, arena: 0, beatenBefore: [true, true, true] }).text).toBe("O quarto continua sendo seu. Que tal uma revanche no quintal?");
    expect(resultCopy({ ...base, arena: 1, beatenBefore: [true, true, true] }).text).toBe("Nem o sofá, nem as poltronas. A sala é sua de novo!");
    const yard = resultCopy({ ...base, arena: 2, beatenBefore: [true, true, true] });
    expect(yard.text).toBe("O quintal continua sendo seu. Ninguém segura essa guerra!");
    expect(yard.title).toBe("Você ganhou!");
  });

  it("never promises a next arena from the backyard", () => {
    for (const beaten of [[true, true, false], [true, true, true]]) {
      const copy = resultCopy({ ...base, arena: 2, beatenBefore: beaten });
      expect(copy.text).not.toMatch(/próxima|continua na/i);
    }
  });

  it("names the winner of the arena when the player comes second", () => {
    expect(resultCopy({ ...base, won: false, place: 2, winner: "bia", arena: 1, beatenBefore: [true, false, false] })).toEqual({ title: "Quase!", text: "Bia ficou com a sala. Revanche?" });
  });

  it("uses the right gender for the first kid out", () => {
    expect(resultCopy({ ...base, won: false, place: 3, winner: null, kid: "nico", arena: 0, beatenBefore: [false, false, false] }).text).toBe("Você foi o primeiro a cair. Mais uma partida?");
    expect(resultCopy({ ...base, won: false, place: 3, winner: null, kid: "bia", arena: 0, beatenBefore: [false, false, false] }).text).toBe("Você foi a primeira a cair. Mais uma partida?");
  });

  it("shouts the arena on the victory banner", () => {
    expect(ARENAS.map((_, i) => winShout(i))).toEqual(["O quarto é seu!", "A sala é sua!", "O quintal é seu!"]);
  });
});
