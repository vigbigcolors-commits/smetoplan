/**
 * AI provider chain for Smetoplan:
 * 1) DeepSeek Chat (DEEPSEEK_API_KEY) — fast, never Reasoner by default
 * 2) Gemini (GEMINI_API_KEY)
 * 3) Local deterministic advisor from calcContext (always available)
 */

import type {
  AiAssistantReply,
  AiCalcPatch,
  AiChatMessage,
  AiProviderId,
  AiSuggestion,
  AiSuggestionField,
} from '@/lib/ai/types';
import {
  SMETOPLAN_PAGE_MAP,
  SMETOPLAN_PLATFORM_BRIEF,
  searchPageMap,
} from '@/lib/ai/platform-map';
import {
  describeCalcPatch,
  extractApplyPatchFromDialog,
  isCalcPatchEmpty,
  patchToSuggestions,
  shouldAutoApplyParams,
  stripCannotApplyClaims,
} from '@/lib/ai/calc-patch';

export type { AiAssistantReply, AiChatMessage, AiProviderId, AiSuggestion };

const ALLOWED_FIELDS = new Set<AiSuggestionField>([
  'coverMm',
  'safetyFactor',
  'spacingMm',
  'diameterMm',
  'layers',
  'soilResistanceKpa',
  'stockLengthM',
  'lengthM',
  'widthM',
  'depthM',
  'ribWidthM',
  'ribDepthM',
  'structureType',
]);

const SYSTEM_RU = `Ты — HELPER, ассистент Smetoplan.ru (синий каскер на кнопке).
Роль: суперумный прораб + сметчик + навигатор по калькулятору. Отвечай по-русски, коротко и по делу.

${SMETOPLAN_PLATFORM_BRIEF}

Правила:
1) Опирайся на calcContext + карту страницы. Не выдумывай объёмы, заводы, скидки, «соответствует СП».
1b) ЛЕНТА: в Smetoplan объём = площадь бетона×H (углы БЕЗ двойного счёта), НЕ «ось×ширина×H». Опалубка = (наружный периметр + периметры пустот)×H. Если в calcContext уже есть м³/м² — цитируй ИХ, не пересчитывай «эталон 40×0.5×1.2=24».
2) Если спрашивают «где / как открыть / найди» — назови блок и дай scrollTo на якорь.
3) Если вопрос про расчёт — используй цифры из calcContext (м³, кг, σ, R%, a, раскрой).
4) Предлагай конкретные действия в калькуляторе, не общие лекции. Ответ — короткий (до ~12 предложений), без длинных рассуждений.
5) ЗАПИСЬ В КАЛЬКУЛЯТОР — ТВОЯ ОСНОВНАЯ СУПЕРСИЛА:
   - Ты УМЕЕШЬ сам проставлять параметры. Клиент читает блок APPLY и сразу пишет числа в поля.
   - ЗАПРЕЩЕНО говорить «я не могу вносить значения», «доступно только вам», «введите вручную».
   - Если пользователь дал габариты / рёбра / a / Ø / шаг / слои / запас / эталон — СРАЗУ заполни APPLY всеми полями.
   - Если просит «поставь / примени / сам / эталон» — тоже APPLY, без инструкций «кликните тут».
   - В APPLY: lengthM, widthM, depthM, ribWidthM, ribDepthM, coverMm, diameterMm, spacingMm, layers, safetyFactor (1.0 = 0%), stockLengthM, structureType, concreteGrade.
   - structureType: slab | strip | beam | pier | wall. «Свайно-плитный / сваи / ростверк» → pier (НЕ slab). «Монолитная плита» без свай → slab.
   - Для pier: depthM = глубина свай (м), ribWidthM = диаметр/сечение сваи (м), ribDepthM = толщина плиты/ростверка (м).
   - Для wall: lengthM=длина, depthM=высота, widthM=толщина ВЕРХА, ribWidthM=толщина ПОДОШВЫ (трапеция), ribDepthM=0. НЕ путать с рёбрами плиты.
   - Пример wall APPLY: {"structureType":"wall","lengthM":12,"widthM":0.3,"depthM":2.5,"ribWidthM":0.5,"ribDepthM":0,"coverMm":40,"diameterMm":16,"spacingMm":200,"layers":2,"safetyFactor":1}
6) В тексте ответа пиши: «Проставил в калькулятор: …» и кратко что изменилось. Не учи кликать.

В конце обязательно (после текста):
<<<APPLY
{"structureType":"slab","lengthM":10,"widthM":8,"depthM":0.25,"ribWidthM":0.05,"ribDepthM":0.05,"coverMm":50,"diameterMm":12,"spacingMm":200,"layers":2,"safetyFactor":1,"stockLengthM":11.7,"concreteGrade":"M250"}
APPLY<<<
<<<SUGGESTIONS
[{"id":"...","label":"...","field":"coverMm|safetyFactor|spacingMm|diameterMm|layers|lengthM|widthM|depthM|ribWidthM|ribDepthM|soilResistanceKpa|stockLengthM|null","value":number|null,"scrollTo":"tool-rebar|tool-pour|tool-rbu|bom-estimate-total|site-params|null","reason":"..."}]
SUGGESTIONS<<<
До 12 suggestions — дублируют уже применённые поля для прозрачности.`;

