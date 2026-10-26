import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { GAMES } from "@/games/registry";
import { CHARACTERS } from "@/lib/characters";
import { CharacterSelect } from "./CharacterSelect";

const tab = (name: string) => screen.getByRole("tab", { name: new RegExp(`^${name}`) });
const profileTitle = () => within(screen.getByRole("tabpanel")).getByRole("heading", { level: 2 });

describe("CharacterSelect", () => {
  afterEach(() => {
    window.history.replaceState(null, "", "/");
  });

  it("shows one tab per character and starts with the mascot", () => {
    render(<CharacterSelect />);
    expect(screen.getAllByRole("tab")).toHaveLength(CHARACTERS.length);
    expect(tab("404")).toHaveAttribute("aria-selected", "true");
    expect(profileTitle()).toHaveTextContent("404");
  });

  it("switches the profile on click and updates the address", async () => {
    render(<CharacterSelect />);
    await userEvent.click(tab("Lina"));
    expect(tab("Lina")).toHaveAttribute("aria-selected", "true");
    expect(tab("404")).toHaveAttribute("aria-selected", "false");
    await vi.waitFor(() => expect(profileTitle()).toHaveTextContent("Lina"));
    expect(window.location.hash).toBe("#lina");
  });

  it("moves between tabs with the arrow, Home and End keys", async () => {
    render(<CharacterSelect />);
    tab("404").focus();
    await userEvent.keyboard("{ArrowRight}");
    expect(tab("Lina")).toHaveFocus();
    expect(tab("Lina")).toHaveAttribute("aria-selected", "true");
    await userEvent.keyboard("{End}");
    expect(tab("Mila")).toHaveFocus();
    await userEvent.keyboard("{ArrowRight}");
    expect(tab("404")).toHaveFocus();
    await userEvent.keyboard("{ArrowLeft}");
    expect(tab("Mila")).toHaveFocus();
    await userEvent.keyboard("{Home}");
    expect(tab("404")).toHaveFocus();
  });

  it("keeps only the selected tab in the tab order", async () => {
    render(<CharacterSelect />);
    await userEvent.click(tab("Bruno"));
    for (const t of screen.getAllByRole("tab")) expect(t).toHaveAttribute("tabindex", t === tab("Bruno") ? "0" : "-1");
  });

  it("opens the character from the address", () => {
    window.history.replaceState(null, "", "/characters#deco");
    render(<CharacterSelect />);
    expect(tab("Déco")).toHaveAttribute("aria-selected", "true");
  });

  it("lists the games each kid appears in", async () => {
    render(<CharacterSelect />);
    await userEvent.click(tab("Mila"));
    const expected = GAMES.filter((g) => g.cast.includes("mila")).map((g) => g.title);
    await vi.waitFor(() => {
      const panel = screen.getByRole("tabpanel");
      for (const title of expected) expect(within(panel).getByRole("link", { name: new RegExp(title) })).toBeInTheDocument();
    });
  });

  it("answers with a new line when poked", async () => {
    render(<CharacterSelect />);
    const catchphrase = CHARACTERS[0].catchphrase;
    expect(screen.getByText(catchphrase)).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: /Cutucar/ }));
    expect(screen.queryByText(catchphrase)).not.toBeInTheDocument();
  });
});
