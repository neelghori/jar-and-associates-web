import Image from 'next/image';
import Link from 'next/link';

type LogoProps = {
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';
  /** White letterforms on dark backgrounds; original green A accent is preserved */
  onDark?: boolean;
  /** Center the logo horizontally in its container */
  centered?: boolean;
  href?: string;
  className?: string;
  priority?: boolean;
};

const heights = {
  xs: 40,
  sm: 52,
  md: 62,
  lg: 82,
  xl: 102,
  '2xl': 120,
} as const;

/** Wordmark slot aspect ratio; PNGs are 1024 × 1024 with the mark letterboxed inside */
const LOGO_ASPECT = 830 / 287;

const logoImageProps = {
  src: '/jar-logo.png',
  unoptimized: true as const,
};

const logoDarkImageProps = {
  src: '/jar-logo-dark-square.png',
  unoptimized: true as const,
};

function JarLogoImage({
  height,
  width,
  onDark,
  priority,
  objectClass,
  alt,
}: {
  height: number;
  width: number;
  onDark: boolean;
  priority?: boolean;
  objectClass: string;
  alt: string;
}) {
  const sizeStyle = { height, width };

  if (!onDark) {
    return (
      <Image
        {...logoImageProps}
        alt={alt}
        width={width}
        height={height}
        priority={priority}
        className={`block object-contain ${objectClass}`}
        style={sizeStyle}
      />
    );
  }

  return (
    <Image
      {...logoDarkImageProps}
      alt={alt}
      width={width}
      height={height}
      priority={priority}
      className={`block object-contain ${objectClass}`}
      style={sizeStyle}
    />
  );
}

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
  const objectClass = centered ? 'object-center' : 'object-left';

  const image = (
    <JarLogoImage
      height={height}
      width={width}
      onDark={onDark}
      priority={priority}
      objectClass={`${objectClass} ${className}`.trim()}
      alt="JAR — Billing Suite"
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
  const height = 38;
  const width = Math.round(height * LOGO_ASPECT);

  const content = (
    <div className={`inline-flex shrink-0 items-center justify-center ${className}`}>
      <JarLogoImage
        height={height}
        width={width}
        onDark={onDark}
        objectClass="object-left"
        alt="JAR"
      />
    </div>
  );

  if (href) {
    return <Link href={href} className="shrink-0">{content}</Link>;
  }

  return content;
}
