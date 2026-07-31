'use client';

import { useEffect, useState } from 'react';
import type { MarketQuotesPayload } from '@/domain/markets/suppliers';

export function useMarketQuotes(regionId: string): {
  data: MarketQuotesPayload | null;
  loading: boolean;
  error: string | null;
} {
  const [data, setData] = useState<MarketQuotesPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    fetch(`/api/market/quotes?region=${encodeURIComponent(regionId)}`)
      .then(async (res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json() as Promise<MarketQuotesPayload>;
      })
      .then((payload) => {
        if (!cancelled) setData(payload);
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Ошибка загрузки');
          setData(null);
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [regionId]);

  return { data, loading, error };
}