function parseApplyBlock(text: string): AiCalcPatch | undefined {
  const m = text.match(/<<<APPLY\s*([\s\S]*?)\s*APPLY<<</);
  if (!m) return undefined;
  try {
    const raw = JSON.parse(m[1]) as Record<string, unknown>;
    const patch: AiCalcPatch = {};
    const numKeys: (keyof AiCalcPatch)[] = [
      'lengthM',
      'widthM',
      'depthM',
      'ribWidthM',
      'ribDepthM',
      'coverMm',
      'diameterMm',
      'spacingMm',
      'safetyFactor',
      'stockLengthM',
    ];
    for (const k of numKeys) {
      const v = raw[k];
      if (typeof v === 'number' && Number.isFinite(v)) {
        (patch as Record<string, number>)[k] = v;
      } else if (v != null && v !== 'null' && Number.isFinite(Number(v))) {
        (patch as Record<string, number>)[k] = Number(v);
      }
    }
    if (raw.layers === 1 || raw.layers === 2 || raw.layers === 3) {
      patch.layers = raw.layers;
    } else if (raw.layers != null) {
      const n = Number(raw.layers);
      if (n === 1 || n === 2 || n === 3) patch.layers = n;
    }
    const st = String(raw.structureType || '');
    if (['slab', 'strip', 'beam', 'pier', 'wall'].includes(st)) {
      patch.structureType = st as AiCalcPatch['structureType'];
    }
    const grade = String(raw.concreteGrade || '');
    if (['M150', 'M200', 'M250', 'M300', 'M350', 'M400'].includes(grade)) {
      patch.concreteGrade = grade as AiCalcPatch['concreteGrade'];
    }
    return isCalcPatchEmpty(patch) ? undefined : patch;
  } catch {
    return undefined;
  }
}

