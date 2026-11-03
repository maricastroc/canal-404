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
    const line = describeBoard(LAB, accepted({}, { id: "b", improved: true, previous: null, position: 3, total: 41, best: BEST }));
    expect(line).toMatchObject({ headline: "Novo recorde pessoal!", text: "1 peça · 312 passos. Você está em 3º de 41.", record: true });
  });

  it("calls out first place", () => {
    expect(describeBoard(LAB, accepted({}, { id: "b", improved: true, previous: null, position: 1, total: 41, best: BEST }))?.headline).toBe("Primeiro lugar no placar!");
  });

  it("reminds the player of their best when the run did not beat it", () => {
    const line = describeBoard(STREET, accepted({}, { id: "b", improved: false, previous: null, position: 12, total: 40, best: { ...BEST, metrics: [2150, 4] } }));
    expect(line?.text).toBe("Seu melhor no placar: 2.150 pts · 4 lançamentos. Você está em 12º de 40.");
  });

  it("explains why a run stays off the board", () => {
    expect(describeBoard(LAB, accepted({ eligible: false, ineligible: "practice" }, null))?.text).toBe("Fase de treino não entra no placar.");
    expect(describeBoard(RECESS, accepted({ eligible: false, ineligible: "resumed" }, { id: "b", improved: false, previous: null, position: null, total: 3, best: null }))?.text).toMatch(/retomadas do sino/);
    expect(describeBoard(RECESS, accepted({ eligible: false, ineligible: "not_won" }, { id: "b", improved: false, previous: null, position: null, total: 3, best: null }))?.text).toBe("Só vitórias entram no placar desta fase.");
  });

  it("speaks plainly about outages and rejections", () => {
    expect(describeBoard(STREET, { kind: "queued" })).toMatchObject({ offline: true });
    expect(describeBoard(STREET, { kind: "unranked", why: "no-ticket" })?.text).toMatch(/ficou só neste computador/);
    expect(describeBoard(STREET, { kind: "rejected", message: "Os números não fecham." })).toMatchObject({ headline: "O placar não aceitou", text: "Os números não fecham." });
    expect(describeBoard(STREET, { kind: "unranked", why: "unconfigured" })).toBeNull();
  });
});

describe("BoardLine", () => {
  it("announces the outcome in a status region", () => {
    render(<BoardLine game={LAB} state={{ phase: "done", outcome: accepted({}, { id: "b", improved: true, previous: null, position: 2, total: 9, best: BEST }) }} onJoin={vi.fn()} />);
    expect(screen.getByRole("region", { name: "Placar do canal" })).toBeInTheDocument();
    expect(screen.getByRole("status")).toHaveTextContent("Novo recorde pessoal!");
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
