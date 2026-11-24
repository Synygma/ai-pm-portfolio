import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

// next-intl reads src/i18n/request.ts by default.
const withNextIntl = createNextIntlPlugin();

const nextConfig: NextConfig = {
  cacheComponents: true,
  partialPrefetching: true,
  experimental: {
    // Voice reminders are capped at 1 MB (src/domain/reminders.ts); leave room for form overhead.
    serverActions: { bodySizeLimit: "1200kb" },
  },
  // The world city list reads its data file from its own folder at run time: keep it unbundled.
  serverExternalPackages: ["all-the-cities", "city-timezones"],
  // Dev-only Next.js button: keep it off the bottom tab bar (it sat on top of the Chats tab).
  devIndicators: { position: "top-right" },
  // The service worker (public/sw.js) must never be cached, so updates reach every phone.
  // Capstone check (P-038): no "X-Powered-By: Next.js" banner, and standard security headers.
  poweredByHeader: false,
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          // ParCare is never shown inside another site (clickjacking).
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          // Section 2: no camera, no location; the microphone only on ParCare itself, after a tap (G3).
          { key: "Permissions-Policy", value: "camera=(), geolocation=(), microphone=(self), payment=(), usb=()" },
        ],
      },
      {
        source: "/sw.js",
        headers: [
          { key: "Content-Type", value: "application/javascript; charset=utf-8" },
          { key: "Cache-Control", value: "no-cache, no-store, must-revalidate" },
          { key: "Content-Security-Policy", value: "default-src 'self'; script-src 'self'" },
        ],
      },
    ];
  },
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default withNextIntl(nextConfig);
