import Image from 'next/image';
import Link from 'next/link';

type LogoProps = {
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';
  /** Invert logo to white on dark backgrounds — no white box */
  onDark?: boolean;
  /** Center the logo horizontally in its container */
  centered?: boolean;
  href?: string;
  className?: string;
  priority?: boolean;
};

const heights = {
  xs: 32,
  sm: 40,
  md: 48,
  lg: 64,
  xl: 80,
  '2xl': 96,
} as const;

/** JAR wordmark aspect ratio (~830 × 287) */
const LOGO_ASPECT = 830 / 287;

export function Logo({
  size = 'md',
  onDark = false,
  centered = false,
  href,
  className = '',
  priority = false,
}: LogoProps) {
  const height = heights[size];
  const width = Math.round(height * LOGO_ASPECT);

  const image = (
    <Image
      src="/jar-logo.png"
      alt="JAR — Billing Suite"
      width={width}
      height={height}
      priority={priority}
      unoptimized
      className={`block object-contain ${centered ? 'object-center' : 'object-left'} ${onDark ? 'brightness-0 invert' : ''} ${className}`}
      style={{ height, width }}
    />
  );

  const content = (
    <div className={centered ? 'flex w-full justify-center' : 'inline-flex shrink-0 items-center'}>
      {image}
    </div>
  );

  if (href) {
    return (
      <Link
        href={href}
        className={`rounded-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-accent-500 focus-visible:ring-offset-2 ${centered ? 'block w-full' : 'inline-flex shrink-0 items-center'}`}
      >
        {content}
      </Link>
    );
  }

  return content;
}

/** Compact JAR mark */
export function LogoMark({
  className = '',
  href,
  onDark = false,
}: {
  className?: string;
  href?: string;
  onDark?: boolean;
}) {
  const height = 28;
  const width = Math.round(height * LOGO_ASPECT);

  const content = (
    <div className={`inline-flex shrink-0 items-center justify-center ${className}`}>
      <Image
        src="/jar-logo.png"
        alt="JAR"
        width={width}
        height={height}
        unoptimized
        className={`block object-contain ${onDark ? 'brightness-0 invert' : ''}`}
        style={{ height, width }}
      />
    </div>
  );

  if (href) {
    return <Link href={href} className="shrink-0">{content}</Link>;
  }

  return content;
}
