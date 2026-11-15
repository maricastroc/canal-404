import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { MERGE_WINDOW_MS, REPLAY_DELAY_MS, REPLAY_WINDOW_MS, nextAnnouncement, useAnnouncer } from "./useAnnouncer";

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

describe("useAnnouncer after a focus move", () => {
  let now = 0;
  beforeEach(() => {
    now = 1000;
    vi.useFakeTimers();
    vi.spyOn(performance, "now").mockImplementation(() => now);
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  const spoken = (regions: [string, string]) => regions.join("");

  it("reads a message sent just before focus moves again once focus has landed", () => {
    const { result } = renderHook(() => useAnnouncer());
    act(() => result.current.announce("Fase 1 de 6: Primeiro teste."));
    now += 40;
    act(() => result.current.afterFocus());
    expect(spoken(result.current.regions)).toBe("");
    act(() => vi.advanceTimersByTime(REPLAY_DELAY_MS));
    expect(spoken(result.current.regions)).toBe("Fase 1 de 6: Primeiro teste.");
  });

  it("joins messages sent while waiting into the same reading", () => {
    const { result } = renderHook(() => useAnnouncer());
    act(() => result.current.announce("Fase 1, Primeiro teste: vitória!"));
    act(() => result.current.afterFocus());
    act(() => result.current.announce("Fase de treino não entra no placar."));
    expect(spoken(result.current.regions)).toBe("");
    act(() => vi.advanceTimersByTime(REPLAY_DELAY_MS));
    expect(spoken(result.current.regions)).toBe("Fase 1, Primeiro teste: vitória! Fase de treino não entra no placar.");
  });

  it("answers a key press at once instead of waiting behind the replay", () => {
    const { result } = renderHook(() => useAnnouncer());
    act(() => result.current.announce("Fase 2 de 6: Bom dia, Pixel.", { fresh: true }));
    act(() => result.current.afterFocus());
    act(() => result.current.announce("Rampa na mão.", { fresh: true }));
    expect(spoken(result.current.regions)).toBe("Rampa na mão.");
    act(() => vi.advanceTimersByTime(REPLAY_DELAY_MS));
    expect(spoken(result.current.regions)).toBe("Rampa na mão.");
  });

  it("leaves older messages alone when focus moves", () => {
    const { result } = renderHook(() => useAnnouncer());
    act(() => result.current.announce("Rampa colocada."));
    now += REPLAY_WINDOW_MS + 1;
    act(() => result.current.afterFocus());
    expect(spoken(result.current.regions)).toBe("Rampa colocada.");
    act(() => vi.advanceTimersByTime(REPLAY_DELAY_MS));
    expect(spoken(result.current.regions)).toBe("Rampa colocada.");
  });
});
