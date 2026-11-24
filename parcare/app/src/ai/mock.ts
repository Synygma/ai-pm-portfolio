// Deterministic rule-based stand-in for the AI: used in tests and whenever GEMINI_API_KEY is
// empty. It reads English descriptions like "She wakes at 6, takes her BP tablet at 8:30 and
// 8:30 pm, walks in the park around 6:30, does puja in the evening and sleeps by 9:30."

import type { CheckinType } from "@/data/types";
import { type AiProvider, type AnswerOutcome, type MetaSuggestion, sanitizeMetaList } from "./types";

type Rule = { type: CheckinType; words: RegExp };

// Order matters: the first rule that matches a clause decides its type.
const RULES: Rule[] = [
  { type: "appointment", words: /\b(doctor|appointment|check-?up|blood test|test at|clinic|hospital|dentist)\b/ },
  { type: "medicine", words: /\b(medicine|medicines|tablet|tablets|pill|pills|insulin|dose|bp|sugar)\b/ },
  { type: "physical_activity", words: /\b(walk|walks|walking|yoga|exercise|exercises|stretch|stretching|gym)\b/ },
  // Social before puja: "meets her friends at the temple" is social time; visiting the temple is puja.
  { type: "social", words: /\b(friends?|neighbou?rs?|satsang|kitty|club|meets?|chat with)\b/ },
  { type: "puja", words: /\b(puja|pooja|prayer|prayers|prays|pray|aarti|temple|mandir|path|bhajan)\b/ },
  { type: "help_arrived", words: /\b(maid|cook|helper|bai|didi comes|driver|nurse|attendant)\b/ },
  { type: "last_checkin", words: /\b(sleep|sleeps|bed|goes to bed|night-?night|retires)\b/ },
  { type: "woken_up", words: /\b(wakes?|woke|waking|gets up|get up|up at|rises)\b/ },
];

const DEFAULT_TIME: Record<CheckinType, string | null> = {
  woken_up: "06:30",
  medicine: "09:00",
  physical_activity: "07:00",
  puja: "07:00",
  help_arrived: "09:00",
  social: "17:00",
  appointment: null,
  last_checkin: "21:30",
};

const pad = (n: number) => String(n).padStart(2, "0");

