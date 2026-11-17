import { describe, expect, it } from "vitest";
import { checkNickname, suggestNickname } from "./nickname";

describe("checkNickname", () => {
  it("refuses links, emails, symbols and invisible tricks", () => {
    for (const raw of ["canal.com", "eu@mail", "<b>oi</b>", "Pato​Veloz", "😀😀😀", "1234"]) {
      expect(checkNickname(raw)).toMatchObject({ ok: false, problem: "chars" });
    }
    expect(checkNickname(42)).toMatchObject({ ok: false });
  });

  it("refuses long numbers that look like phones or documents", () => {
    expect(checkNickname("Bia 11987654")).toEqual({ ok: false, problem: "digits" });
  });

  it("blocks offensive words, also in leetspeak and with repeated letters", () => {
    for (const raw of ["Porra Louca", "p0rr4", "Caaaralho", "fdp", "Puta Merda", "b0sta"]) {
      expect(checkNickname(raw)).toMatchObject({ ok: false, problem: "blocked" });
    }
  });

  it("does not block innocent words that contain a short bad word", () => {
    for (const raw of ["Computador", "Disputa", "Escudo", "Picanha", "Rolamento", "Cupido"]) {
      expect(checkNickname(raw)).toMatchObject({ ok: true });
    }
  });

  it("reserves the channel staff names", () => {
    for (const raw of ["Admin", "CANAL 404", "Moderador Jr", "Mod", "Equipe 404", "Mascote"]) {
      expect(checkNickname(raw)).toMatchObject({ ok: false, problem: "reserved" });
    }
  });
});

describe("nickname helpers", () => {
  it("suggests nicknames that always pass the filter", () => {
    let seed = 1;
    const random = () => {
      seed = (seed * 16807) % 2147483647;
      return seed / 2147483647;
    };
    for (let i = 0; i < 200; i += 1) expect(checkNickname(suggestNickname(random, "pt-BR"))).toMatchObject({ ok: true });
  });
});
