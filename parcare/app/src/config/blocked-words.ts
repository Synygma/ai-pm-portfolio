// Words the app's OWN digest text must never contain (G13: no diagnosis, never label illness or
// mood). The parent's quoted words are hers and are shown exactly; this list checks only text
// that ParCare generates (pattern notes, labels it puts into sentences).
// A trailing "*" matches word stems ("diagnos*" = diagnosis, diagnosed); others match whole words
// only, so "sad" never blocks "sadhana".

export const BLOCKED_DIAGNOSIS_WORDS: readonly string[] = [
  "diagnos*",
  "symptom*",
  "diseas*",
  "disorder",
  "illness",
  "sick",
  "unwell",
  "depress*",
  "anxious",
  "anxiety",
  "lonely",
  "loneliness",
  "sad",
  "confused",
  "confusion",
  "dementia",
  "alzheimer*",
  "decline",
  "deteriorat*",
  "frail",
  "at risk",
  "worrying",
  "concerning",
  "abnormal",
  "compliance",
  "score",
];