function extractJsonBlock(text: string): {
  prose: string;
  suggestions: AiSuggestion[];
  patch?: AiCalcPatch;
} {
  const patch = parseApplyBlock(text);
  const cleaned = text.replace(/<<<APPLY\s*[\s\S]*?\s*APPLY<<</, '').trim();
  const m = cleaned.match(/<<<SUGGESTIONS\s*([\s\S]*?)\s*SUGGESTIONS<<</);
  if (!m) return { prose: cleaned.trim(), suggestions: [], patch };
  const prose = cleaned.replace(m[0], '').trim();
  try {
    const raw = JSON.parse(m[1]) as unknown;
    const arr = Array.isArray(raw) ? raw : [];
    const allowedScroll = new Set(SMETOPLAN_PAGE_MAP.map((p) => p.id));
    const suggestions: AiSuggestion[] = arr
      .slice(0, 12)
      .map((s: Record<string, unknown>, i: number) => {
        const scrollRaw =
          s.scrollTo && s.scrollTo !== 'null' ? String(s.scrollTo) : undefined;
        const fieldRaw =
          s.field && s.field !== 'null' ? String(s.field) : undefined;
        const field =
          fieldRaw && ALLOWED_FIELDS.has(fieldRaw as AiSuggestionField)
            ? (fieldRaw as AiSuggestionField)
            : undefined;
        let value: number | string | undefined;
        if (typeof s.value === 'number' && Number.isFinite(s.value)) {
          value = s.value;
        } else if (typeof s.value === 'string' && s.value !== 'null') {
          const n = Number(s.value);
          value = Number.isFinite(n) ? n : s.value;
        } else if (s.value != null && s.value !== 'null') {
          const n = Number(s.value);
          if (Number.isFinite(n)) value = n;
        }
        return {
          id: String(s.id || `s${i}`),
          label: String(s.label || 'Подсказка'),
          field,
          value,
          scrollTo:
            scrollRaw && allowedScroll.has(scrollRaw) ? scrollRaw : undefined,
          reason: String(s.reason || ''),
        };
      })
      .filter((s) => s.label);
    return { prose, suggestions, patch };
  } catch {
    return { prose, suggestions: [], patch };
  }
}

function withAutoApply(
  reply: AiAssistantReply,
  question: string,
  messages: AiChatMessage[]
): AiAssistantReply {
  const dialogPatch = extractApplyPatchFromDialog(question, messages);
  const merged: AiCalcPatch = { ...dialogPatch, ...reply.patch };
  const doApply = shouldAutoApplyParams(question, messages, merged);

  if (isCalcPatchEmpty(merged)) {
    return {
      ...reply,
      answer: stripCannotApplyClaims(reply.answer),
    };
  }

  const lines = describeCalcPatch(merged);
  const fromPatch = patchToSuggestions(merged);

  if (!doApply) {
    return {
      ...reply,
      answer: stripCannotApplyClaims(reply.answer),
      suggestions: [
        ...fromPatch,
        ...reply.suggestions.filter(
          (s) => !s.field || !fromPatch.some((p) => p.field === s.field)
        ),
      ].slice(0, 6),
      patch: merged,
      autoApply: false,
    };
  }

  const answer = [
    `Готово — параметры уже проставлены в калькулятор:`,
    ...lines.map((l) => `• ${l}`),
    '',
    'Смета, раскрой и KPI пересчитаются сразу.',
  ].join('\n');

  return {
    ...reply,
    answer,
    // No wall of field cards — already written into the form
    suggestions: [
      {
        id: 'goto-params',
        label: 'Открыть параметры',
        scrollTo: 'site-params',
        reason: 'Проверить поля ввода',
      },
    ],
    autoApply: true,
    patch: merged,
  };
}

async function callGeminiPro(
  messages: AiChatMessage[],
  calcContext: unknown
): Promise<AiAssistantReply | null> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return null;

  const models = [
    process.env.GEMINI_MODEL || 'gemini-2.0-flash',
    'gemini-2.0-flash',
    'gemini-2.5-pro',
  ];
  const uniqueGemini = [...new Set(models)];

  const userBlob = messages
    .filter((m) => m.role !== 'system')
    .map((m) => `${m.role === 'user' ? 'Пользователь' : 'Ассистент'}: ${m.content}`)
    .join('\n\n');

  const prompt = `${SYSTEM_RU}

calcContext:
${JSON.stringify(calcContext)}

Диалог:
${userBlob}`;

  for (const model of uniqueGemini) {
    try {
      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: { temperature: 0.35, maxOutputTokens: 2048 },
          }),
        }
      );
      if (!res.ok) continue;
      const raw = await res.json();
      const text = raw?.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!text || typeof text !== 'string') continue;
      const { prose, suggestions, patch } = extractJsonBlock(text);
      return {
        answer: prose,
        provider: 'gemini-pro',
        model,
        suggestions,
        patch,
        disclaimer:
          'Ответ модели Gemini. Ориентир по цифрам калькулятора — не проект КЖ/ИГИ.',
      };
    } catch (err) {
      console.error('Gemini failed', model, err);
    }
  }
  return null;
}

