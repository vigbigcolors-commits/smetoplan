const CANONICAL_ORIGIN = 'https://smetoplan.ru';

/** Prefer apex host; strip www so canonicals stay one host. */
function normalizeOrigin(origin: string): string {
  try {
    const url = new URL(origin);
    if (url.hostname === 'www.smetoplan.ru') {
      return CANONICAL_ORIGIN;
    }
    if (url.hostname === 'smetoplan.ru') {
      return CANONICAL_ORIGIN;
    }
    return url.origin;
  } catch {
    return CANONICAL_ORIGIN;
  }
}

/** Safe public site origin for metadata / sitemap / canonicals. */
export function getSiteUrl(): string {
  const candidates = [
    process.env.NEXT_PUBLIC_SITE_URL,
    process.env.VERCEL_PROJECT_PRODUCTION_URL
      ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
      : undefined,
    process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : undefined,
    CANONICAL_ORIGIN,
  ];

  for (const raw of candidates) {
    const value = raw?.trim();
    if (!value) continue;
    try {
      const url = new URL(value.includes('://') ? value : `https://${value}`);
      if (url.protocol === 'http:' || url.protocol === 'https:') {
        return normalizeOrigin(url.origin);
      }
    } catch {
      // try next candidate
    }
  }

  return CANONICAL_ORIGIN;
}
