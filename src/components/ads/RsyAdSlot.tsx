'use client';

import { useEffect, useId, useRef } from 'react';

declare global {
  interface Window {
    Ya?: {
      Context?: {
        AdvManager?: {
          render: (opts: {
            blockId: string;
            renderTo: string;
            async?: boolean;
          }) => void;
          destroy?: (opts: { blockId: string; renderTo?: string }) => void;
        };
      };
    };
  }
}

interface RsyAdSlotProps {
  /** Unique DOM id suffix */
  slotKey: string;
  /** Яндекс.РТБ block id from cabinet */
  blockId?: string;
  /** Bump this ONLY after user-triggered recalculation */
  reloadToken: number;
  label?: string;
  minHeight?: number;
}

/**
 * Safe РСЯ container: hard padding, no overlay, reload only on user action (reloadToken).
 * Never auto-refreshes on scroll/timer.
 */
export function RsyAdSlot({
  slotKey,
  blockId,
  reloadToken,
  label = 'Реклама',
  minHeight = 120,
}: RsyAdSlotProps) {
  const reactId = useId().replace(/:/g, '');
  const renderTo = `ya-ad-${slotKey}-${reactId}`;
  const lastToken = useRef(-1);
  const resolvedBlockId = blockId || process.env.NEXT_PUBLIC_YANDEX_ADS_ID || '';

  useEffect(() => {
    if (!resolvedBlockId) return;
    if (reloadToken === lastToken.current && lastToken.current !== -1) return;
    lastToken.current = reloadToken;

    const el = document.getElementById(renderTo);
    if (!el) return;
    el.innerHTML = '';

    const render = () => {
      const mgr = window.Ya?.Context?.AdvManager;
      if (!mgr?.render) return;
      mgr.render({
        blockId: resolvedBlockId,
        renderTo,
        async: true,
      });
    };

    if (window.Ya?.Context?.AdvManager) {
      render();
      return;
    }

    const existing = document.querySelector<HTMLScriptElement>(
      'script[data-ya-context]'
    );
    if (existing) {
      existing.addEventListener('load', render, { once: true });
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://yandex.ru/ads/system/context.js';
    script.async = true;
    script.dataset.yaContext = '1';
    script.addEventListener('load', render, { once: true });
    document.head.appendChild(script);
  }, [reloadToken, renderTo, resolvedBlockId]);

  return (
    <aside
      className="my-6 w-full overflow-hidden rounded-xl border border-slate-200 bg-slate-50"
      aria-label={label}
      data-ad-safe="rsy"
    >
      <div className="flex items-center justify-between border-b border-slate-200 px-4 py-2">
        <span className="font-mono text-[10px] font-bold uppercase tracking-wider text-slate-400">
          {label}
        </span>
        <span className="font-mono text-[10px] text-slate-400">РСЯ</span>
      </div>
      <div className="p-4" style={{ minHeight }}>
        {!resolvedBlockId ? (
          <div
            className="flex items-center justify-center rounded-lg border border-dashed border-slate-300 bg-white text-center font-mono text-xs text-slate-400"
            style={{ minHeight }}
          >
            Контейнер РСЯ · blockId не задан (NEXT_PUBLIC_YANDEX_ADS_ID)
          </div>
        ) : (
          <div id={renderTo} style={{ minHeight }} />
        )}
      </div>
    </aside>
  );
}