async function callDeepSeekR1(
  messages: AiChatMessage[],
  calcContext: unknown
): Promise<AiAssistantReply | null> {
  const apiKey = process.env.DEEPSEEK_API_KEY;
  if (!apiKey) return null;

  // Только быстрый chat. Reasoner — только если явно DEEPSEEK_MODEL=deepseek-reasoner.
  const configured = (process.env.DEEPSEEK_MODEL || 'deepseek-chat').trim();
  const model =
    configured === 'deepseek-reasoner' ? 'deepseek-reasoner' : 'deepseek-chat';

  const ctrl = new AbortController();
  const timeoutMs = Number(process.env.DEEPSEEK_TIMEOUT_MS || 14_000);
  const timer = setTimeout(() => ctrl.abort(), timeoutMs);

  try {
    const res = await fetch('https://api.deepseek.com/chat/completions', {
      method: 'POST',
      signal: ctrl.signal,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        temperature: 0.2,
        max_tokens: 1200,
        messages: [
          {
            role: 'system',
            content: `${SYSTEM_RU}\n\ncalcContext:\n${JSON.stringify(calcContext)}`,
          },
          ...messages
            .filter((m) => m.role !== 'system')
            .map((m) => ({ role: m.role, content: m.content })),
        ],
      }),
    });
    if (!res.ok) {
      console.error('DeepSeek HTTP', model, res.status, await res.text());
      return null;
    }
    const raw = await res.json();
    const text = raw?.choices?.[0]?.message?.content;
    if (!text || typeof text !== 'string') return null;
    const { prose, suggestions, patch } = extractJsonBlock(text);
    return {
      answer: prose,
      provider: 'deepseek-r1',
      model,
      suggestions,
      patch,
      disclaimer:
        'Ответ DeepSeek. Ориентир по цифрам калькулятора Smetoplan — не проект КЖ/ИГИ.',
    };
  } catch (err) {
    console.error('DeepSeek failed', model, err);
    return null;
  } finally {
    clearTimeout(timer);
  }
}

