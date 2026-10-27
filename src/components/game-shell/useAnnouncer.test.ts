import { describe, expect, it } from "vitest";
import { MERGE_WINDOW_MS, nextAnnouncement } from "./useAnnouncer";

const empty = { active: 1 as const, at: -Infinity, text: "", transient: false };

describe("nextAnnouncement", () => {
  it("moves repeated messages to the other region so they are read again", () => {
    const a = nextAnnouncement(empty, "Não cabe.", {}, 1000);
    const b = nextAnnouncement(a, "Não cabe.", {}, 1000 + MERGE_WINDOW_MS + 1);
    expect(a).toMatchObject({ active: 0, text: "Não cabe." });
    expect(b).toMatchObject({ active: 1, text: "Não cabe." });
  });

  it("joins messages sent in the same moment and skips exact repeats", () => {
    const a = nextAnnouncement(empty, "Primeira.", {}, 0);
    const b = nextAnnouncement(a, "Segunda.", {}, 10);
    const c = nextAnnouncement(b, "Segunda.", {}, 20);
    expect(b).toMatchObject({ active: a.active, text: "Primeira. Segunda." });
    expect(c.text).toBe("Primeira. Segunda.");
  });

  it("starts fresh for answers to a new key press", () => {
    const a = nextAnnouncement(empty, "Rampa na mão.", {}, 0);
    const b = nextAnnouncement(a, "1 de 6. O cano.", { fresh: true }, 50);
    expect(b).toMatchObject({ active: a.active === 0 ? 1 : 0, text: "1 de 6. O cano." });
  });

  it("lets quick movement updates replace each other instead of piling up", () => {
    const a = nextAnnouncement(empty, "Rampa na mão.", { fresh: true }, 0);
    const b = nextAnnouncement(a, "Direita. 3 passos.", { transient: true }, 100);
    const c = nextAnnouncement(b, "Direita. 2 passos.", { transient: true }, 200);
    const d = nextAnnouncement(c, "Rampa colocada.", { fresh: true }, 300);
    expect(b.active).not.toBe(a.active);
    expect(c).toMatchObject({ active: b.active, text: "Direita. 2 passos." });
    expect(d).toMatchObject({ active: c.active, text: "Rampa colocada.", transient: false });
  });
});
