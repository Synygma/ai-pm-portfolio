import type { MetadataRoute } from "next";
import { brand } from "@/config/brand";
import en from "../../messages/en.json";

// PWA manifest, served at /manifest.webmanifest. Icons come from `npm run icons`.
export default function manifest(): MetadataRoute.Manifest {
  return {
    id: "/",
    name: brand.appName,
    short_name: brand.appName,
    description: en.meta.description,
    start_url: "/",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#ffffff",
    theme_color: brand.themeColor,
    lang: "en",
    icons: [
      { src: brand.icons.icon192, sizes: "192x192", type: "image/png", purpose: "any" },
      { src: brand.icons.icon512, sizes: "512x512", type: "image/png", purpose: "any" },
      { src: brand.icons.maskable512, sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
