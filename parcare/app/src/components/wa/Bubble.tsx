import { Ticks } from "./icons";

type Props = {
  direction: "in" | "out";
  /** Local "HH:MM", shown inside the bubble at the bottom right. */
  time: string;
  /** Outgoing only: whether the other side has read it (blue ticks). */
  read?: boolean;
  ticksLabel?: string;
  /** First bubble of a run from the same side gets the little tail. */
  tail?: boolean;
  children: React.ReactNode;
  testId?: string;
};

// Chat bubble: white incoming, light green outgoing, tail on the first bubble of a run,
// time (and ticks for outgoing) inside the bubble.
export function Bubble({ direction, time, read = false, ticksLabel, tail = false, children, testId }: Props) {
  const out = direction === "out";
  return (
    <div className={`flex ${out ? "justify-end" : "justify-start"} ${tail ? "mt-2" : "mt-0.5"} px-3`} data-testid={testId}>
      <div
        className={`relative max-w-[85%] rounded-lg px-2.5 pt-1.5 pb-1 text-base leading-snug text-[#111b21] shadow-[0_1px_0.5px_rgba(11,20,26,0.13)] ${
          out ? "bg-[#D9FDD3]" : "bg-white"
        } ${tail ? (out ? "rounded-tr-none" : "rounded-tl-none") : ""}`}
      >
        {tail && (
          <svg
            viewBox="0 0 8 13"
            width="8"
            height="13"
            aria-hidden="true"
            className={`absolute top-0 ${out ? "-right-2 text-[#D9FDD3]" : "-left-2 -scale-x-100 text-white"}`}
          >
            <path d="M0 0h8L1.5 8.5C.9 9.3 0 8.8 0 7.8V0Z" fill="currentColor" />
          </svg>
        )}
        <div className="space-y-1 break-words">{children}</div>
        <div className="-mb-0.5 mt-0.5 flex items-center justify-end gap-1 text-xs text-[#54656f]">
          <span>{time}</span>
          {out && <Ticks read={read} label={ticksLabel ?? ""} />}
        </div>
      </div>
    </div>
  );
}

export function DaySeparator({ label }: { label: string }) {
  return (
    <div className="my-3 flex justify-center" role="separator" aria-label={label}>
      <span className="rounded-lg bg-white/90 px-3 py-1 text-sm text-[#54656f] shadow-[0_1px_0.5px_rgba(11,20,26,0.13)]">{label}</span>
    </div>
  );
}
