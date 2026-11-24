// Grey placeholder rows while signed-in content streams in.
export function ListSkeleton({ rows = 1 }: { rows?: number }) {
  return (
    <div aria-hidden="true">
      {Array.from({ length: rows }, (_, i) => (
        <div key={i} className="flex items-center gap-3 px-4 py-3">
          <div className="h-[52px] w-[52px] animate-pulse rounded-full bg-[#e9edef]" />
          <div className="flex-1 space-y-2">
            <div className="h-4 w-1/3 animate-pulse rounded bg-[#e9edef]" />
            <div className="h-3 w-2/3 animate-pulse rounded bg-[#e9edef]" />
          </div>
        </div>
      ))}
    </div>
  );
}
