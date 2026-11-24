// Languages the app can show. v1 ships English only; Hindi is planned for v2.
// To add Hindi: create messages/hi.json with the same keys and add "hi" here.
export const locales = ["en"] as const;
export type Locale = (typeof locales)[number];
export const defaultLocale: Locale = "en";

// Shown in the language selector as "coming soon" (not selectable yet).
export const upcomingLocales = ["hi"] as const;
