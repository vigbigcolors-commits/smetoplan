import Link from 'next/link';
import { getSiteUrl } from '@/lib/site-url';

export type Crumb = { name: string; href?: string };

/** Visible breadcrumb nav + matching BreadcrumbList JSON-LD (no fictitious crumbs). */
export function Breadcrumbs({ items }: { items: Crumb[] }) {
  if (items.length < 2) return null;
  const site = getSiteUrl();

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: item.name,
      ...(item.href
        ? { item: item.href.startsWith('http') ? item.href : `${site}${item.href}` }
        : {}),
    })),
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <nav aria-label="Навигационная цепочка" className="text-sm text-slate-500">
        <ol className="flex flex-wrap items-center gap-1.5">
          {items.map((item, i) => {
            const last = i === items.length - 1;
            return (
              <li key={`${item.name}-${i}`} className="flex items-center gap-1.5">
                {i > 0 ? <span aria-hidden className="text-slate-300">/</span> : null}
                {last || !item.href ? (
                  <span className={last ? 'font-semibold text-slate-700' : undefined}>
                    {item.name}
                  </span>
                ) : (
                  <Link href={item.href} className="hover:text-[#1F5A8E] hover:underline">
                    {item.name}
                  </Link>
                )}
              </li>
            );
          })}
        </ol>
      </nav>
    </>
  );
}
