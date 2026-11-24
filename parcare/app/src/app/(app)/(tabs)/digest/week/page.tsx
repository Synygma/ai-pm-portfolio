import { Suspense } from "react";
import { SummaryView } from "@/components/digest/SummaryView";
import { ListSkeleton } from "@/components/wa/ListSkeleton";

export default function WeeklySummaryPage() {
  return (
    <Suspense fallback={<ListSkeleton rows={3} />}>
      <SummaryView period="week" />
    </Suspense>
  );
}
