import type { ConnectionStatus } from '../hooks/useFeedbackWall';

const STATUS_DISPLAY: Record<ConnectionStatus, { label: string; dot: string; text: string }> = {
  live: { label: 'Live', dot: 'bg-emerald-400', text: 'text-emerald-200' },
  connecting: { label: 'Connecting…', dot: 'bg-slate-400', text: 'text-slate-200' },
  reconnecting: { label: 'Reconnecting…', dot: 'bg-amber-400', text: 'text-amber-200' },
};

export function LiveIndicator({ status }: { status: ConnectionStatus }) {
  const { label, dot, text } = STATUS_DISPLAY[status];
  return (
    <div
      role="status"
      aria-live="polite"
      className={`inline-flex items-center gap-2 rounded-full bg-white/10 px-3.5 py-1.5 text-sm font-semibold ring-1 ring-white/20 backdrop-blur ${text}`}
    >
      <span className="relative flex size-2.5" aria-hidden="true">
        {status === 'live' && (
          <span className="absolute inline-flex size-full rounded-full bg-emerald-400 opacity-75 motion-safe:animate-ping" />
        )}
        <span className={`relative inline-flex size-2.5 rounded-full ${dot}`} />
      </span>
      {label}
    </div>
  );
}
