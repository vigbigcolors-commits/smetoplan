'use client';

import React, { useState } from 'react';
import { Download, Building2 } from 'lucide-react';
import type { PseoSnapshot } from '@/lib/pseo-snapshot';
import {
  downloadTextFile,
  OPEN_QUOTE_EVENT,
  snapshotToSpecText,
} from '@/lib/rbu-spec';

export function PseoLandingCta({ snapshot }: { snapshot: PseoSnapshot }) {
  const [downloaded, setDownloaded] = useState(false);

  const onDownload = () => {
    downloadTextFile(
      `smetoplan-spec-${snapshot.dimsLabel.replace(/[^\d×x.-]/g, '')}.txt`,
      snapshotToSpecText(snapshot)
    );
    setDownloaded(true);
  };

  const onQuote = () => {
    window.dispatchEvent(new CustomEvent(OPEN_QUOTE_EVENT));
    document.getElementById('tool-rbu')?.scrollIntoView({
      behavior: 'smooth',
      block: 'start',
    });
  };

  return (
    <div className="flex flex-wrap gap-2">
      <button
        type="button"
        onClick={onDownload}
        className="inline-flex items-center gap-2 rounded-xl bg-sky-500 px-4 py-2.5 text-sm font-bold text-[#0B132B] hover:bg-sky-400"
      >
        <Download className="h-4 w-4" />
        {downloaded ? 'Скачано — ещё раз' : 'Скачать спецификацию .txt'}
      </button>
      <button
        type="button"
        onClick={onQuote}
        className="inline-flex items-center gap-2 rounded-xl border border-slate-600 bg-slate-900 px-4 py-2.5 text-sm font-bold text-white hover:border-sky-500"
      >
        <Building2 className="h-4 w-4" />
        Заявка РБУ
      </button>
    </div>
  );
}
