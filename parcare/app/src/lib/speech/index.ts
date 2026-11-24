// Speech-to-text behind an interface. v1: the browser's Web Speech API (English). A Sarvam
// provider can be added later for Indian languages. Typing is always offered as well.
// G3: the mic is only on after the user taps it, with a visible indicator; callers stop it.

export type SpeechErrorCode = "not-allowed" | "unavailable" | "no-speech" | "network" | "other";

export type SpeechHandlers = {
  /** The browser really started listening (after any permission prompt). */
  onStart?: () => void;
  /** All final text of this session so far, and the words still being recognised. */
  onText: (finalText: string, interimText: string) => void;
  onError: (code: SpeechErrorCode) => void;
  onEnd: () => void;
};

export interface SpeechProvider {
  isSupported(): boolean;
  start(lang: string, handlers: SpeechHandlers): void;
  /** Stop and keep what was heard. */
  stop(): void;
  /** Stop at once (used when the browser seems stuck). */
  abort(): void;
}

// Minimal typing for the (not yet standard-typed) Web Speech API.
type RecognitionResult = { isFinal: boolean; 0: { transcript: string } };
type RecognitionEvent = { resultIndex: number; results: ArrayLike<RecognitionResult> };
type Recognition = {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  onstart: (() => void) | null;
  onresult: ((e: RecognitionEvent) => void) | null;
  onerror: ((e: { error: string }) => void) | null;
  onend: (() => void) | null;
  start(): void;
  stop(): void;
  abort(): void;
};
type RecognitionCtor = new () => Recognition;

function recognitionCtor(): RecognitionCtor | null {
  if (typeof window === "undefined") return null;
  const w = window as unknown as { SpeechRecognition?: RecognitionCtor; webkitSpeechRecognition?: RecognitionCtor };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
}

/**
 * Phones: "continuous" mode is unreliable (Android Chrome repeats words, iPhones stop early), so
 * there each session is one phrase and the caller starts a new one until the user taps stop.
 */
export function isPhoneBrowser(userAgent: string): boolean {
  return /Android|iPhone|iPad|iPod/i.test(userAgent);
}

export function speechErrorCode(error: string): SpeechErrorCode {
  if (error === "not-allowed") return "not-allowed";
  if (error === "service-not-allowed" || error === "audio-capture" || error === "language-not-supported") return "unavailable";
  if (error === "no-speech" || error === "aborted") return "no-speech";
  if (error === "network") return "network";
  return "other";
}

export class WebSpeechProvider implements SpeechProvider {
  private recognition: Recognition | null = null;

  isSupported(): boolean {
    return recognitionCtor() !== null;
  }

  start(lang: string, handlers: SpeechHandlers): void {
    const Ctor = recognitionCtor();
    if (!Ctor) return handlers.onError("unavailable");
    const rec = new Ctor();
    rec.lang = lang;
    rec.continuous = !isPhoneBrowser(navigator.userAgent);
    rec.interimResults = true;
    let finalText = "";
    rec.onstart = () => handlers.onStart?.();
    rec.onresult = (e) => {
      let interim = "";
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const r = e.results[i];
        if (r.isFinal) finalText += `${r[0].transcript.trim()} `;
        else interim += r[0].transcript;
      }
      handlers.onText(finalText.trim(), interim.trim());
    };
    rec.onerror = (e) => handlers.onError(speechErrorCode(e.error));
    rec.onend = () => {
      if (this.recognition === rec) this.recognition = null;
      handlers.onEnd();
    };
    this.recognition = rec;
    try {
      rec.start();
    } catch {
      this.recognition = null;
      handlers.onError("other");
      handlers.onEnd();
    }
  }

  stop(): void {
    this.recognition?.stop();
  }

  abort(): void {
    const rec = this.recognition;
    this.recognition = null;
    if (rec) {
      rec.onend = null;
      rec.onresult = null;
      rec.onerror = null;
      rec.abort();
    }
  }
}

export function getSpeechProvider(): SpeechProvider {
  return new WebSpeechProvider();
}
