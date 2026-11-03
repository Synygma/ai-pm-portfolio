// ============================================================
//  SAFETY CHECKS
//  1. Checks what parents type (length, letters, bad words).
//  2. Checks the finished story or poem for blocked words (fast, no AI call).
//  Shared by stories and poems.
// ============================================================

export const NAME_MAX = 30;
export const FIELD_MAX = 100;

// Letters only (English or Hindi/Marathi letters), spaces allowed between words.
// \p{L} = any letter, \p{M} = Hindi/Marathi vowel signs (like ा ि ी), which are part of letters.
const NAME_PATTERN = /^[\p{L}\p{M}]+( [\p{L}\p{M}]+)*$/u;

// Words we never allow in the form. Add more here if needed (lowercase).
// Matched as whole words, so "skill" is fine even though "kill" is blocked.
const BLOCKED_WORDS = new Set([
  // violence
  "kill", "killed", "killing", "murder", "murdered", "gun", "guns", "shoot", "shooting",
  "knife", "stab", "blood", "bloody", "bomb", "terrorist", "dead", "death", "suicide",
  "torture", "weapon", "weapons",
  // adult
  "sex", "sexy", "porn", "nude", "naked", "boobs", "dick", "penis", "vagina",
  // swear words (English)
  "fuck", "fucking", "fucker", "shit", "bitch", "bastard", "asshole", "slut", "whore", "cunt",
  // swear words (Hindi/Marathi in English letters)
  "chutiya", "chutiye", "madarchod", "bhenchod", "behenchod", "bhosdike", "gaandu",
  "randi", "harami", "lavda", "lauda", "zavadya",
  // in Devanagari
  "चूतिया", "मादरचोद", "भेनचोद", "बहनचोद", "भोसड़ीके", "गांडू", "रंडी", "हरामी", "लवडा",
  "मार डालो", "खून",
]);

// Returns an error message for the parent, or "" if everything is fine.
export function checkInput({ childName, family, favourites }) {
  if (!childName) return "Please enter your child's name.";
  if (childName.length > NAME_MAX) return `Please keep the name to ${NAME_MAX} letters or fewer.`;
  if (!NAME_PATTERN.test(childName)) {
    return "Please use letters only in the name (no numbers or symbols).";
  }
  if (family.length > FIELD_MAX || favourites.length > FIELD_MAX) {
    return `Please keep each box to ${FIELD_MAX} letters or fewer.`;
  }
  if ([childName, family, favourites].some(hasBlockedWord)) {
    return "Please use kind words. This is for young children. 🙏";
  }
  return "";
}

function hasBlockedWord(text) {
  const lower = text.toLowerCase();
  // Split into words (works for English and Hindi/Marathi letters)
  const words = lower.split(/[^\p{L}\p{M}]+/u).filter(Boolean);
  if (words.some((w) => BLOCKED_WORDS.has(w))) return true;
  // Blocked phrases with a space (e.g. "मार डालो")
  for (const blocked of BLOCKED_WORDS) {
    if (blocked.includes(" ") && lower.includes(blocked)) return true;
  }
  return false;
}

// ---------- Fast check on the finished story / poem ----------
// Used by both pages. No extra AI call (that used to double the waiting time).
// The strict safety rules are in lib/storyPrompt.js and lib/poemPrompt.js.

// true = no blocked words found in the finished text.
export function isTextClean(text) {
  return !hasBlockedWord(text);
}
