import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { MAX_LISTEN_MS, PushToTalk } from "@/components/setup/PushToTalk";
import { isPhoneBrowser, speechErrorCode } from "@/lib/speech";
import messages from "../../messages/en.json";

// A fake browser speech engine: each `new` is one session the test can drive.
type Fake = {
  lang: string;
  continuous: boolean;
  onstart: (() => void) | null;
  onresult: ((e: unknown) => void) | null;
  onerror: ((e: { error: string }) => void) | null;
  onend: (() => void) | null;
  start: ReturnType<typeof vi.fn>;
  stop: ReturnType<typeof vi.fn>;
  abort: ReturnType<typeof vi.fn>;
};
let sessions: Fake[] = [];
const last = () => sessions[sessions.length - 1];
const say = (finals: string[], interim = "") =>
  act(() => {
    const results = [...finals.map((f) => ({ isFinal: true, 0: { transcript: f } })), ...(interim ? [{ isFinal: false, 0: { transcript: interim } }] : [])];
    last().onresult?.({ resultIndex: 0, results });
  });

beforeEach(() => {
  sessions = [];
  vi.useFakeTimers();
  class FakeRecognition {
    lang = "";
    continuous = false;
    interimResults = false;
    onstart: (() => void) | null = null;
    onresult: ((e: unknown) => void) | null = null;
    onerror: ((e: { error: string }) => void) | null = null;
    onend: (() => void) | null = null;
    start = vi.fn();
    stop = vi.fn(() => this.onend?.());
    abort = vi.fn();
    constructor() {
      sessions.push(this as unknown as Fake);
    }
  }
  (window as unknown as { webkitSpeechRecognition: unknown }).webkitSpeechRecognition = FakeRecognition;
});

afterEach(() => {
  cleanup();
  vi.useRealTimers();
  delete (window as unknown as { webkitSpeechRecognition?: unknown }).webkitSpeechRecognition;
});

const renderMic = (onText: (t: string) => void | "stop") =>
  render(
    <NextIntlClientProvider locale="en" messages={messages}>
      <PushToTalk onText={onText} />
    </NextIntlClientProvider>,
  );

describe("mic (tap to talk)", () => {
  it("tap starts, words arrive as they are heard, tap stops", () => {
    const onText = vi.fn();
    renderMic(onText);
    fireEvent.click(screen.getByRole("button", { name: "Tap to talk" }));
    expect(screen.getByTestId("mic-starting")).toBeTruthy(); // waiting for the permission question
    act(() => last().onstart?.());
    expect(screen.getByTestId("mic-on")).toBeTruthy();

    say(["She wakes at six"], "and walks");
    expect(onText).toHaveBeenLastCalledWith("She wakes at six");
    expect(screen.getByText("and walks")).toBeTruthy();
    say(["and walks at half past six"]); // the browser sends only the newly finished phrase
    expect(onText).toHaveBeenLastCalledWith("and walks at half past six");

    fireEvent.click(screen.getByRole("button", { name: "Tap to stop" }));
    expect(last().stop).toHaveBeenCalled();
    expect(screen.queryByTestId("mic-on")).toBeNull();
    expect(screen.getByRole("button", { name: "Tap to talk" })).toBeTruthy();
    expect(screen.queryByRole("alert")).toBeNull();
  });

  it("keeps listening across phrases (phones end after each one) until the user taps stop", () => {
    const onText = vi.fn();
    renderMic(onText);
    fireEvent.click(screen.getByRole("button", { name: "Tap to talk" }));
    act(() => last().onstart?.());
    say(["first part"]);
    act(() => last().onend?.()); // the phone ended the phrase
    expect(sessions).toHaveLength(2);
    act(() => last().onstart?.());
    say(["second part"]);
    expect(onText.mock.calls.map((c) => c[0])).toEqual(["first part", "second part"]);
    expect(screen.getByTestId("mic-on")).toBeTruthy();
  });

  it("does not stay stuck on 'listening' when the browser never starts", () => {
    renderMic(() => {});
    fireEvent.click(screen.getByRole("button", { name: "Tap to talk" }));
    act(() => vi.advanceTimersByTime(8_000));
    expect(last().abort).toHaveBeenCalled();
    expect(screen.getByRole("alert").textContent).toBe("The microphone did not start. Please try again, or type.");
    expect(screen.getByRole("button", { name: "Tap to talk" })).toBeTruthy();
  });

  it("does not stay on when the browser never reports the end after stop", () => {
    renderMic(() => {});
    fireEvent.click(screen.getByRole("button", { name: "Tap to talk" }));
    act(() => last().onstart?.());
    say(["hello"]);
    last().stop.mockImplementation(() => {}); // a stuck browser
    fireEvent.click(screen.getByRole("button", { name: "Tap to stop" }));
    act(() => vi.advanceTimersByTime(3_000));
    expect(last().abort).toHaveBeenCalled();
    expect(screen.getByRole("button", { name: "Tap to talk" })).toBeTruthy();
  });

  it("says so when nothing was heard", () => {
    renderMic(() => {});
    fireEvent.click(screen.getByRole("button", { name: "Tap to talk" }));
    act(() => last().onstart?.());
    fireEvent.click(screen.getByRole("button", { name: "Tap to stop" }));
    expect(screen.getByRole("alert").textContent).toContain("I did not hear anything");
  });

  it("explains a blocked microphone and does not retry", () => {
    renderMic(() => {});
    fireEvent.click(screen.getByRole("button", { name: "Tap to talk" }));
    act(() => {
      last().onerror?.({ error: "not-allowed" });
      last().onend?.();
    });
    expect(sessions).toHaveLength(1);
    expect(screen.getByRole("alert").textContent).toContain("The microphone is blocked");
  });

  it("switches itself off after a minute (G3)", () => {
    renderMic(() => {});
    fireEvent.click(screen.getByRole("button", { name: "Tap to talk" }));
    act(() => last().onstart?.());
    act(() => vi.advanceTimersByTime(MAX_LISTEN_MS));
    expect(last().stop).toHaveBeenCalled();
    expect(screen.getByRole("button", { name: "Tap to talk" })).toBeTruthy();
  });

  it("stops at once when the caller asks (emergency word, G5)", () => {
    renderMic((t) => (t.includes("help me") ? "stop" : undefined));
    fireEvent.click(screen.getByRole("button", { name: "Tap to talk" }));
    act(() => last().onstart?.());
    say(["help me"]);
    expect(last().stop).toHaveBeenCalled();
    expect(screen.getByRole("button", { name: "Tap to talk" })).toBeTruthy();
  });
});

