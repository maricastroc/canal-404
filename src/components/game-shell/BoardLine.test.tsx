import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { getGame } from "@/games/registry";
import type { SubmitResponse } from "@/lib/competition/types";
import { BoardLine, describeBoard } from "./BoardLine";

const LAB = getGame("bad-ideas-lab")!;
const STREET = getGame("dead-end-street")!;
const RECESS = getGame("operation-recess")!;

function accepted(overrides: Partial<SubmitResponse["run"]> = {}, board: SubmitResponse["board"] = null): { kind: "accepted"; response: SubmitResponse } {
  return {
    kind: "accepted",
    response: { run: { id: "r", verification: "checked", eligible: true, score: 1150, stars: 3, ...overrides }, board, repeated: false },
  };
}

const BEST = { score: 1150, stars: 3, metrics: [1, 312], achievedAt: "2026-11-03T12:00:00.000Z" };

describe("describeBoard", () => {
  it("celebrates a new record with the game's own metrics and the position", () => {
    const line = describeBoard(LAB, accepted({}, { id: "b", improved: true, previous: { score: 1000, stars: 2, metrics: [2, 400], achievedAt: "2026-11-02T12:00:00.000Z" }, position: 3, total: 41, best: BEST, verified: false, leader: null }));
    expect(line).toMatchObject({ headline: "Novo recorde pessoal!", text: "1 peça · 5,20 s. Agora você está em 3º de 41.", record: true });
    expect(line?.stamp).toBeFalsy();
  });

  it("does not call a first entry a personal record", () => {
    const line = describeBoard(LAB, accepted({}, { id: "b", improved: true, previous: null, position: 8, total: 16, best: BEST, verified: false, leader: null }));
    expect(line).toMatchObject({ headline: "Você entrou no placar", text: "1 peça · 5,20 s. Você está em 8º de 16." });
    expect(line?.record).toBeFalsy();
  });

  it("stamps a channel record only when there was someone to beat", () => {
    expect(describeBoard(LAB, accepted({}, { id: "b", improved: true, previous: null, position: 1, total: 41, best: BEST, verified: false, leader: null }))).toMatchObject({
      headline: "Recorde do canal!",
      text: "1 peça · 5,20 s. Você passou na frente de todo mundo: 1º de 41.",
      stamp: true,
    });
    const alone = describeBoard(LAB, accepted({}, { id: "b", improved: true, previous: null, position: 1, total: 1, best: BEST, verified: false, leader: null }));
    expect(alone).toMatchObject({ headline: "Placar inaugurado", text: "1 peça · 5,20 s. Por enquanto, o placar desta fase é só seu." });
    expect(alone?.stamp).toBeFalsy();
    expect(describeBoard(STREET, accepted({}, { id: "b", improved: true, previous: null, position: 1, total: 1, best: { ...BEST, metrics: [2150, 4] }, verified: false, leader: null }))?.text).toBe("2.150 pts · 4 lançamentos. Por enquanto, o placar deste jogo é só seu.");
  });

  it("reminds the player of their best when the run did not beat it", () => {
    const line = describeBoard(STREET, accepted({}, { id: "b", improved: false, previous: null, position: 12, total: 40, best: { ...BEST, metrics: [2150, 4] }, verified: false, leader: null }));
    expect(line?.text).toBe("Seu melhor continua 2.150 pts · 4 lançamentos, 12º de 40.");
  });

  it("compares the player's best with the channel record and links to the full board", () => {
    const leader = { nickname: "Lina Turbo", tag: "0427", metrics: [1, 98], you: false };
    const line = describeBoard(LAB, accepted({}, { id: "bad-ideas-lab/juice/v1", improved: false, previous: null, position: 4, total: 9, best: BEST, verified: false, leader }));
    expect(line).toMatchObject({ rival: "Recorde do canal: Lina Turbo #0427 · 1 peça · 1,63 s.", href: "/records?game=bad-ideas-lab&level=juice" });
    const mine = describeBoard(STREET, accepted({}, { id: "dead-end-street/all/v1", improved: false, previous: null, position: 1, total: 9, best: BEST, verified: false, leader: { ...leader, you: true } }));
    expect(mine).toMatchObject({ rival: "O recorde do canal continua com você.", href: "/records?game=dead-end-street" });
  });

  it("explains why a run stays off the board", () => {
    expect(describeBoard(LAB, accepted({ eligible: false, ineligible: "practice" }, null))?.text).toBe("Fase de treino não entra no placar.");
    expect(describeBoard(RECESS, accepted({ eligible: false, ineligible: "resumed" }, { id: "b", improved: false, previous: null, position: null, total: 3, best: null, leader: null }))?.text).toMatch(/retomadas do sino/);
    expect(describeBoard(RECESS, accepted({ eligible: false, ineligible: "not_won" }, { id: "b", improved: false, previous: null, position: null, total: 3, best: null, leader: null }))?.text).toBe("Só vitórias entram no placar desta fase.");
  });

  it("speaks plainly about outages and rejections", () => {
    expect(describeBoard(STREET, { kind: "queued" })).toMatchObject({ offline: true });
    expect(describeBoard(STREET, { kind: "unranked", why: "no-ticket" })?.text).toMatch(/ficou só no seu progresso/);
    expect(describeBoard(STREET, accepted({ eligible: false, ineligible: "not_won" }, { id: "b", improved: false, previous: null, position: null, total: 3, best: null, leader: null }))?.text).toBe("Só vitórias entram no placar deste jogo.");
    expect(describeBoard(STREET, { kind: "rejected", message: "Os números não fecham." })).toMatchObject({ headline: "O placar não aceitou", text: "Os números não fecham." });
    expect(describeBoard(STREET, { kind: "unranked", why: "unconfigured" })).toBeNull();
  });
});

