/**
 * Fetch public price pages for allow-listed suppliers and build market feed JSON.
 */
import { SUPPLIER_CATALOG, todayIso } from './catalog.mjs';

function parseRub(raw) {
  if (raw == null) return null;
  const n = Number(String(raw).replace(/\s/g, '').replace(',', '.'));
  return Number.isFinite(n) && n > 100 ? Math.round(n) : null;
}

function saneConcrete(n) {
  return n != null && n >= 3500 && n <= 15000 ? n : null;
}

function saneRebar(n) {
  return n != null && n >= 40000 && n <= 120000 ? n : null;
}

async function fetchHtml(url) {
  const res = await fetch(url, {
    headers: {
      'User-Agent':
        'SmetoplanMarketBot/1.0 (+https://smetoplan.ru; market-prices; contact hello@smetoplan.ru)',
      Accept: 'text/html,application/xhtml+xml',
    },
    redirect: 'follow',
  });
  if (!res.ok) throw new Error(`HTTP ${res.status} ${url}`);
  return res.text();
}

function firstMatch(html, patterns, sanitize) {
  for (const re of patterns || []) {
    const m = html.match(re);
    if (m?.[1]) {
      const n = sanitize(parseRub(m[1]));
      if (n != null) return n;
    }
  }
  return null;
}

export async function buildFeedFromPublicPrices() {
  const asOf = todayIso();
  const suppliers = [];
  const audit = [];

  for (const entry of SUPPLIER_CATALOG) {
    const quotes = [];
    const notes = [];
    let source = 'fallback';

    try {
      if (entry.parse?.concreteUrl) {
        const html = await fetchHtml(entry.parse.concreteUrl);
        const parsed = firstMatch(
          html,
          entry.parse.concretePatterns,
          saneConcrete,
        );
        const price = parsed ?? entry.parse.fallbackConcreteB25;
        if (price) {
          quotes.push({
            sku: 'concrete_m3',
            grade: 'B25',
            priceRub: price,
            note: `Публичный прайс ${entry.parse.concreteUrl}`,
          });
          source = parsed ? 'parse' : 'fallback';
          notes.push(`concrete=${price}`);
        }
      } else if (entry.parse?.fallbackConcreteB25) {
        quotes.push({
          sku: 'concrete_m3',
          grade: 'B25',
          priceRub: entry.parse.fallbackConcreteB25,
          note: 'Каталожная цена (страница без разбора)',
        });
        notes.push(`concrete=${entry.parse.fallbackConcreteB25}`);
      }

      if (entry.parse?.rebarUrl) {
        const html = await fetchHtml(entry.parse.rebarUrl);
        const parsed = firstMatch(html, entry.parse.rebarPatterns, saneRebar);
        const price = parsed ?? entry.parse.fallbackRebarTon;
        if (price) {
          quotes.push({
            sku: 'rebar_ton',
            priceRub: price,
            note: `Мониторинг ${entry.parse.rebarUrl}`,
          });
          if (parsed) source = 'parse';
          notes.push(`rebar=${price}`);
        }
      } else if (entry.parse?.fallbackRebarTon) {
        quotes.push({
          sku: 'rebar_ton',
          priceRub: entry.parse.fallbackRebarTon,
          note: 'Каталожная цена арматуры',
        });
        notes.push(`rebar=${entry.parse.fallbackRebarTon}`);
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      audit.push({ slug: entry.slug, error: msg });
      if (entry.parse?.fallbackConcreteB25) {
        quotes.push({
          sku: 'concrete_m3',
          grade: 'B25',
          priceRub: entry.parse.fallbackConcreteB25,
          note: `Fallback после ошибки fetch: ${msg}`,
        });
      }
      if (entry.parse?.fallbackRebarTon) {
        quotes.push({
          sku: 'rebar_ton',
          priceRub: entry.parse.fallbackRebarTon,
          note: `Fallback после ошибки fetch: ${msg}`,
        });
      }
      source = 'fallback';
    }

    if (quotes.length === 0) continue;

    suppliers.push({
      slug: entry.slug,
      name: entry.name,
      kind: entry.kind,
      regionId: entry.regionId,
      city: entry.city,
      url: entry.url,
      phone: entry.phone ?? null,
      email: entry.email ?? null,
      featured: Boolean(entry.featured),
      badge: entry.badge ?? null,
      quotes,
    });
    audit.push({ slug: entry.slug, source, notes });
  }

  return {
    feed: {
      asOf,
      note: `Публичные прайсы allow-list парсеров на ${asOf}. Не оферта — уточняйте у поставщика.`,
      suppliers,
    },
    audit,
  };
}
