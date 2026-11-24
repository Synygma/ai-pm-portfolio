import Image from "next/image";
import Link from "next/link";
import { brand } from "@/config/brand";

// Simple phone-width screen used before sign-in (entry, login, parent placeholder).
// The chat-style shell for signed-in screens comes in C3.
export function Screen({ children, iconSize = 96 }: { children: React.ReactNode; iconSize?: number }) {
  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col items-center gap-4 bg-white px-6 py-10">
      <Image src={brand.icons.icon192} alt="" width={iconSize} height={iconSize} priority />
      <p className="text-2xl font-semibold text-[#008069]">{brand.appName}</p>
      {children}
    </main>
  );
}

const base =
  "flex min-h-12 w-full items-center justify-center rounded-full px-6 text-base font-semibold transition-colors disabled:opacity-60";
export const buttonStyles = {
  primary: `${base} bg-[#008069] text-white hover:bg-[#006d59]`,
  secondary: `${base} border-2 border-[#008069] text-[#008069] hover:bg-[#e7f5f1]`,
};

export function ButtonLink({ href, variant = "primary", children }: { href: string; variant?: keyof typeof buttonStyles; children: React.ReactNode }) {
  return (
    <Link href={href} className={buttonStyles[variant]}>
      {children}
    </Link>
  );
}
