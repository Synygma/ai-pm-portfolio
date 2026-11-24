import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import { afterEach, describe, expect, it, vi } from "vitest";
import { InputBar } from "@/components/wa/InputBar";
import { VoiceNoteBubble } from "@/components/wa/VoiceNoteBubble";
import messages from "../../messages/en.json";

const withIntl = (ui: React.ReactNode) =>
  render(
    <NextIntlClientProvider locale="en" messages={messages}>
      {ui}
    </NextIntlClientProvider>,
  );

afterEach(cleanup);

describe("InputBar", () => {
  it("shows the mic when empty and the send button when there is text", () => {
    const onSend = vi.fn();
    withIntl(<InputBar onSend={onSend} />);
    expect(screen.getByRole("button", { name: "Record a voice message" })).toBeTruthy();
    expect(screen.queryByRole("button", { name: "Send" })).toBeNull();

    fireEvent.change(screen.getByPlaceholderText("Message"), { target: { value: "  Hello Maa " } });
    expect(screen.queryByRole("button", { name: "Record a voice message" })).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: "Send" }));

    expect(onSend).toHaveBeenCalledWith("Hello Maa");
    expect(screen.getByRole("button", { name: "Record a voice message" })).toBeTruthy();
  });

  it("does not offer send for spaces only", () => {
    withIntl(<InputBar onSend={() => {}} />);
    fireEvent.change(screen.getByPlaceholderText("Message"), { target: { value: "   " } });
    expect(screen.queryByRole("button", { name: "Send" })).toBeNull();
  });
});

describe("VoiceNoteBubble", () => {
  it("shows play, duration, sample label and a speed chip that cycles 1× / 1.5× / 2×", () => {
    withIntl(<VoiceNoteBubble durationSec={65} seed="s" sample />);
    expect(screen.getByRole("button", { name: "Play voice note" })).toBeTruthy();
    expect(screen.getByText("1:05")).toBeTruthy();
    expect(screen.getByText("Sample")).toBeTruthy();
    const chip = screen.getByTestId("speed-chip");
    expect(chip.textContent).toBe("1×");
    fireEvent.click(chip);
    expect(chip.textContent).toBe("1.5×");
    fireEvent.click(chip);
    expect(chip.textContent).toBe("2×");
    fireEvent.click(chip);
    expect(chip.textContent).toBe("1×");
  });
});
