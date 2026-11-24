// Emergency-word detection (5.6, G5). Pure and deterministic.

import { EMERGENCY_EXCLUSIONS, EMERGENCY_PHRASES } from "@/config/emergency-words";

function normalise(text: string): string {
  return ` ${text
    .toLowerCase()
    .replace(/[‘’ʼ]/g, "'")
    .replace(/[^a-z0-9' ]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()} `;
}

/** The first emergency phrase found in the text, or null. Exclusions are removed first. */
export function findEmergencyWord(text: string): string | null {
  let t = normalise(text);
  for (const ex of EMERGENCY_EXCLUSIONS) t = t.split(` ${normalise(ex).trim()} `).join(" ");
  for (const phrase of EMERGENCY_PHRASES) {
    if (t.includes(` ${normalise(phrase).trim()} `)) return phrase;
  }
  return null;
}
