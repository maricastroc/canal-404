import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { CHANNELS, isRegularChannel } from "./objects/TvChannels";
import { TAPES, isTape, type TapeId } from "./objects/tapes";
import { TapeShelf } from "./TapeShelf";

function renderShelf(inserted: TapeId | null = null, away: TapeId[] = []) {
  const handlers = { onPick: vi.fn(), onEject: vi.fn(), onClose: vi.fn() };
  render(<TapeShelf open inserted={inserted} away={away} origin={null} {...handlers} />);
  return { dialog: screen.getByRole("dialog", { name: "Estante de fitas" }), ...handlers };
}

describe("TapeShelf", () => {
  it("offers every tape, with the forbidden one torn", () => {
    const { dialog } = renderShelf();
    const tapes = within(dialog).getAllByRole("button", { name: /^Colocar a fita/ });
    expect(tapes).toHaveLength(5);
    expect(within(dialog).getByRole("button", { name: "Colocar a fita de etiqueta rasgada: Não assis…" })).toBeInTheDocument();
    expect(within(dialog).getByRole("button", { name: "Colocar a fita Karaokê, o 404 canta" })).toBeInTheDocument();
    expect(within(dialog).queryByRole("button", { name: /^Ejetar/ })).not.toBeInTheDocument();
    expect(dialog).not.toHaveTextContent("No vídeo");
  });

  it("pulls the chosen tape out once and puts it in the VCR", async () => {
    const { dialog, onPick } = renderShelf();
    await userEvent.click(within(dialog).getByRole("button", { name: /Colocar a fita Karaokê/ }));
    expect(within(dialog).getByRole("button", { name: /Colocar a fita Desenhos 03/ })).toBeDisabled();
    await userEvent.click(within(dialog).getByRole("button", { name: /Colocar a fita Desenhos 03/ }));
    await waitFor(() => expect(onPick).toHaveBeenCalledWith("tape-karaoke"));
    expect(onPick).toHaveBeenCalledOnce();
  });

  it("leaves an empty slot for a tape that is still flying back", () => {
    const { dialog } = renderShelf(null, ["tape-street"]);
    expect(within(dialog).getAllByRole("button", { name: /^Colocar a fita/ })).toHaveLength(4);
    expect(within(dialog).queryByRole("button", { name: /Rua S\/ Saída/ })).not.toBeInTheDocument();
  });

  it("shows the playing tape as missing from the shelf and offers to eject it", async () => {
    const { dialog, onEject } = renderShelf("tape-resort");
    expect(within(dialog).getAllByRole("button", { name: /^Colocar a fita/ })).toHaveLength(4);
    expect(within(dialog).queryByRole("button", { name: /^Colocar a fita Férias/ })).not.toBeInTheDocument();
    expect(dialog).toHaveTextContent("No vídeoFérias 2004");
    expect(dialog).toHaveTextContent("No vídeo: Férias 2004");
    await userEvent.click(within(dialog).getByRole("button", { name: "Ejetar Férias 2004" }));
    expect(onEject).toHaveBeenCalledOnce();
  });

  it("focuses the first tape and closes with Escape or the close button", async () => {
    const { dialog, onClose } = renderShelf();
    expect(within(dialog).getByRole("button", { name: /^Colocar a fita Desenhos 03/ })).toHaveFocus();
    await userEvent.keyboard("{Escape}");
    await userEvent.click(within(dialog).getByRole("button", { name: "Fechar a estante" }));
    expect(onClose).toHaveBeenCalledTimes(2);
  });

  it("keeps every tape on its own AV channel outside the knob rotation", () => {
    for (const tape of TAPES) {
      expect(isTape(tape.id)).toBe(true);
      expect(CHANNELS[tape.id]).toMatchObject({ number: "AV" });
      expect(isRegularChannel(tape.id)).toBe(false);
    }
    expect(isTape("cartoon")).toBe(false);
  });
});
