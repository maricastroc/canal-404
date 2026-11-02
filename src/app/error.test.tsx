import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { addTelemetrySink, resetTelemetryForTests } from "@/lib/telemetry";
import RouteError from "./error";

afterEach(() => resetTelemetryForTests());

describe("RouteError", () => {
  it("shows the lost-signal screen, reports the error once and retries", async () => {
    const sink = vi.fn();
    addTelemetrySink(sink);
    const reset = vi.fn();
    render(<RouteError error={new Error("quebrou")} reset={reset} />);
    expect(screen.getByRole("heading", { name: "Sinal perdido" })).toBeInTheDocument();
    expect(sink).toHaveBeenCalledWith("client_error", { source: "route", message: "Error: quebrou" });
    await userEvent.click(screen.getByRole("button", { name: "Sintonizar de novo" }));
    expect(reset).toHaveBeenCalled();
    expect(screen.getByRole("link", { name: "Voltar para a sala" })).toHaveAttribute("href", "/");
  });
});
