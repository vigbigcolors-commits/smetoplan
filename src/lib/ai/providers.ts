/**
 * AI provider chain for Smetoplan:
 * 1) Gemini Pro (GEMINI_API_KEY)
 * 2) DeepSeek Reasoner / R1-class (DEEPSEEK_API_KEY)
 * 3) Local deterministic advisor from calcContext (always available)
 */

import type {
  AiAssistantReply,
  AiChatMessage,
  AiProviderId,
  AiSuggestion,
} from '@/lib/ai/types';
import {
  SMETOPLAN_PAGE_MAP,
  SMETOPLAN_PLATFORM_BRIEF,
  searchPageMap,
} from '@/lib/ai/platform-map';

export type { AiAssistantReply, AiChatMessage, AiProviderId, AiSuggestion };

const SYSTEM_RU = `Ты — HELPER, ассистент Smetoplan.ru (синий каскер на кнопке).
Роль: суперумный прораб + сметчик + навигатор по калькулятору. Отвечай по-русски, коротко и по делу.

${SMETOPLAN_PLATFORM_BRIEF}

Правила:
1) Опирайся на calcContext + карту страницы. Не выдумывай объёмы, заводы, скидки, «соответствует СП».
2) Если спрашивают «где / как открыть / найди» — назови блок и дай scrollTo на якорь.
3) Если вопрос про расчёт — используй цифры из calcContext (м³, кг, σ, R%, a, раскрой).
4) Предлагай конкретные действия в калькуляторе, не общие лекции.
5) Ответ: 2–6 коротких абзацев или список.

В конце обязательно (после текста):
<<<SUGGESTIONS
[{"id":"...","label":"...","field":"coverMm|safetyFactor|spacingMm|diameterMm|soilResistanceKpa|stockLengthM|null","value":number|null,"scrollTo":"tool-rebar|tool-pour|tool-rbu|bom-estimate-total|null","reason":"..."}]
SUGGESTIONS<<<
Максимум 3 suggestions. scrollTo — id панели на странице.`;

function extractJsonBlock(text: string): { prose: string; suggestions: AiSuggestion[] } {
  const m = text.match(/<<<SUGGESTIONS\s*([\s\S]*?)\s*SUGGESTIONS<<</);
  if (!m) return { prose: text.trim(), suggestions: [] };
  const prose = text.replace(m[0], '').trim();
  try {
    const raw = JSON.parse(m[1]) as unknown;
    const arr = Array.isArray(raw) ? raw : [];
    const allowedScroll = new Set(SMETOPLAN_PAGE_MAP.map((p) => p.id));
    const suggestions: AiSuggestion[] = arr
      .slice(0, 3)
      .map((s: Record<string, unknown>, i: number) => {
        const scrollRaw =
          s.scrollTo && s.scrollTo !== 'null' ? String(s.scrollTo) : undefined;
        return {
          id: String(s.id || `s${i}`),
          label: String(s.label || 'Подсказка'),
          field:
            s.field && s.field !== 'null'
              ? (String(s.field) as AiSuggestion['field'])
              : undefined,
          value:
            typeof s.value === 'number'
              ? s.value
              : s.value != null && s.value !== 'null'
                ? Number(s.value)
                : undefined,
          scrollTo:
            scrollRaw && allowedScroll.has(scrollRaw) ? scrollRaw : undefined,
          reason: String(s.reason || ''),
        };
      })
      .filter((s) => s.label);
    return { prose, suggestions };
  } catch {
    return { prose, suggestions: [] };
  }
}

async function callGeminiPro(
  messages: AiChatMessage[],
  calcContext: unknown
): Promise<AiAssistantReply | null> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return null;

  const models = [
    process.env.GEMINI_MODEL || 'gemini-2.5-pro',
    'gemini-2.0-flash',
  ];

  const userBlob = messages
    .filter((m) => m.role !== 'system')
    .map((m) => `${m.role === 'user' ? 'Пользователь' : 'Ассистент'}: ${m.content}`)
    .join('\n\n');

  const prompt = `${SYSTEM_RU}

calcContext:
${JSON.stringify(calcContext)}

Диалог:
${userBlob}`;

  for (const model of models) {
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
      const { prose, suggestions } = extractJsonBlock(text);
      return {
        answer: prose,
        provider: 'gemini-pro',
        model,
        suggestions,
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

  const models = [
    process.env.DEEPSEEK_MODEL || 'deepseek-reasoner',
    'deepseek-chat',
  ];

  for (const model of models) {
    try {
      const res = await fetch('https://api.deepseek.com/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model,
          temperature: 0.3,
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
        continue;
      }
      const raw = await res.json();
      const text = raw?.choices?.[0]?.message?.content;
      if (!text || typeof text !== 'string') continue;
      const { prose, suggestions } = extractJsonBlock(text);
      return {
        answer: prose,
        provider: 'deepseek-r1',
        model,
        suggestions,
        disclaimer:
          'Ответ DeepSeek. Ориентир по цифрам калькулятора Smetoplan — не проект КЖ/ИГИ.',
      };
    } catch (err) {
      console.error('DeepSeek failed', model, err);
    }
  }
  return null;
}

/** Always-on brain from real calc numbers — no invented plants or SP stamps. */
export function localEngineerBrain(
  question: string,
  calcContext: Record<string, unknown>
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
  // Prefer DeepSeek when configured (cost-efficient R1-class); Gemini if paid key present.
  const preferDeepseek = Boolean(process.env.DEEPSEEK_API_KEY);
  if (preferDeepseek) {
    const deepseek = await callDeepSeekR1(input.messages, input.calcContext);
    if (deepseek) return deepseek;
  }

  const gemini = await callGeminiPro(input.messages, input.calcContext);
  if (gemini) return gemini;

  if (!preferDeepseek) {
    const deepseek = await callDeepSeekR1(input.messages, input.calcContext);
    if (deepseek) return deepseek;
  }

  return localEngineerBrain(input.question, input.calcContext);
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
