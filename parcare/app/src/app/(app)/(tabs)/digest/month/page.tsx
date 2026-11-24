import { Suspense } from "react";
import { SummaryView } from "@/components/digest/SummaryView";
import { ListSkeleton } from "@/components/wa/ListSkeleton";

export default function MonthlySummaryPage() {
  return (
    <Suspense fallback={<ListSkeleton rows={3} />}>
      <SummaryView period="month" />
    </Suspense>
  );
}
