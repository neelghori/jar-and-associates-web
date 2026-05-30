const GSTIN_CHARS = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ';

const VALID_GST_STATE_CODES = new Set([
  ...Array.from({ length: 37 }, (_, i) => String(i + 1).padStart(2, '0')),
  '97',
  '99',
]);

const PAN_HOLDER_TYPES = 'ABCFGHLJPE';

const PAN_REGEX = new RegExp(`^[A-Z]{3}[${PAN_HOLDER_TYPES}][A-Z][0-9]{4}[A-Z]$`);
const TAN_REGEX = /^[A-Z]{4}(?!00000)[0-9]{5}[A-Z]$/;
const GSTIN_FORMAT_REGEX =
  /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z][1-9A-Z]Z[0-9A-Z]$/;

export function normalizeTaxId(value: string): string {
  if (!value) return '';
  return value.trim().toUpperCase().replace(/\s+/g, '');
}

export function isValidPan(value: string): boolean {
  const pan = normalizeTaxId(value);
  if (!pan) return true;
  return pan.length === 10 && PAN_REGEX.test(pan);
}

export function isValidTan(value: string): boolean {
  const tan = normalizeTaxId(value);
  if (!tan) return true;
  return tan.length === 10 && TAN_REGEX.test(tan);
}

function gstinChecksumValid(gstin: string): boolean {
  let factor = 2;
  let sum = 0;
  const mod = 36;
  for (let i = 13; i >= 0; i -= 1) {
    const codePoint = GSTIN_CHARS.indexOf(gstin[i]);
    if (codePoint < 0) return false;
    let addend = factor * codePoint;
    factor = factor === 2 ? 1 : 2;
    addend = Math.floor(addend / mod) + (addend % mod);
    sum += addend;
  }
  const checksum = (mod - (sum % mod)) % mod;
  return GSTIN_CHARS[checksum] === gstin[14];
}

export function isValidGstin(value: string): boolean {
  const gstin = normalizeTaxId(value);
  if (!gstin) return true;
  if (gstin.length !== 15 || !GSTIN_FORMAT_REGEX.test(gstin)) return false;
  if (!VALID_GST_STATE_CODES.has(gstin.slice(0, 2))) return false;
  if (!isValidPan(gstin.slice(2, 12))) return false;
  return gstinChecksumValid(gstin);
}

export function getPanError(value: string): string | null {
  if (!value.trim()) return null;
  return isValidPan(value) ? null : 'Invalid PAN (e.g. ABCDE1234F — 5 letters, 4 digits, 1 letter).';
}

export function getTanError(value: string): string | null {
  if (!value.trim()) return null;
  return isValidTan(value) ? null : 'Invalid TAN (e.g. MUMB12345A — 4 letters, 5 digits, 1 letter).';
}

export function getGstinError(value: string): string | null {
  if (!value.trim()) return null;
  return isValidGstin(value)
    ? null
    : 'Invalid GSTIN (e.g. 27AABCU9603R1ZV — 15 characters with valid state code and check digit).';
}

export const TAX_ID_HINTS = {
  pan: 'AAAAA9999A',
  tan: 'AAAA99999A',
  gst: '99AAAAA9999A9Z9',
} as const;

export const TAX_ID_MAX_LENGTH = {
  pan: 10,
  tan: 10,
  gst: 15,
} as const;

export function validateOptionalTaxIds(fields: {
  gst?: string;
  pan?: string;
  tan?: string;
}): string | null {
  return (
    getGstinError(fields.gst ?? '') ||
    getPanError(fields.pan ?? '') ||
    getTanError(fields.tan ?? '')
  );
}

export function normalizeTaxPayload<T extends { gst?: string; pan?: string; tan?: string }>(
  data: T
): T {
  return {
    ...data,
    ...(data.gst !== undefined && { gst: normalizeTaxId(data.gst) || '' }),
    ...(data.pan !== undefined && { pan: normalizeTaxId(data.pan) || '' }),
    ...(data.tan !== undefined && { tan: normalizeTaxId(data.tan) || '' }),
  };
}
