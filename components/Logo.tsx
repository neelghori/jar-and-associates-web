import Image from 'next/image';
import Link from 'next/link';

type LogoProps = {
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  /** White padded frame — use on navy sidebar / auth panel */
  onDark?: boolean;
  href?: string;
  className?: string;
  priority?: boolean;
};

const heights = {
  xs: 32,
  sm: 40,
  md: 48,
  lg: 56,
  xl: 72,
} as const;

export function Logo({
  size = 'md',
  onDark = false,
  href,
  className = '',
  priority = false,
}: LogoProps) {
  const height = heights[size];

  const image = (
    <Image
      src="/logo.png"
      alt="JAR & Associates — Billing Suite"
      width={height * 2.2}
      height={height}
      priority={priority}
      className={`object-contain object-left ${onDark ? 'h-auto w-full max-w-[200px]' : 'w-auto max-w-[220px]'} ${className}`}
      style={{ height, width: 'auto', maxWidth: onDark ? 200 : 220 }}
    />
  );

  const wrapped = onDark ? (
    <div className="inline-flex rounded-xl bg-white px-3 py-2 shadow-md shadow-black/10">
      {image}
    </div>
  ) : (
    image
  );

  if (href) {
    return (
      <Link href={href} className="inline-flex items-center focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 rounded-lg">
        {wrapped}
      </Link>
    );
  }

  return wrapped;
}

/** Compact mark for top bar / profile */
export function LogoMark({ className = '', href }: { className?: string; href?: string }) {
  const content = (
    <div className={`h-10 w-10 shrink-0 overflow-hidden rounded-full bg-white p-0.5 shadow-sm ${className}`}>
      <Image
        src="/logo.png"
        alt="JAR & Associates"
        width={40}
        height={40}
        className="h-full w-full rounded-full object-cover"
      />
    </div>
  );

  if (href) {
    return <Link href={href}>{content}</Link>;
  }

  return content;
}
