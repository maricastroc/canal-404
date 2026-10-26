import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { CATEGORY_LABELS, GAMES } from "@/games/registry";
import { GameCatalog } from "./GameCatalog";

const cards = () => within(screen.getByRole("list")).getAllByRole("listitem");
const filterName = (label: string, count: number) => new RegExp(`^${label}\\s*\\(${count}\\)$`);

describe("GameCatalog", () => {
  it("shows every game at first", () => {
    render(<GameCatalog />);
    expect(cards()).toHaveLength(GAMES.length);
    expect(screen.getByRole("button", { name: filterName("Todos", GAMES.length) })).toHaveAttribute("aria-pressed", "true");
  });

  it("has one filter per category in use, with its count", () => {
    render(<GameCatalog />);
    const group = screen.getByRole("group", { name: "Filtrar jogos por categoria" });
    const categories = [...new Set(GAMES.map((g) => g.category))];
    expect(within(group).getAllByRole("button")).toHaveLength(categories.length + 1);
    for (const c of categories) {
      const count = GAMES.filter((g) => g.category === c).length;
      expect(within(group).getByRole("button", { name: filterName(CATEGORY_LABELS[c], count) })).toBeInTheDocument();
    }
  });

  it("filters games by category and announces the result", async () => {
    render(<GameCatalog />);
    const puzzles = GAMES.filter((g) => g.category === "puzzle");
    await userEvent.click(screen.getByRole("button", { name: /^Puzzle/ }));
    expect(screen.getByRole("button", { name: /^Puzzle/ })).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByRole("button", { name: /^Todos/ })).toHaveAttribute("aria-pressed", "false");
    await vi.waitFor(() => expect(cards()).toHaveLength(puzzles.length));
    expect(screen.getByText(`${puzzles.length} ${puzzles.length === 1 ? "jogo encontrado" : "jogos encontrados"}`)).toBeInTheDocument();
  });

  it("links each card to its game page", () => {
    render(<GameCatalog />);
    for (const game of GAMES) {
      const links = screen.getAllByRole("link").filter((a) => a.getAttribute("href")?.endsWith(`/${game.slug}`));
      expect(links.length, game.slug).toBeGreaterThan(0);
    }
  });
});
