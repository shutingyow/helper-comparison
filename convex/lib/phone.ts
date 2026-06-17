const SINGAPORE_COUNTRY_CODE = "65";

export function normalizeSingaporePhone(
  input: string | undefined | null,
): string | undefined {
  if (!input) return undefined;

  const digits = input.replace(/\D/g, "");
  if (!digits) return undefined;

  let national = digits;
  if (national.startsWith(SINGAPORE_COUNTRY_CODE)) {
    national = national.slice(SINGAPORE_COUNTRY_CODE.length);
  }

  if (national.length === 8 && /^[689]/.test(national)) {
    return `+${SINGAPORE_COUNTRY_CODE}${national}`;
  }

  if (national.length === 9 && national.startsWith("0")) {
    const trimmed = national.slice(1);
    if (trimmed.length === 8 && /^[689]/.test(trimmed)) {
      return `+${SINGAPORE_COUNTRY_CODE}${trimmed}`;
    }
  }

  if (digits.length >= 10 && digits.startsWith(SINGAPORE_COUNTRY_CODE)) {
    const afterCode = digits.slice(SINGAPORE_COUNTRY_CODE.length);
    if (afterCode.length === 8 && /^[689]/.test(afterCode)) {
      return `+${digits}`;
    }
  }

  return undefined;
}

export function toWhatsAppUrl(
  input: string | undefined | null,
): string | undefined {
  const normalized = normalizeSingaporePhone(input);
  if (!normalized) return undefined;
  return `https://wa.me/${normalized.replace(/\D/g, "")}`;
}
