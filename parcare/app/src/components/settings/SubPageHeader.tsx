import Link from "next/link";
import { BackIcon } from "@/components/wa/icons";

/** Title row for pages under Settings, with a back link. */
export function SubPageHeader({ title, backLabel, href = "/settings" }: { title: string; backLabel: string; href?: string }) {
  return (
    <div className="flex items-center gap-2 px-2 pt-3">
      <Link href={href} aria-label={backLabel} className="flex h-12 w-12 items-center justify-center rounded-full text-[#54656f] hover:bg-black/5">
        <BackIcon />
      </Link>
      <h2 className="text-xl font-semibold">{title}</h2>
    </div>
  );
}
