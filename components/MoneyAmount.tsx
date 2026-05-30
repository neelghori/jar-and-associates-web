import { formatInrAmount } from '@/lib/invoicePayment';

type MoneyAmountProps = {
  amount: number;
  className?: string;
  variant?: 'default' | 'received' | 'pending';
};

const variantClass = {
  default: 'text-brand-800',
  received: 'text-emerald-700',
  pending: 'text-amber-700',
};

/** Single-line INR display (avoids ₹ symbol wrapping in narrow cells). */
export function MoneyAmount({ amount, className = '', variant = 'default' }: MoneyAmountProps) {
  const { prefix, value } = formatInrAmount(amount);
  return (
    <span
      className={`inline-flex items-baseline gap-1 whitespace-nowrap tabular-nums ${variantClass[variant]} ${className}`}
    >
      <span className="text-xs font-medium text-muted">{prefix}</span>
      <span className="font-semibold">{value}</span>
    </span>
  );
}
