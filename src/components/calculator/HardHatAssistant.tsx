'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  X,
  Send,
  Square,
  Loader2,
  Sparkles,
  Wrench,
  GripHorizontal,
  Minus,
  Maximize2,
  Minimize2,
} from 'lucide-react';
import {
  buildAiCalcContext,
  type ExtendedCalculationResult,
} from '@/lib/calculator';
import type { AiAssistantReply, AiCalcPatch, AiSuggestion } from '@/lib/ai/types';
import {
  detectApplyIntent,
  extractApplyPatchFromDialog,
  isCalcPatchEmpty,
} from '@/lib/ai/calc-patch';

type ChatRow = { role: 'user' | 'assistant'; content: string; meta?: string };
type Pos = { x: number; y: number };
type Size = { w: number; h: number };
type Rect = Pos & Size;
type Edge = 'n' | 's' | 'e' | 'w' | 'ne' | 'nw' | 'se' | 'sw';

const MIN_W = 300;
const MIN_H = 360;
const EDGE = 6;

function clamp(n: number, min: number, max: number) {
  return Math.min(max, Math.max(min, n));
}

function fabDefaultPos(): Pos {
  const bottomGap = typeof window !== 'undefined' && window.innerWidth >= 640 ? 112 : 96;
  const h = typeof window !== 'undefined' ? window.innerHeight : 800;
  return { x: 28, y: h - bottomGap - 80 };
}

/** Окно чуть выше середины экрана */
function defaultWindowRect(): Rect {
  const vw = typeof window !== 'undefined' ? window.innerWidth : 1200;
  const vh = typeof window !== 'undefined' ? window.innerHeight : 800;
  const w = clamp(Math.round(vw * 0.34), 340, Math.min(440, vw - 24));
  const h = clamp(Math.round(vh * 0.58), 420, Math.min(560, vh - 24));
  const x = clamp(Math.round(vw * 0.08), 12, vw - w - 12);
  const y = clamp(Math.round(vh * 0.18), 12, Math.max(12, Math.round(vh * 0.42) - h / 2));
  return { x, y, w, h };
}

function maxRect(): Rect {
  const pad = 8;
  return {
    x: pad,
    y: pad,
    w: window.innerWidth - pad * 2,
    h: window.innerHeight - pad * 2,
  };
}

function textScaleFor(size: Size, maximized: boolean) {
  if (maximized) return 1.28;
  const byW = size.w / 360;
  const byH = size.h / 480;
  return clamp(Math.min(byW, byH), 1, 1.22);
}

