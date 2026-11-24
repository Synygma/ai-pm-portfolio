import Image from "next/image";
import { brand } from "@/config/brand";

// Green app bar with the ParCare icon (the ParCare icon replaces any chat-app branding).
export function TopBar({ title, children }: { title: string; children?: React.ReactNode }) {
  return (
    <header className="sticky top-0 z-10 flex min-h-14 items-center gap-3 bg-[#008069] px-4 pt-[env(safe-area-inset-top)] text-white">
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white">
        <Image src={brand.icons.icon192} alt="" width={32} height={32} />
      </span>
      <h1 className="flex-1 text-xl font-medium">{title}</h1>
      {children}
    </header>
  );
}
