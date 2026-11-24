import Image from "next/image";

type Props = {
  /** Image path, e.g. from `getAvatar(id).image` in src/config/brand.ts. */
  src: string;
  /** Alt text. Pass "" when a visible name sits right next to the picture. */
  alt: string;
  /** Diameter in px. */
  size?: number;
  /** Shows the helper badge (a gender-neutral figure carrying a cloth bag) at the bottom-right (helper look, handoff 7.7). */
  helper?: boolean;
  /** Translated label for the helper badge (screen readers + tooltip). Required when helper is true. */
  helperLabel?: string;
  className?: string;
};

// Round avatar like a chat-app profile photo, with an optional helper badge.
export function AvatarCircle({ src, alt, size = 48, helper = false, helperLabel, className = "" }: Props) {
  const badge = Math.max(18, Math.round(size * 0.38));
  return (
    <span className={`relative inline-block shrink-0 ${className}`} style={{ width: size, height: size }}>
      <Image
        src={src}
        alt={alt}
        width={size}
        height={size}
        className="h-full w-full rounded-full object-cover bg-[#DCEFFD]"
      />
      {helper && (
        <span
          role="img"
          aria-label={helperLabel}
          title={helperLabel}
          data-testid="helper-badge"
          className="absolute flex items-center justify-center rounded-full bg-[#008069] ring-2 ring-white"
          style={{ width: badge, height: badge, right: -2, bottom: -2 }}
        >
          <HelperFigureIcon size={Math.round(badge * 0.72)} />
        </span>
      )}
    </span>
  );
}

// Gender-neutral helper figure: plain round head and shoulders (no hair, clothing or other
// gender cues) carrying a small cloth bag. Drawn here, no icon asset.
function HelperFigureIcon({ size }: { size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="9" cy="6.5" r="3.6" fill="white" />
      <path d="M2.5 21.5v-2.8A5.7 5.7 0 0 1 8.2 13h1.6a5.7 5.7 0 0 1 5.7 5.7v2.8H2.5Z" fill="white" />
      <path d="M15.6 14.2c0-3.2 6.4-3.2 6.4 0" stroke="white" strokeWidth="1.3" strokeLinecap="round" />
      <path
        d="M13.6 14.2h10.4l-1 7a.7.7 0 0 1-.7.6h-7a.7.7 0 0 1-.7-.6l-1-7Z"
        fill="white"
        stroke="#008069"
        strokeWidth="1.1"
        strokeLinejoin="round"
      />
    </svg>
  );
}
