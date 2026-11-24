import type { Metadata, Viewport } from "next";
import { NextIntlClientProvider } from "next-intl";
import { getTranslations } from "next-intl/server";
import { ServiceWorkerRegister } from "@/components/ServiceWorkerRegister";
import { brand } from "@/config/brand";
import { defaultLocale } from "@/i18n/config";
import "./globals.css";

// favicon.ico, icon.png and apple-icon.png in this folder are added to <head> by Next.js;
// manifest.ts adds the PWA manifest link.
export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("meta");
  return {
    title: brand.appName,
    description: t("description"),
    applicationName: brand.appName,
    appleWebApp: { capable: true, title: brand.appName, statusBarStyle: "default" },
  };
}

export const viewport: Viewport = {
  themeColor: brand.themeColor,
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang={defaultLocale} className="h-full antialiased">
      {/* Phone-width column; on wider screens it sits centred like a phone frame. */}
      <body className="flex min-h-full justify-center bg-[#d1d7db]">
        <div className="relative flex min-h-dvh w-full max-w-[430px] flex-col bg-white shadow-xl" data-testid="app-column">
          <NextIntlClientProvider>{children}</NextIntlClientProvider>
          <ServiceWorkerRegister />
        </div>
      </body>
    </html>
  );
}
