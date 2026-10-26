import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { getGame } from "@/games/registry";
import { IntroPanel } from "./Panels";

function renderIntro(slug: string, props: Partial<Parameters<typeof IntroPanel>[0]> = {}) {
  const game = getGame(slug)!;
  const handlers = { onPlay: vi.fn(), onNew: vi.fn(), onToggleHelp: vi.fn() };
  const view = render(<IntroPanel game={game} highScore={0} showHelp={false} {...handlers} {...props} />);
  return { game, ...handlers, ...view };
}

describe("IntroPanel", () => {
  it("opens as a dialog named after the game", () => {
    renderIntro("food-fight");
    expect(screen.getByRole("dialog", { name: "Guerra de Lanche: tela de apresentação" })).toBeInTheDocument();
  });

  it("starts a game without levels and shows the record", async () => {
    const { onPlay } = renderIntro("food-fight", { highScore: 12500 });
    expect(screen.getByText("Recorde: 12.500")).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "Jogar" }));
    expect(onPlay).toHaveBeenCalledWith(undefined);
  });

  it("shows a dash when there is no record yet", () => {
    renderIntro("dead-end-street");
    expect(screen.getByText("Recorde: —")).toBeInTheDocument();
  });

  it("locks levels after the furthest one played and suggests the next", async () => {
    const { onPlay } = renderIntro("bad-ideas-lab", { levels: { stars: [3, 2, 0, 0, 0, 0], unlocked: 2, suggested: 2 } });
    const list = screen.getByRole("list");
    const buttons = within(list).getAllByRole("button");
    expect(buttons.map((b) => (b as HTMLButtonElement).disabled)).toEqual([false, false, false, true, true, true]);
    expect(within(list).getAllByText("Termine a fase anterior")).toHaveLength(3);
    expect(screen.getByText("Estrelas: 5/18")).toBeInTheDocument();
    expect(screen.getByRole("img", { name: "3 de 3 estrelas" })).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: /Jogar fase 3/ }));
    expect(onPlay).toHaveBeenCalledWith(2);
    await userEvent.click(buttons[0]);
    expect(onPlay).toHaveBeenLastCalledWith(0);
  });

  it("talks about arenas instead of levels in Guerra do Pijama", () => {
    renderIntro("pajama-war", { levels: { stars: [0, 0, 0], unlocked: 0, suggested: 0 } });
    expect(screen.getByRole("heading", { name: "Escolha a arena" })).toBeInTheDocument();
    expect(screen.getAllByText("Vença a arena anterior")).toHaveLength(2);
    expect(screen.getByRole("button", { name: /Jogar arena 1/ })).toBeInTheDocument();
  });

  it("starts a new adventure when there is no save", async () => {
    const { onNew, onPlay } = renderIntro("off-air-vacation");
    expect(screen.queryByRole("button", { name: /Continuar aventura/ })).not.toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: /Começar aventura/ }));
    expect(onNew).toHaveBeenCalled();
    expect(onPlay).not.toHaveBeenCalled();
  });

  it("offers to continue a saved adventure", async () => {
    window.localStorage.setItem("canal404:off-air-vacation:v1", "{}");
    const { onPlay } = renderIntro("off-air-vacation");
    expect(screen.getByText("Sua aventura está salva. Continue de onde parou.")).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: /Continuar aventura/ }));
    expect(onPlay).toHaveBeenCalled();
  });

  it("asks before erasing a saved adventure", async () => {
    window.localStorage.setItem("canal404:off-air-vacation:v1", "{}");
    const { onNew } = renderIntro("off-air-vacation");
    await userEvent.click(screen.getByRole("button", { name: /Nova aventura/ }));
    const confirm = screen.getByRole("alertdialog", { name: "Começar uma nova aventura" });
    await userEvent.click(within(confirm).getByRole("button", { name: "Cancelar" }));
    expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument();
    expect(onNew).not.toHaveBeenCalled();
    await userEvent.click(screen.getByRole("button", { name: /Nova aventura/ }));
    await userEvent.click(screen.getByRole("button", { name: /Sim, nova aventura/ }));
    expect(onNew).toHaveBeenCalled();
  });

  it("toggles the how-to-play section", async () => {
    const { onToggleHelp, rerender, game } = renderIntro("food-fight");
    const toggle = screen.getByRole("button", { name: "Como jogar" });
    expect(toggle).toHaveAttribute("aria-expanded", "false");
    await userEvent.click(toggle);
    expect(onToggleHelp).toHaveBeenCalled();
    rerender(<IntroPanel game={game} highScore={0} showHelp onPlay={vi.fn()} onToggleHelp={onToggleHelp} />);
    expect(screen.getByRole("button", { name: "Esconder instruções" })).toHaveAttribute("aria-expanded", "true");
    expect(document.getElementById("how-to-play-panel")).toBeInTheDocument();
  });

  it("puts the focus on the play button", async () => {
    renderIntro("food-fight");
    await vi.waitFor(() => expect(screen.getByRole("button", { name: "Jogar" })).toHaveFocus());
  });
});