// P-032 (team test, Android Chrome): nothing happened on the first tap of her setup's mic.
describe("mic on a phone: asks for the microphone first", () => {
  const withMic = (getUserMedia: () => Promise<unknown>) =>
    Object.defineProperty(navigator, "mediaDevices", { configurable: true, value: { getUserMedia } });
  afterEach(() => {
    delete (navigator as unknown as { mediaDevices?: unknown }).mediaDevices;
  });

  it("asks for the microphone, releases it, then listens; later taps do not ask again", async () => {
    const stopTrack = vi.fn();
    const getUserMedia = vi.fn(async () => ({ getTracks: () => [{ stop: stopTrack }] }));
    withMic(getUserMedia);
    renderMic(() => {});
    fireEvent.click(screen.getByRole("button", { name: "Tap to talk" }));
    expect(screen.getByTestId("mic-starting")).toBeTruthy();
    expect(sessions).toHaveLength(0); // not yet: waiting for the permission answer
    await act(async () => {
      await Promise.resolve();
      vi.advanceTimersByTime(250);
    });
    expect(stopTrack).toHaveBeenCalled();
    expect(sessions).toHaveLength(1);
    act(() => last().onstart?.());
    expect(screen.getByTestId("mic-on")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Tap to stop" }));
    fireEvent.click(screen.getByRole("button", { name: "Tap to talk" }));
    expect(getUserMedia).toHaveBeenCalledTimes(1);
    expect(sessions).toHaveLength(2);
  });

  it("a refused microphone says how to allow it", async () => {
    withMic(async () => {
      throw Object.assign(new Error("denied"), { name: "NotAllowedError" });
    });
    renderMic(() => {});
    fireEvent.click(screen.getByRole("button", { name: "Tap to talk" }));
    await act(async () => {
      await Promise.resolve();
      await Promise.resolve();
    });
    expect(sessions).toHaveLength(0);
    expect(screen.getByRole("alert").textContent).toContain("Site settings → Microphone");
    expect(screen.getByRole("button", { name: "Tap to talk" })).toBeTruthy();
  });

  it("when the first session ends without starting, tries once more by itself", () => {
    renderMic(() => {});
    fireEvent.click(screen.getByRole("button", { name: "Tap to talk" }));
    act(() => last().onend?.());
    expect(sessions).toHaveLength(2);
    expect(screen.queryByRole("alert")).toBeNull();
    act(() => last().onend?.());
    expect(sessions).toHaveLength(2);
    expect(screen.getByRole("alert").textContent).toBe("The microphone did not start. Please try again, or type.");
  });
});

describe("speech helpers", () => {
  it("phones get one phrase per session", () => {
    expect(isPhoneBrowser("Mozilla/5.0 (Linux; Android 14; Pixel 7) Chrome/130 Mobile")).toBe(true);
    expect(isPhoneBrowser("Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X)")).toBe(true);
    expect(isPhoneBrowser("Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/130")).toBe(false);
  });

  it("maps browser errors to clear messages", () => {
    expect(speechErrorCode("not-allowed")).toBe("not-allowed");
    expect(speechErrorCode("service-not-allowed")).toBe("unavailable");
    expect(speechErrorCode("audio-capture")).toBe("unavailable");
    expect(speechErrorCode("network")).toBe("network");
    expect(speechErrorCode("no-speech")).toBe("no-speech");
  });
});