/** Always-on brain from real calc numbers — no invented plants or SP stamps. */
export function localEngineerBrain(
  question: string,
  calcContext: Record<string, unknown>,
  messages: AiChatMessage[] = []
): AiAssistantReply {
  const vol = Number(calcContext.concreteVolumeM3 ?? 0);
  const rebar = Number(calcContext.rebarWeightKg ?? 0);
  const util = Number(calcContext.soilUtilizationPct ?? 0);
  const soilP = Number(calcContext.soilPressureKpa ?? 0);
  const soilR = Number(calcContext.soilResistanceKpa ?? 200);
  const waste = Number(calcContext.rebarWastePct ?? 0);
  const stock = Number(calcContext.stockBarsApprox ?? 0);
  const lap = Number(calcContext.lapMm ?? 0);
  const cover = Number(calcContext.coverMm ?? 40);
  const checks = Array.isArray(calcContext.checks) ? calcContext.checks : [];
  const q = question.toLowerCase();
  const pageHits = searchPageMap(q);

  const suggestions: AiSuggestion[] = [];
  const parts: string[] = [];

  const applyPatch = extractApplyPatchFromDialog(question, messages);
  if (shouldAutoApplyParams(question, messages, applyPatch)) {
    const lines = describeCalcPatch(applyPatch);
    parts.push(
      `Готово — параметры уже проставлены в калькулятор:\n${lines.map((l) => `• ${l}`).join('\n')}`
    );
    suggestions.push({
      id: 'goto-params',
      label: 'Открыть параметры',
      scrollTo: 'site-params',
      reason: 'Проверьте, что поля обновились',
    });
    return {
      answer: parts.join('\n\n'),
      provider: 'local',
      model: 'smetoplan-local-r1',
      suggestions: suggestions.slice(0, 2),
      autoApply: true,
      patch: applyPatch,
      disclaimer:
        'Параметры записаны в калькулятор. Сверьте объёмы с эталоном — не заменяет КЖ/ИГИ.',
    };
  }

  if (
    pageHits.length > 0 &&
    (q.includes('где') ||
      q.includes('открой') ||
      q.includes('найди') ||
      q.includes('покажи') ||
      q.includes('как ') ||
      q.includes('поиск'))
  ) {
    parts.push('Нашёл на странице калькулятора:');
    for (const hit of pageHits) {
      parts.push(`• **${hit.title}** — ${hit.how}`);
      suggestions.push({
        id: `goto-${hit.id}`,
        label: `Перейти: ${hit.title}`,
        scrollTo: hit.id,
        reason: hit.how,
      });
    }
  }

  parts.push(
    `По текущему расчёту: бетон **${vol} м³**, арматура **${rebar} кг**, σ≈**${soilP} кПа** при R=**${soilR} кПа** (использование **${util}%**), защитный слой **${cover} мм**, нахлёст ориентир **${lap} мм**, хлыстов ≈**${stock}**, отход раскроя **${waste}%**.`
  );

  if (q.includes('грунт') || q.includes('давлен') || util >= 85) {
    parts.push(
      util >= 100
        ? 'Давление на основание в критической зоне относительно введённого R. Увеличьте контактную площадь (ширину ленты / пятно) или уточните R по ИГИ — справочное R не заменяет изыскания.'
        : util >= 85
          ? 'Использование R высокое. Имеет смысл прогнать сценарии чувствительности (R −10/−20%) и не опираться на «красивую» σ без ИГИ.'
          : 'По введённому R ориентир спокойный, но это не заключение по СП 22 — для стройки нужны ИГИ.'
    );
  if (util >= 90) {
      suggestions.push({
        id: 'soil-r',
        label: 'Открыть сценарии R грунта',
        scrollTo: 'tool-sensitivity',
        reason: `Сейчас ${util}% от R — проверьте чувствительность.`,
      });
    }
  }

  if (q.includes('раскрой') || q.includes('арматур') || q.includes('хлыст')) {
    parts.push(
      `Ведомость раскроя уже посчитана: ~${stock} хлыстов, отход ${waste}%. Скачайте «Что купить завтра» и спецификацию для металлобазы — там длины марок без выдуманных заводов.`
    );
    suggestions.push({
      id: 'goto-rebar',
      label: 'Открыть раскрой',
      scrollTo: 'tool-rebar',
      reason: 'Ведомость стержней и отходов',
    });
    if (waste > 12) {
      suggestions.push({
        id: 'stock',
        label: 'Попробовать хлыст 12 м',
        field: 'stockLengthM',
        value: 12,
        reason: `Отход ${waste}% — другой складской хлыст иногда снижает обрезки.`,
      });
    }
  }

  if (q.includes('залив') || q.includes('рбу') || q.includes('миксер') || q.includes('шов')) {
    parts.push(
      `Объём ${vol} м³ — откройте «Карту заливки»: задайте объём миксера и темп м³/ч. Риск холодного шва считается от живучести и t° воздуха, без фейковых «акций РБУ». Спецификацию .txt отправляйте на выбранный вами завод.`
    );
    suggestions.push({
      id: 'goto-pour',
      label: 'Открыть карту заливки',
      scrollTo: 'tool-pour',
      reason: 'Рейсы и риск холодного шва',
    });
  }

  if (q.includes('опалуб') || q.includes('щит')) {
    parts.push(
      'Ведомость опалубки строится от площади боков расчёта: щиты/стойки — ориентир закупки, не проект опалубки. Сверьте высоту заливки с глубиной конструкции.'
    );
    suggestions.push({
      id: 'goto-formwork',
      label: 'Открыть опалубку',
      scrollTo: 'tool-formwork',
      reason: 'Щиты и стойки от площади боков',
    });
  }

  if (
    q.includes('постав') ||
    q.includes('прайс') ||
    q.includes('заявк') ||
    q.includes('спецификац')
  ) {
    parts.push(
      'Блок «Поставка» — прайс выбранного региона × ваши объёмы. Скачайте спецификацию .txt и отправьте на свой РБУ. Фейковых заводов и скидок нет.'
    );
    suggestions.push({
      id: 'goto-rbu',
      label: 'Открыть поставку',
      scrollTo: 'tool-rbu',
      reason: 'Прайс региона и спецификация',
    });
  }

  if (q.includes('защит') || q.includes('cover') || cover < 40) {
    parts.push(
      cover < 40
        ? `Сейчас a=${cover} мм — для фундаментов обычно ориентир ≥40 мм. Проверьте условия экспозиции.`
        : `Защитный слой a=${cover} мм задан в калькуляторе и уже укорачивает стержни в раскрое.`
    );
    if (cover < 40) {
      suggestions.push({
        id: 'cover40',
        label: 'Поставить a=40 мм',
        field: 'coverMm',
        value: 40,
        reason: 'Ориентир для фундаментов ≥40 мм (не замена СП).',
      });
    }
  }

  const warn = checks.filter(
    (c: { status?: string }) => c.status === 'fail' || c.status === 'warn'
  );
  if (warn.length && (q.includes('провер') || q.includes('риск') || q.includes('что не так'))) {
    parts.push(
      `В инженерных проверках ${warn.length} замечаний (warn/fail). Откройте режим «Проверки» в смете — там детали по слою, нахлёсту и грунту.`
    );
  }

  if (parts.length < 2) {
    parts.push(
      'Спросите конкретно: грунт, раскрой, заливка, опалубка, защитный слой или «что проверить перед заявкой на РБУ». Могу разобрать цифры текущего расчёта без выдумок.'
    );
  }

  parts.push(
    '_Локальный режим: ключи Gemini/DeepSeek не заданы или недоступны. Логика опирается только на calcContext._'
  );

  return {
    answer: parts.join('\n\n'),
    provider: 'local',
    model: 'smetoplan-local-r1',
    suggestions,
    disclaimer:
      'Локальный советник по цифрам калькулятора. Не заменяет КЖ, ИГИ и договор с РБУ.',
  };
}

