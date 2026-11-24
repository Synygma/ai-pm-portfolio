// Builds a short, gentle chime as a WAV file in memory. Used for the seed reminder ("sample")
// so the voice-note bubble can play something without shipping an audio asset.

export function makeToneWav(seconds = 3, sampleRate = 16000): Uint8Array {
  const samples = Math.round(seconds * sampleRate);
  const buffer = new ArrayBuffer(44 + samples * 2);
  const view = new DataView(buffer);
  const text = (offset: number, s: string) => {
    for (let i = 0; i < s.length; i++) view.setUint8(offset + i, s.charCodeAt(i));
  };

  // RIFF / WAVE header, 16-bit mono PCM.
  text(0, "RIFF");
  view.setUint32(4, 36 + samples * 2, true);
  text(8, "WAVE");
  text(12, "fmt ");
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, 1, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * 2, true);
  view.setUint16(32, 2, true);
  view.setUint16(34, 16, true);
  text(36, "data");
  view.setUint32(40, samples * 2, true);

  // Soft notes (C5, E5, G5), each fading out over 0.5 s.
  const notes = [523.25, 659.25, 783.99];
  const noteLength = 0.5;
  for (let i = 0; i < samples; i++) {
    const t = i / sampleRate;
    const n = Math.floor(t / noteLength);
    const local = t - n * noteLength;
    const envelope = Math.exp(-local * 6) * Math.min(1, local * 200);
    const value = Math.sin(2 * Math.PI * notes[n % notes.length] * t) * envelope * 0.35;
    view.setInt16(44 + i * 2, Math.round(value * 32767), true);
  }
  return new Uint8Array(buffer);
}

/** Deterministic waveform bar heights (0.2–1) from a seed string, for the voice-note bubble. */
export function waveformBars(seed: string, count = 28): number[] {
  let h = 2166136261;
  for (let i = 0; i < seed.length; i++) h = Math.imul(h ^ seed.charCodeAt(i), 16777619);
  const bars: number[] = [];
  for (let i = 0; i < count; i++) {
    h = Math.imul(h ^ (h >>> 13), 0x5bd1e995);
    bars.push(0.2 + ((h >>> 0) % 1000) / 1250);
  }
  return bars;
}

export const PLAYBACK_SPEEDS = [1, 1.5, 2] as const;

export function nextSpeed(current: number): number {
  const i = PLAYBACK_SPEEDS.indexOf(current as (typeof PLAYBACK_SPEEDS)[number]);
  return PLAYBACK_SPEEDS[(i + 1) % PLAYBACK_SPEEDS.length];
}
