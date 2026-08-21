import Script from 'next/script';

const CF_BEACON_TOKEN = '08fc6cb3d20d4584aceb101dd207417d';

/** Cloudflare Web Analytics — sitewide beacon (all routes via root layout). */
export function CloudflareWebAnalytics() {
  return (
    <Script
      src="https://static.cloudflareinsights.com/beacon.min.js"
      strategy="lazyOnload"
      type="module"
      data-cf-beacon={JSON.stringify({ token: CF_BEACON_TOKEN })}
    />
  );
}
