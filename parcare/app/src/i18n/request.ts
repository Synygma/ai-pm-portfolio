import { getRequestConfig } from "next-intl/server";
import { defaultLocale } from "./config";

// Single locale for v1, no locale prefix in URLs.
// When Hindi is added, read the user's saved language here instead.
export default getRequestConfig(async () => {
  const locale = defaultLocale;
  return {
    locale,
    messages: (await import(`../../messages/${locale}.json`)).default,
  };
});
