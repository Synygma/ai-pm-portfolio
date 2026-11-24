// Emergency words (5.6, G5). Deterministic matching is the primary check. English only in v1.
// Phrases are lower case; matching ignores case and punctuation and needs whole words.
// A bare "help" is deliberately NOT a trigger ("help arrived", "the helper came").

export const EMERGENCY_PHRASES: readonly string[] = [
  "emergency",
  "urgent",
  "help me",
  "please help",
  "save me",
  "ambulance",
  "i fell",
  "i have fallen",
  "i've fallen",
  "fallen down",
  "can't get up",
  "cannot get up",
  "can't breathe",
  "cannot breathe",
  "breathless",
  "chest pain",
  "heart attack",
  "stroke",
  "bleeding",
  "unconscious",
  "fainted",
  "fire",
  "call the doctor",
  "call a doctor",
];

/** Removed from the text before matching, so they never trigger an alarm. */
export const EMERGENCY_EXCLUSIONS: readonly string[] = [
  "fell asleep",
  "help arrived",
  "help has arrived",
  "helper arrived",
  "not an emergency",
  "no emergency",
  "not urgent",
  "nothing urgent",
  "no chest pain",
  "no bleeding",
  "fire the cook",
];
