// Simple line icons drawn here (no icon assets, nothing copied from any chat app).
type IconProps = { size?: number; className?: string };

const svg = (size: number, className: string | undefined, children: React.ReactNode, fill = false) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill={fill ? "currentColor" : "none"}
    stroke={fill ? "none" : "currentColor"}
    strokeWidth={2}
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
    className={className}
  >
    {children}
  </svg>
);

export const ChatsIcon = ({ size = 24, className }: IconProps) =>
  svg(size, className, <path d="M21 11.5a8.4 8.4 0 0 1-12.3 7.4L3 21l2.1-5.6A8.4 8.4 0 1 1 21 11.5Z" />);

export const DigestIcon = ({ size = 24, className }: IconProps) =>
  svg(
    size,
    className,
    <>
      <rect x="4" y="3" width="16" height="18" rx="2" />
      <path d="M8 8h8M8 12h8M8 16h5" />
    </>,
  );

export const HelperIcon = ({ size = 24, className }: IconProps) =>
  svg(
    size,
    className,
    <>
      <circle cx="9" cy="7" r="3.5" />
      <path d="M2.5 21v-1.5A5.5 5.5 0 0 1 8 14h2a5.5 5.5 0 0 1 3 .9" />
      <path d="M15 14h7l-.8 6.4a.7.7 0 0 1-.7.6h-4a.7.7 0 0 1-.7-.6L15 14Z" />
      <path d="M16.8 14c0-2.2 3.4-2.2 3.4 0" />
    </>,
  );

export const RemindersIcon = ({ size = 24, className }: IconProps) =>
  svg(
    size,
    className,
    <>
      <path d="M6 10a6 6 0 0 1 12 0c0 5 2 6.5 2 6.5H4S6 15 6 10Z" />
      <path d="M10 20a2 2 0 0 0 4 0" />
    </>,
  );

export const SettingsIcon = ({ size = 24, className }: IconProps) =>
  svg(
    size,
    className,
    <>
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1Z" />
    </>,
  );

export const BackIcon = ({ size = 24, className }: IconProps) =>
  svg(size, className, <path d="M19 12H5M11 18l-6-6 6-6" />);

export const MicIcon = ({ size = 24, className }: IconProps) =>
  svg(
    size,
    className,
    <>
      <rect x="9" y="2.5" width="6" height="12" rx="3" />
      <path d="M5 11a7 7 0 0 0 14 0M12 18v3.5" />
    </>,
  );

export const SendIcon = ({ size = 24, className }: IconProps) =>
  svg(size, className, <path d="M3.4 20.4 21 12 3.4 3.6l2.3 7.2L15 12l-9.3 1.2-2.3 7.2Z" />, true);

export const PlayIcon = ({ size = 24, className }: IconProps) =>
  svg(size, className, <path d="M7 4.5v15a.8.8 0 0 0 1.2.7l12-7.5a.8.8 0 0 0 0-1.4l-12-7.5A.8.8 0 0 0 7 4.5Z" />, true);

export const PauseIcon = ({ size = 24, className }: IconProps) =>
  svg(
    size,
    className,
    <>
      <rect x="6" y="4" width="4.5" height="16" rx="1" />
      <rect x="13.5" y="4" width="4.5" height="16" rx="1" />
    </>,
    true,
  );

export const PinIcon = ({ size = 16, className }: IconProps) =>
  svg(size, className, <path d="M12 16v6M8 3h8l-1 6 3 4H6l3-4-1-6Z" />);

/** Ticks inside outgoing bubbles: grey = sent, blue = read. */
export function Ticks({ read, label }: { read: boolean; label: string }) {
  return (
    <svg width="18" height="12" viewBox="0 0 18 12" fill="none" role="img" aria-label={label} className={read ? "text-[#53bdeb]" : "text-[#8696a0]"}>
      <path d="m1 6.5 3.2 3.2L11 2.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
      <path d="m7.5 9.2.5.5L15 2.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export const SpeakerIcon = ({ size = 24, className }: IconProps) =>
  svg(
    size,
    className,
    <>
      <path d="M4 9v6h4l5 4V5L8 9H4Z" />
      <path d="M16.5 8.5a5 5 0 0 1 0 7M19 6a8.5 8.5 0 0 1 0 12" />
    </>,
  );

export const SosIcon = ({ size = 24, className }: IconProps) =>
  svg(
    size,
    className,
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v6M12 16.5v.5" />
    </>,
  );
