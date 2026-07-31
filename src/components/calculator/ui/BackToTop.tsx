'use client';

import React, { useEffect, useState } from 'react';
import { ArrowUp } from 'lucide-react';

export function BackToTop() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > 480);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  if (!visible) return null;

  return (
    <button
      type="button"
      aria-label="Наверх"
      onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
      className="fixed bottom-5 right-5 z-40 flex items-center gap-2 rounded-xl border border-slate-300 bg-white/95 px-3.5 py-2.5 text-xs font-bold text-slate-800 shadow-lg backdrop-blur transition hover:border-[#1F5A8E] hover:text-[#1F5A8E]"
    >
      <ArrowUp className="h-4 w-4" />
      <span className="hidden sm:inline">Наверх</span>
    </button>
  );
}