export function HardHatAssistant({
  calculation,
  onApplySuggestion,
  onApplyPatch,
  open: openProp,
  onOpenChange,
}: {
  calculation: ExtendedCalculationResult;
  onApplySuggestion?: (s: AiSuggestion) => void;
  onApplyPatch?: (patch: AiCalcPatch) => void;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}) {
  const [openInternal, setOpenInternal] = useState(false);
  const open = openProp ?? openInternal;
  const setOpen = (next: boolean) => {
    onOpenChange?.(next);
    if (openProp === undefined) setOpenInternal(next);
  };

  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [providerHint, setProviderHint] = useState('local');
  const [messages, setMessages] = useState<ChatRow[]>([
    {
      role: 'assistant',
      content:
        'Я HELPER — знаю калькулятор Smetoplan: смета, раскрой, опалубка, заливка, поставка, узлы А4. Спросите «где раскрой?» или разберём ваши цифры.',
      meta: 'старт',
    },
  ]);
  const [suggestions, setSuggestions] = useState<AiSuggestion[]>([]);
  const [fabPos, setFabPos] = useState<Pos | null>(null);
  const [rect, setRect] = useState<Rect | null>(null);
  const [maximized, setMaximized] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  const endRef = useRef<HTMLDivElement | null>(null);
  const panelRef = useRef<HTMLDivElement | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const fabMovedRef = useRef(false);
  const restoreRef = useRef<Rect | null>(null);
  const fabPosRef = useRef<Pos | null>(null);
  const rectRef = useRef<Rect | null>(null);
  fabPosRef.current = fabPos;
  rectRef.current = rect;

  const moveRef = useRef<{
    pointerId: number;
    startX: number;
    startY: number;
    orig: Rect | Pos;
    moved: boolean;
    kind: 'fab' | 'panel' | 'resize';
    edge?: Edge;
  } | null>(null);

  useEffect(() => {
    fetch('/api/ai/assistant')
      .then((r) => r.json())
      .then((j) => {
        if (j?.providers?.preferred) setProviderHint(j.providers.preferred);
      })
      .catch(() => undefined);
    return () => {
      abortRef.current?.abort();
    };
  }, []);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, open]);

  useEffect(() => {
    if (open) setDismissed(false);
  }, [open]);

  useEffect(() => {
    setFabPos(fabDefaultPos());
    setRect(defaultWindowRect());
  }, []);

  useEffect(() => {
    if (!open) return;
    if (!rectRef.current) setRect(defaultWindowRect());
  }, [open]);

  const onWinResize = useCallback(() => {
    if (!fabMovedRef.current) setFabPos(fabDefaultPos());
    else {
      setFabPos((p) => {
        if (!p) return fabDefaultPos();
        return {
          x: clamp(p.x, 8, window.innerWidth - 96),
          y: clamp(p.y, 8, window.innerHeight - 96),
        };
      });
    }
    if (maximized) {
      setRect(maxRect());
      return;
    }
    setRect((r) => {
      if (!r) return defaultWindowRect();
      const w = clamp(r.w, MIN_W, window.innerWidth - 16);
      const h = clamp(r.h, MIN_H, window.innerHeight - 16);
      return {
        w,
        h,
        x: clamp(r.x, 8, window.innerWidth - w - 8),
        y: clamp(r.y, 8, window.innerHeight - h - 8),
      };
    });
  }, [maximized]);

  useEffect(() => {
    window.addEventListener('resize', onWinResize);
    return () => window.removeEventListener('resize', onWinResize);
  }, [onWinResize]);

  const beginFabDrag = (e: React.PointerEvent) => {
    if (e.button !== 0 || !fabPosRef.current) return;
    e.preventDefault();
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    moveRef.current = {
      pointerId: e.pointerId,
      startX: e.clientX,
      startY: e.clientY,
      orig: { ...fabPosRef.current },
      moved: false,
      kind: 'fab',
    };
  };

  const beginPanelDrag = (e: React.PointerEvent) => {
    if (e.button !== 0 || !rectRef.current || maximized) return;
    e.preventDefault();
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    moveRef.current = {
      pointerId: e.pointerId,
      startX: e.clientX,
      startY: e.clientY,
      orig: { ...rectRef.current },
      moved: false,
      kind: 'panel',
    };
  };

  const beginResize = (e: React.PointerEvent, edge: Edge) => {
    if (e.button !== 0 || !rectRef.current || maximized) return;
    e.preventDefault();
    e.stopPropagation();
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    moveRef.current = {
      pointerId: e.pointerId,
      startX: e.clientX,
      startY: e.clientY,
      orig: { ...rectRef.current },
      moved: false,
      kind: 'resize',
      edge,
    };
  };

  const onPointerMove = (e: React.PointerEvent) => {
    const d = moveRef.current;
    if (!d || d.pointerId !== e.pointerId) return;
    const dx = e.clientX - d.startX;
    const dy = e.clientY - d.startY;
    if (!d.moved && (Math.abs(dx) > 4 || Math.abs(dy) > 4)) {
      d.moved = true;
      setDragging(true);
    }
    if (!d.moved) return;

    if (d.kind === 'fab') {
      fabMovedRef.current = true;
      const o = d.orig as Pos;
      setFabPos({
        x: clamp(o.x + dx, 8, window.innerWidth - 96),
        y: clamp(o.y + dy, 8, window.innerHeight - 96),
      });
      return;
    }

    if (d.kind === 'panel') {
      const o = d.orig as Rect;
      setRect({
        ...o,
        x: clamp(o.x + dx, 8, window.innerWidth - o.w - 8),
        y: clamp(o.y + dy, 8, window.innerHeight - o.h - 8),
      });
      return;
    }

    if (d.kind === 'resize' && d.edge) {
      const o = d.orig as Rect;
      let { x, y, w, h } = o;
      const edge = d.edge;
      if (edge.includes('e')) w = o.w + dx;
      if (edge.includes('s')) h = o.h + dy;
      if (edge.includes('w')) {
        w = o.w - dx;
        x = o.x + dx;
      }
      if (edge.includes('n')) {
        h = o.h - dy;
        y = o.y + dy;
      }
      w = clamp(w, MIN_W, window.innerWidth - 16);
      h = clamp(h, MIN_H, window.innerHeight - 16);
      if (edge.includes('w')) x = clamp(o.x + (o.w - w), 8, o.x + o.w - MIN_W);
      if (edge.includes('n')) y = clamp(o.y + (o.h - h), 8, o.y + o.h - MIN_H);
      x = clamp(x, 8, window.innerWidth - w - 8);
      y = clamp(y, 8, window.innerHeight - h - 8);
      setRect({ x, y, w, h });
    }
  };

  const endPointer = (e: React.PointerEvent) => {
    const d = moveRef.current;
    if (!d || d.pointerId !== e.pointerId) return;
    const wasDrag = d.moved;
    const kind = d.kind;
    moveRef.current = null;
    setDragging(false);
    try {
      (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
    } catch {
      /* already released */
    }
    if (kind === 'fab' && !wasDrag) {
      setRect((r) => r ?? defaultWindowRect());
      setOpen(true);
    }
  };

  const toggleMaximize = () => {
    if (maximized) {
      setMaximized(false);
      setRect(restoreRef.current ?? defaultWindowRect());
      return;
    }
    if (rectRef.current) restoreRef.current = { ...rectRef.current };
    setMaximized(true);
    setRect(maxRect());
  };

  const stopAsk = useCallback(() => {
    abortRef.current?.abort();
    abortRef.current = null;
  }, []);

  const ask = async (question: string) => {
    const q = question.trim();
    if (!q || loading) return;
    setInput('');
    setLoading(true);
    const historySnapshot = messages.slice(-6);
    setMessages((m) => [...m, { role: 'user', content: q }]);
    setSuggestions([]);

    abortRef.current?.abort();
    const ac = new AbortController();
    abortRef.current = ac;

    try {
      const res = await fetch('/api/ai/assistant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: ac.signal,
        body: JSON.stringify({
          question: q,
          calcContext: buildAiCalcContext(calculation),
          history: historySnapshot.map(({ role, content }) => ({ role, content })),
        }),
      });
      if (ac.signal.aborted) return;
      const json = await res.json();
      if (!json.success || !json.data) throw new Error(json.error || 'fail');
      const data = json.data as AiAssistantReply;

      let patch = data.patch;
      let autoApply = Boolean(data.autoApply);
      if (
        detectApplyIntent(q) &&
        (!patch || isCalcPatchEmpty(patch))
      ) {
        const local = extractApplyPatchFromDialog(q, historySnapshot);
        if (!isCalcPatchEmpty(local)) {
          patch = local;
          autoApply = true;
        }
      }

      if (ac.signal.aborted) return;

      setMessages((m) => [
        ...m,
        {
          role: 'assistant',
          content: data.answer,
          meta: `${data.provider} · ${data.model}${autoApply ? ' · применено' : ''}`,
        },
      ]);
      setSuggestions(data.suggestions || []);
      setProviderHint(data.provider);

      if (autoApply && patch && !isCalcPatchEmpty(patch)) {
        onApplyPatch?.(patch);
      } else if (autoApply && data.suggestions?.length) {
        for (const s of data.suggestions) {
          if (s.field != null && s.value != null) onApplySuggestion?.(s);
        }
      }
    } catch (err) {
      if (
        (err instanceof DOMException && err.name === 'AbortError') ||
        (err instanceof Error && err.name === 'AbortError') ||
        ac.signal.aborted
      ) {
        setMessages((m) => [
          ...m,
          {
            role: 'assistant',
            content: 'Запрос остановлен.',
            meta: 'стоп',
          },
        ]);
        return;
      }
      // Offline fallback: still apply parsed numbers if user asked to set them
      if (detectApplyIntent(q)) {
        const local = extractApplyPatchFromDialog(q, historySnapshot);
        if (!isCalcPatchEmpty(local)) {
          onApplyPatch?.(local);
          setMessages((m) => [
            ...m,
            {
              role: 'assistant',
              content:
                'Сеть недоступна, но я разобрал задание и проставил параметры в калькулятор локально. Сверьте смету.',
              meta: 'offline · применено',
            },
          ]);
          return;
        }
      }
      setMessages((m) => [
        ...m,
        {
          role: 'assistant',
          content:
            'Связь с API оборвалась. Откройте панели «Проверки», «Раскрой» и «Карта заливки» — там уже лежат цифры вашего расчёта.',
          meta: 'offline',
        },
      ]);
    } finally {
      if (abortRef.current === ac) abortRef.current = null;
      setLoading(false);
    }
  };

  const providerLabel =
    providerHint === 'gemini-pro'
      ? 'Gemini Pro'
      : providerHint === 'deepseek-r1'
        ? 'DeepSeek'
        : 'Локальный мозг';

  if (!fabPos || !rect) return null;

  const scale = textScaleFor(rect, maximized);
  const msgPx = Math.round(11 * scale);
  const chipPx = Math.round(10 * scale);
  const metaPx = Math.round(9 * scale);
  const inputPx = Math.round(12 * scale);

  const edges: { edge: Edge; className: string }[] = [
    { edge: 'n', className: 'left-2 right-2 top-0 h-1.5 cursor-n-resize' },
    { edge: 's', className: 'left-2 right-2 bottom-0 h-1.5 cursor-s-resize' },
    { edge: 'e', className: 'top-2 bottom-2 right-0 w-1.5 cursor-e-resize' },
    { edge: 'w', className: 'top-2 bottom-2 left-0 w-1.5 cursor-w-resize' },
    { edge: 'nw', className: 'left-0 top-0 h-3 w-3 cursor-nw-resize' },
    { edge: 'ne', className: 'right-0 top-0 h-3 w-3 cursor-ne-resize' },
    { edge: 'sw', className: 'left-0 bottom-0 h-3 w-3 cursor-sw-resize' },
    { edge: 'se', className: 'right-0 bottom-0 h-3 w-3 cursor-se-resize' },
  ];

  return (
    <>
      {!dismissed && !open ? (
        <div className="fixed z-40" style={{ left: fabPos.x, top: fabPos.y }}>
          <button
            type="button"
            aria-label="Скрыть ассистента"
            title="Скрыть"
            onClick={() => setDismissed(true)}
            className="absolute -left-3.5 top-1.5 z-10 flex h-3.5 w-3.5 items-center justify-center rounded-full border border-slate-300 bg-white text-slate-500 shadow-sm hover:border-slate-500 hover:text-slate-800"
          >
            <X className="h-2 w-2" strokeWidth={2.5} />
          </button>
          <button
            type="button"
            aria-label="Открыть ассистента HELPER"
            onPointerDown={beginFabDrag}
            onPointerMove={onPointerMove}
            onPointerUp={endPointer}
            onPointerCancel={endPointer}
            className={`assistant-fab group flex touch-none items-end gap-2 select-none ${
              dragging ? 'cursor-grabbing' : 'cursor-grab'
            }`}
          >
            <span className="relative">
              <HelperAvatar size={72} />
              <span className="absolute -right-0.5 top-1 flex h-5 w-5 items-center justify-center rounded-full bg-emerald-500 text-[9px] font-black text-white shadow">
                AI
              </span>
            </span>
            <span className="mb-3 hidden max-w-[9rem] rounded-2xl rounded-bl-sm border border-slate-200 bg-white px-3 py-2 text-[11px] font-semibold leading-snug text-slate-700 shadow-lg opacity-0 transition pointer-events-none group-hover:opacity-100 sm:block">
              Нужна помощь с расчётом?
            </span>
          </button>
        </div>
      ) : null}

      {open ? (
        <div
          ref={panelRef}
          className={`fixed z-50 flex flex-col overflow-hidden border border-slate-700 bg-[#0B132B] shadow-2xl ${
            maximized ? 'rounded-xl' : 'rounded-2xl'
          }`}
          style={{
            left: rect.x,
            top: rect.y,
            width: rect.w,
            height: rect.h,
          }}
        >
          {!maximized
            ? edges.map(({ edge, className }) => (
                <div
                  key={edge}
                  onPointerDown={(e) => beginResize(e, edge)}
                  onPointerMove={onPointerMove}
                  onPointerUp={endPointer}
                  onPointerCancel={endPointer}
                  className={`absolute z-20 touch-none ${className}`}
                  style={{ minWidth: EDGE, minHeight: EDGE }}
                />
              ))
            : null}

          <div
            onPointerDown={beginPanelDrag}
            onPointerMove={onPointerMove}
            onPointerUp={endPointer}
            onPointerCancel={endPointer}
            onDoubleClick={(e) => {
              e.preventDefault();
              toggleMaximize();
            }}
            className={`flex shrink-0 touch-none select-none items-center justify-between border-b border-slate-700/80 px-3 py-2.5 ${
              maximized ? 'cursor-default' : dragging ? 'cursor-grabbing' : 'cursor-grab'
            }`}
          >
            <div className="flex items-center gap-2">
              <HelperAvatar size={Math.round(40 * Math.min(scale, 1.15))} />
              <div>
                <p className="flex items-center gap-1.5 text-xs font-extrabold uppercase tracking-wide text-white">
                  HELPER
                  {!maximized ? (
                    <GripHorizontal className="h-3.5 w-3.5 text-slate-500" aria-hidden />
                  ) : null}
                </p>
                <p className="text-[10px] text-slate-400">
                  сейчас: <span className="text-sky-300">{providerLabel}</span>
                  <span className="text-slate-600">
                    {maximized ? ' · на весь экран' : ' · тяните края / шапку'}
                  </span>
                </p>
              </div>
            </div>
            <div className="flex items-center gap-0.5">
              <button
                type="button"
                aria-label="Свернуть"
                title="Свернуть"
                onPointerDown={(e) => e.stopPropagation()}
                onClick={() => setOpen(false)}
                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white"
              >
                <Minus className="h-4 w-4" />
              </button>
              <button
                type="button"
                aria-label={maximized ? 'Восстановить' : 'На весь экран'}
                title={maximized ? 'Восстановить' : 'На весь экран'}
                onPointerDown={(e) => e.stopPropagation()}
                onClick={toggleMaximize}
                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white"
              >
                {maximized ? (
                  <Minimize2 className="h-4 w-4" />
                ) : (
                  <Maximize2 className="h-4 w-4" />
                )}
              </button>
              <button
                type="button"
                aria-label="Закрыть"
                title="Закрыть"
                onPointerDown={(e) => e.stopPropagation()}
                onClick={() => {
                  setOpen(false);
                  setDismissed(true);
                  setMaximized(false);
                }}
                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>

          <div className="flex shrink-0 gap-1.5 overflow-x-auto border-b border-slate-800 px-2 py-2">
            {[
              'Где раскрой арматуры?',
              'Проверь грунт по цифрам',
              'План заливки для моего объёма',
              'Где заявка на РБУ?',
            ].map((q) => (
              <button
                key={q}
                type="button"
                disabled={loading}
                onClick={() => ask(q)}
                style={{ fontSize: chipPx }}
                className="shrink-0 rounded-full border border-slate-600 bg-slate-900 px-2.5 py-1 font-semibold text-slate-300 hover:border-sky-500 hover:text-sky-200 disabled:opacity-50"
              >
                {q}
              </button>
            ))}
          </div>

          <div className="min-h-0 flex-1 space-y-2.5 overflow-y-auto px-3 py-3">
            {messages.map((m, i) => (
              <div
                key={`${i}-${m.role}`}
                style={{ fontSize: msgPx }}
                className={`rounded-xl px-3 py-2 leading-relaxed ${
                  m.role === 'user'
                    ? 'ml-[8%] bg-[#1F5A8E] text-white'
                    : 'mr-[4%] border border-slate-700 bg-slate-900/80 text-slate-200'
                }`}
              >
                <div className="whitespace-pre-wrap">{m.content}</div>
                {m.meta ? (
                  <div
                    style={{ fontSize: metaPx }}
                    className="mt-1 font-mono uppercase tracking-wide text-slate-500"
                  >
                    {m.meta}
                  </div>
                ) : null}
              </div>
            ))}
            {loading ? (
              <div
                style={{ fontSize: msgPx }}
                className="flex items-center gap-2 text-sky-300"
              >
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                Думаю по цифрам расчёта…
              </div>
            ) : null}
            <div ref={endRef} />
          </div>

          {suggestions.length > 0 ? (
            <div className="shrink-0 space-y-1.5 border-t border-slate-800 px-3 py-2">
              {suggestions.map((s) => (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => onApplySuggestion?.(s)}
                  style={{ fontSize: chipPx }}
                  className="flex w-full items-start gap-2 rounded-sm border border-amber-500/30 bg-amber-500/10 px-2.5 py-1.5 text-left text-amber-100 transition-colors hover:bg-amber-400/35 hover:text-white"
                >
                  <Wrench className="mt-0.5 h-3 w-3 shrink-0" />
                  <span>
                    <span className="font-bold">{s.label}</span>
                    {s.reason ? (
                      <span className="mt-0.5 block text-amber-200/80">{s.reason}</span>
                    ) : null}
                  </span>
                </button>
              ))}
            </div>
          ) : null}

          <form
            className="flex shrink-0 items-center gap-1.5 border-t border-slate-700 p-2"
            onSubmit={(e) => {
              e.preventDefault();
              if (loading) return;
              ask(input);
            }}
          >
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Спросите по расчёту…"
              style={{ fontSize: inputPx }}
              disabled={loading}
              className="flex-1 rounded-sm border border-slate-700 bg-slate-900 px-3 py-2 text-white outline-none placeholder:text-slate-500 focus:border-sky-500 disabled:opacity-70"
            />
            {loading ? (
              <button
                type="button"
                onClick={stopAsk}
                aria-label="Остановить запрос"
                title="Стоп"
                className="rounded-sm bg-rose-500 p-2 text-white transition-colors hover:bg-rose-400"
              >
                <Square className="h-4 w-4 fill-current" />
              </button>
            ) : (
              <button
                type="submit"
                disabled={!input.trim()}
                aria-label="Отправить"
                className="rounded-sm bg-sky-500 p-2 text-[#0B132B] transition-colors hover:bg-sky-300 disabled:opacity-40"
              >
                <Send className="h-4 w-4" />
              </button>
            )}
          </form>

          <p
            style={{ fontSize: metaPx }}
            className="flex shrink-0 items-center gap-1 border-t border-slate-800 px-3 py-1.5 text-slate-500"
          >
            <Sparkles className="h-3 w-3 text-sky-400" />
            DeepSeek → Gemini → локальный мозг · знает карту страницы
          </p>
        </div>
      ) : null}
    </>
  );
}

function HelperAvatar({ size = 64 }: { size?: number }) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src="/assistants/helper.png?v=2"
      alt="HELPER"
      width={size}
      height={size}
      className="object-contain drop-shadow-lg"
      style={{ width: size, height: size }}
      draggable={false}
    />
  );
}