describe("BoardLine", () => {
  it("announces the outcome in a status region", () => {
    render(<BoardLine game={LAB} state={{ phase: "done", outcome: accepted({}, { id: "bad-ideas-lab/pixel/v1", improved: true, previous: { score: 1000, stars: 2, metrics: [2, 400], achievedAt: "2026-11-02T12:00:00.000Z" }, position: 2, total: 9, best: BEST, verified: false, leader: null }) }} onJoin={vi.fn()} />);
    expect(screen.getByRole("region", { name: "Placar da fase" })).toBeInTheDocument();
    expect(screen.getByRole("status")).toHaveTextContent("Novo recorde pessoal!");
    expect(screen.getByRole("link", { name: "Ver o fliperama de recordes" })).toHaveAttribute("href", "/records?game=bad-ideas-lab&level=pixel");
  });

  it("checks the nickname before sending it and joins with a valid one", async () => {
    const user = userEvent.setup();
    const onJoin = vi.fn(async () => ({ ok: true as const, player: { id: "p", nickname: "Pato Veloz", tag: "0427", createdAt: "" } }));
    render(<BoardLine game={STREET} state={{ phase: "join" }} onJoin={onJoin} />);
    const input = screen.getByLabelText("Seu apelido");
    await user.type(input, "ab");
    await user.click(screen.getByRole("button", { name: "Entrar no placar" }));
    expect(screen.getByRole("alert")).toHaveTextContent("Use pelo menos 3 letras.");
    expect(onJoin).not.toHaveBeenCalled();
    await user.clear(input);
    await user.type(input, "Pato Veloz");
    await user.click(screen.getByRole("button", { name: "Entrar no placar" }));
    expect(onJoin).toHaveBeenCalledWith("Pato Veloz");
  });

  it("shows the server's message when a nickname is refused", async () => {
    const user = userEvent.setup();
    const onJoin = vi.fn(async () => ({ ok: false as const, message: "O placar está fora do ar agora." }));
    render(<BoardLine game={STREET} state={{ phase: "join" }} onJoin={onJoin} />);
    await user.click(screen.getByRole("button", { name: /Sortear/ }));
    expect((screen.getByLabelText("Seu apelido") as HTMLInputElement).value.length).toBeGreaterThan(2);
    await user.click(screen.getByRole("button", { name: "Entrar no placar" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("O placar está fora do ar agora.");
  });
});