/** All clock times mentioned in a clause, as "HH:MM", using am/pm and day-part words. */
export function findTimes(clause: string): string[] {
  const text = clause.toLowerCase();
  const pmHint = /\b(evening|night|afternoon|pm|p\.m\.)\b/.test(text);
  const times: string[] = [];
  const re = /\b(\d{1,2})(?:[:.](\d{2}))?\s*(am|pm|a\.m\.|p\.m\.|o'?clock)?(?![\d%])/g;
  for (const m of text.matchAll(re)) {
    let hour = Number(m[1]);
    const minute = m[2] ? Number(m[2]) : 0;
    const suffix = m[3]?.replace(/\./g, "");
    if (hour > 23 || minute > 59) continue;
    // Ignore bare numbers that are not times ("2 rounds", "72 years") unless clearly a time.
    const before = text.slice(Math.max(0, (m.index ?? 0) - 12), m.index);
    const isTimey = Boolean(m[2] || suffix || /\b(at|by|around|about|till|until|from|after|before|near)\s*$/.test(before));
    if (!isTimey) continue;
    if (suffix === "pm" && hour < 12) hour += 12;
    else if (suffix === "am" && hour === 12) hour = 0;
    else if (!suffix && hour < 12 && pmHint && hour !== 0) {
      // "at 7 in the evening" -> 19:00; but "8:30 and 8:30 pm" handles each separately below.
      hour += 12;
    }
    times.push(`${pad(hour)}:${pad(minute)}`);
  }
  if (times.length === 0) {
    if (/\bnoon\b/.test(text)) times.push("12:00");
    if (/\bmidnight\b/.test(text)) times.push("00:00");
  }
  return times;
}

/** "8:30 and 8:30 pm": the first has no am/pm, so do not let the later "pm" shift it. */
function timesForClause(clause: string): string[] {
  const parts = clause.split(/\band\b|,/);
  if (parts.length > 1) {
    const each = parts.flatMap((p) => findTimes(p));
    if (each.length > 1) return each;
  }
  return findTimes(clause);
}

/** Part of day: from the item's own time when known, otherwise from words in the text. */
function dayPart(text: string, time: string | null): "morning" | "afternoon" | "evening" | null {
  if (time) {
    const hour = Number(time.slice(0, 2));
    return hour < 12 ? "morning" : hour < 17 ? "afternoon" : "evening";
  }
  if (/\b(evening|night|pm)\b/.test(text)) return "evening";
  if (/\b(afternoon|lunch)\b/.test(text)) return "afternoon";
  if (/\b(morning|am|breakfast|early)\b/.test(text)) return "morning";
  return null;
}

function labelFor(type: CheckinType, text: string, time: string | null): string {
  const when = dayPart(text, time);
  switch (type) {
    case "woken_up":
      return "Woken up";
    case "medicine": {
      const kind = /\bbp\b|blood pressure/.test(text) ? "BP medicine" : /\bsugar\b|insulin|diabet/.test(text) ? "Sugar medicine" : "Medicine";
      return when ? `${kind} (${when})` : kind;
    }
    case "physical_activity": {
      const what = /\byoga\b/.test(text) ? "yoga" : /\bexercis/.test(text) ? "exercise" : "walk";
      if (what === "walk") return when === "evening" ? "Evening walk" : when === "afternoon" ? "Afternoon walk" : "Morning walk";
      return when ? `${when[0].toUpperCase()}${when.slice(1)} ${what}` : what[0].toUpperCase() + what.slice(1);
    }
    case "puja":
      return when === "evening" ? "Evening puja" : when === "morning" ? "Morning puja" : "Puja";
    case "help_arrived":
      return /\bcook\b/.test(text) ? "Cook arrives" : /\bmaid\b|\bbai\b|\bdidi\b/.test(text) ? "Maid arrives" : /\bnurse\b|attendant/.test(text) ? "Nurse arrives" : "Help arrives";
    case "social":
      return /\bsatsang\b/.test(text) ? "Satsang" : /\bneighbou?r/.test(text) ? "Time with neighbours" : "Time with friends";
    case "appointment":
      return /\bblood test\b|\btest\b/.test(text) && !/\bdoctor\b/.test(text) ? "Medical test" : "Doctor appointment";
    case "last_checkin":
      return "Last check-in of the day";
  }
}

/** Splits a description into clauses ("..., then ...", sentences, new lines). */
export function splitClauses(transcript: string): string[] {
  return transcript
    .replace(/\s+/g, " ")
    .split(/[.;!?\n]+|\bthen\b|\bafter that\b|\blater\b/i)
    .map((s) => s.trim())
    .filter(Boolean);
}

export function mockExtract(transcript: string): MetaSuggestion[] {
  const items: MetaSuggestion[] = [];
  for (const clause of splitClauses(transcript)) {
    // A clause can mention several things ("wakes at 6 and walks at 6:30"): split on "and" too
    // when the parts have different types.
    const pieces = clause.split(/\band\b|,/i).map((p) => p.trim()).filter(Boolean);
    const typed = pieces.map((p) => ({ p, rule: RULES.find((r) => r.words.test(p.toLowerCase())) }));
    // "take my tablet at 8:30 and again at 8:30 at night": "again" repeats the previous kind.
    typed.forEach((x, i) => {
      if (!x.rule && i > 0 && /\bagain\b/i.test(x.p) && typed[i - 1].rule) {
        const prev = typed[i - 1];
        x.rule = prev.rule;
        x.p = `${prev.p.replace(/\b(at|by|around)\s+[\d:.]+\s*(am|pm|a\.m\.|p\.m\.)?/gi, "").trim()} ${x.p}`;
      }
    });
    const distinctTypes = new Set(typed.filter((x) => x.rule).map((x) => x.rule!.type));
    const units = distinctTypes.size > 1 ? typed.filter((x) => x.rule).map((x) => x.p) : [clause];

    // "gets up at 5:30 and does yoga": a later part with no time of its own shares the earlier time.
    let carried: string | null = null;
    for (const unit of units) {
      const text = unit.toLowerCase();
      const rule = RULES.find((r) => r.words.test(text));
      if (!rule) continue;
      let times = timesForClause(unit);
      // "In the evening my neighbour comes at 5 and I take my tablet at 8": the part of the day
      // said earlier in the sentence also applies to the later parts (8 -> 20:00). Only earlier:
      // "I wake at 6 … again at 8:30 at night" must not move the 6 to the evening.
      const before = clause.toLowerCase().slice(0, Math.max(0, clause.toLowerCase().indexOf(text.slice(0, 12))));
      const sentencePm = /\b(evening|night|afternoon)\b/.test(before) && !/\b(evening|night|afternoon|morning|am|pm|a\.m\.|p\.m\.)\b/.test(text);
      if (units.length > 1 && sentencePm) {
        times = times.map((t) => {
          const h = Number(t.slice(0, 2));
          return h >= 1 && h < 12 ? `${pad(h + 12)}${t.slice(2)}` : t;
        });
      }
      if (times.length > 0) carried = times[times.length - 1];
      const list =
        times.length > 0 ? (rule.type === "medicine" ? times : [times[0]]) : [units.length > 1 && carried ? carried : defaultTime(rule.type, text)];
      for (const raw of list) {
        const time = adjustForType(rule.type, text, raw);
        items.push({ label: labelFor(rule.type, text, time), checkinType: rule.type, localTime: time });
      }
    }
  }
  return sanitizeMetaList(items);
}

/** Bedtime "by 9:30" with no am/pm means the evening. */
function adjustForType(type: CheckinType, text: string, time: string | null): string | null {
  if (!time || type !== "last_checkin" || /\b(am|a\.m\.)\b/.test(text)) return time;
  const hour = Number(time.slice(0, 2));
  return hour >= 1 && hour < 12 ? `${pad(hour + 12)}${time.slice(2)}` : time;
}

function defaultTime(type: CheckinType, text: string): string | null {
  if (type === "puja" && /\bevening\b/.test(text)) return "18:30";
  if (type === "physical_activity" && /\bevening\b/.test(text)) return "17:30";
  if (type === "medicine" && /\b(evening|night)\b/.test(text)) return "20:30";
  return DEFAULT_TIME[type];
}

// Answer reading (parent app). Negative words win over positive ones ("not yet, I will walk
// later" is not done); "but" keeps both ("tired but I went" is done).
const NO_WORDS = /\b(no|not|nope|didn'?t|did not|haven'?t|have not|hasn'?t|couldn'?t|could not|can'?t|won'?t|skipped|skip|missed|forgot|tomorrow|later|not yet|nahi|nahin)\b/;
const YES_WORDS = /\b(yes|yeah|yep|haan|ha|done|did|took|taken|had|have taken|went|walked|woke|awake|up|finished|completed|ok|okay|fine|arrived|came|reached|all set)\b/;

export function mockClassify(answer: string): AnswerOutcome {
  const text = answer.toLowerCase().replace(/[’]/g, "'");
  const parts = text.split(/\bbut\b/);
  const last = parts[parts.length - 1];
  if (parts.length > 1 && YES_WORDS.test(last) && !NO_WORDS.test(last)) return "yes";
  if (NO_WORDS.test(text)) return "no";
  if (YES_WORDS.test(text)) return "yes";
  return "unclear";
}

export class MockProvider implements AiProvider {
  readonly name = "mock" as const;
  async classifyAnswer(_question: string, answer: string): Promise<AnswerOutcome> {
    return mockClassify(answer);
  }
  async extractMetaList(transcript: string): Promise<MetaSuggestion[]> {
    return mockExtract(transcript);
  }
}
