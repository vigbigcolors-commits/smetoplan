/** Prefer apex host; strip www so canonicals stay one host. */
const CANONICAL_ORIGIN = 'https://smetoplan.ru';

function normalizeOrigin(origin: string): string {
  try {
    const url = new URL(origin);
    if (url.hostname === 'www.smetoplan.ru' || url.hostname === 'smetoplan.ru') {
      return CANONICAL_ORIGIN;
    }
    return url.origin;
  } catch {
    return CANONICAL_ORIGIN;
  }
}

/**
 * Public site origin for metadata / sitemap / canonicals.
 * Production always uses apex unless NEXT_PUBLIC_SITE_URL is set explicitly
 * (preview deploys can override). Never fall through to *.vercel.app.
 */
export function getSiteUrl(): string {
  const explicit = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (explicit) {
    try {
      const url = new URL(explicit.includes('://') ? explicit : `https://${explicit}`);
      if (url.protocol === 'http:' || url.protocol === 'https:') {
        return normalizeOrigin(url.origin);
      }
    } catch {
      // fall through
    }
  }

  return CANONICAL_ORIGIN;
}
