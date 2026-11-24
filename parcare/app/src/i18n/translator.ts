// Translations outside React (route handlers such as /api/tick, services, scripts).
// English only in v1; Hindi = add messages/hi.json and pick by the household's language.
import { createTranslator } from "next-intl";
import en from "../../messages/en.json";
import { defaultLocale } from "./config";

export function translator(namespace: string): (key: string, values?: Record<string, string | number>) => string {
  return createTranslator({ locale: defaultLocale, messages: en, namespace: namespace as never }) as unknown as (
    key: string,
    values?: Record<string, string | number>,
  ) => string;
}
