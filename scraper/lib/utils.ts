const PROFILE_URL_PATTERN =
  /https?:\/\/(?:www\.)?helperplace\.com\/resume\/[^?\s#]+/gi;

export function extractHelperPlaceId(profileUrl: string): string {
  const url = new URL(profileUrl);
  const segments = url.pathname.split("/").filter(Boolean);
  const last = segments[segments.length - 1];
  if (last && /^\d+$/.test(last)) {
    return last;
  }

  const numeric = segments.find((s) => /^\d+$/.test(s));
  if (numeric) return numeric;

  return segments[segments.length - 1] ?? profileUrl;
}

export function normalizeProfileUrl(href: string): string {
  const url = new URL(href, "https://www.helperplace.com");
  url.hash = "";
  url.search = "";
  return url.toString().replace(/\/$/, "");
}

export function collectProfileUrlsFromHtml(html: string): string[] {
  const matches = html.match(PROFILE_URL_PATTERN) ?? [];
  return [...new Set(matches.map(normalizeProfileUrl))];
}

export function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function parseYears(text: string): number | undefined {
  const match = text.match(/(\d+)\s*Years?\s*Experience/i);
  return match ? Number.parseInt(match[1]!, 10) : undefined;
}

export function parseAge(text: string): number | undefined {
  const parenMatch = text.match(/\((\d+)\s*Years?\)/i);
  if (parenMatch) return Number.parseInt(parenMatch[1]!, 10);

  const inlineMatch = text.match(/(\d+)\s*years?\s*old/i);
  if (inlineMatch) return Number.parseInt(inlineMatch[1]!, 10);

  return undefined;
}

export function extractSingaporePhone(text: string): string | undefined {
  const patterns = [
    /\+65[\s-]?(?:\d[\s-]?){8}/g,
    /(?:whatsapp|wa|phone|contact|hp|mobile)[:\s]*\+?65[\s-]?(?:\d[\s-]?){8}/gi,
    /(?:whatsapp|wa|phone|contact|hp|mobile)[:\s]*(?:\d[\s-]?){8}/gi,
    /\b[89]\d{3}[\s-]?\d{4}\b/g,
  ];

  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match?.[0]) {
      const digits = match[0].replace(/\D/g, "");
      if (digits.length === 8) return `+65${digits}`;
      if (digits.length === 10 && digits.startsWith("65")) return `+${digits}`;
      if (digits.length === 11 && digits.startsWith("65")) return `+${digits}`;
    }
  }

  return undefined;
}
