import { Baloo_2 } from "next/font/google";
import "./globals.css";

// Baloo 2 is a friendly, rounded font that also supports Hindi and Marathi letters.
const baloo = Baloo_2({
  variable: "--font-baloo",
  subsets: ["latin", "devanagari"],
});

export const metadata = {
  title: "Meri Kahani — Bedtime stories starring your child",
  description:
    "Make a personalized bedtime story for your child in English, Hindi or Marathi.",
};

export const viewport = {
  themeColor: "#0b1437",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={`${baloo.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