export async function runAssistantChain(input: {
  messages: AiChatMessage[];
  calcContext: Record<string, unknown>;
  question: string;
}): Promise<AiAssistantReply> {
  // Fast path: writing params into the calculator needs no LLM
  const dialogPatch = extractApplyPatchFromDialog(input.question, input.messages);
  if (shouldAutoApplyParams(input.question, input.messages, dialogPatch)) {
    return withAutoApply(
      {
        answer: '',
        provider: 'local',
        model: 'smetoplan-instant-apply',
        suggestions: [],
        disclaimer: 'Параметры записаны локально без ожидания нейросети.',
        patch: dialogPatch,
        autoApply: true,
      },
      input.question,
      input.messages
    );
  }

  // Prefer fast DeepSeek chat; Gemini fallback; local brain last.
  const preferDeepseek = Boolean(process.env.DEEPSEEK_API_KEY);
  let reply: AiAssistantReply | null = null;

  if (preferDeepseek) {
    reply = await callDeepSeekR1(input.messages, input.calcContext);
  }

  if (!reply) {
    reply = await callGeminiPro(input.messages, input.calcContext);
  }

  if (!reply && !preferDeepseek) {
    reply = await callDeepSeekR1(input.messages, input.calcContext);
  }

  if (!reply) {
    reply = localEngineerBrain(input.question, input.calcContext, input.messages);
  }

  return withAutoApply(reply, input.question, input.messages);
}

export function resolveProviderStatus(): {
  gemini: boolean;
  deepseek: boolean;
  preferred: AiProviderId;
} {
  const gemini = Boolean(process.env.GEMINI_API_KEY);
  const deepseek = Boolean(process.env.DEEPSEEK_API_KEY);
  return {
    gemini,
    deepseek,
    preferred: deepseek ? 'deepseek-r1' : gemini ? 'gemini-pro' : 'local',
  };
}
