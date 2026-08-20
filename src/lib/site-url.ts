/** Prefer apex — ignore preview/vercel hosts even if env points there. */
const CANONICAL_ORIGIN = 'https://smetoplan.ru';

/**
 * Public site origin for metadata / sitemap / canonicals.
 * Always apex in production; only non-smetoplan hosts (localhost) may differ
 * when NEXT_PUBLIC_SITE_URL is an explicit local/dev URL.
 */
export function getSiteUrl(): string {
  const explicit = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (explicit) {
    try {
      const url = new URL(explicit.includes('://') ? explicit : `https://${explicit}`);
      const host = url.hostname.toLowerCase();
      if (host === 'smetoplan.ru' || host === 'www.smetoplan.ru') {
        return CANONICAL_ORIGIN;
      }
      // Preview / wrong env: never publish *.vercel.app as canonical for this brand.
      if (host.endsWith('.vercel.app') || host.includes('smetoplan')) {
        return CANONICAL_ORIGIN;
      }
      if (url.protocol === 'http:' || url.protocol === 'https:') {
        return url.origin;
      }
    } catch {
      // fall through
    }
  }

  return CANONICAL_ORIGIN;
}
