import Image from 'next/image';
import Link from 'next/link';

type LogoProps = {
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  /** Light padded frame on dark sidebar / auth panel */
  onDark?: boolean;
  href?: string;
  className?: string;
  priority?: boolean;
};

const heights = {
  xs: 28,
  sm: 36,
  md: 44,
  lg: 52,
  xl: 64,
} as const;

const textSizes = {
  xs: 'text-lg',
  sm: 'text-xl',
  md: 'text-2xl',
  lg: 'text-3xl',
  xl: 'text-4xl',
} as const;

/** Jar icon aspect ratio (135 × 158) */
const ICON_ASPECT = 135 / 158;

function JarIcon({
  height,
  priority = false,
  className = '',
}: {
  height: number;
  priority?: boolean;
  className?: string;
}) {
  const width = Math.round(height * ICON_ASPECT);

  return (
    <Image
      src="/jar-icon.png"
      alt=""
      width={width}
      height={height}
      priority={priority}
      aria-hidden
      className={`shrink-0 object-contain ${className}`}
      style={{ height, width }}
    />
  );
}

export function Logo({
  size = 'md',
  onDark = false,
  href,
  className = '',
  priority = false,
}: LogoProps) {
  const height = heights[size];
  const showWordmark = size !== 'xs';

  const content = (
    <div className={`inline-flex items-center gap-2.5 ${className}`} aria-label="jar — Billing Suite">
      <JarIcon height={height} priority={priority} />
      {showWordmark && (
        <span
          className={`font-display font-extrabold tracking-tight text-brand-800 ${textSizes[size]}`}
        >
          jar
        </span>
      )}
    </div>
  );

  const wrapped = onDark ? (
    <div className="inline-flex rounded-2xl bg-white/95 px-3 py-2 shadow-lg shadow-black/10 ring-1 ring-white/20">
      {content}
    </div>
  ) : (
    content
  );

  if (href) {
    return (
      <Link
        href={href}
        className="inline-flex items-center rounded-xl focus:outline-none focus-visible:ring-2 focus-visible:ring-accent-500 focus-visible:ring-offset-2"
      >
        {wrapped}
      </Link>
    );
  }

  return wrapped;
}

/** Compact jar mark for top bar / profile */
export function LogoMark({ className = '', href }: { className?: string; href?: string }) {
  const content = (
    <div
      className={`inline-flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-[14px] bg-white shadow-sm ring-1 ring-border ${className}`}
    >
      <JarIcon height={34} className="p-1" />
    </div>
  );

  if (href) {
    return <Link href={href}>{content}</Link>;
  }

  return content;
}
