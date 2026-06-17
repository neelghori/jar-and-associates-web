export function formatAddress(address1?: string, address2?: string): string {
  return [address1, address2]
    .map((part) => part?.trim())
    .filter(Boolean)
    .join(', ');
}
