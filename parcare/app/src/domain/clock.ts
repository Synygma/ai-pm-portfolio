// The app's idea of "now". With the demo clock (/demo, C5) a household can run ahead of real
// time; every time-based decision and display uses this, never Date.now() directly.

export function appNow(household: { demoClockOffsetMs: number } | null, realNow: number = Date.now()): Date {
  return new Date(realNow + (household?.demoClockOffsetMs ?? 0));
}
