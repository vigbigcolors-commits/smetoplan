import { NextResponse } from 'next/server';
import { runAssistantChain } from '@/lib/ai/providers';

/**
 * AI helper for estimate commentary.
 * Chain: Gemini Pro → DeepSeek R1 → local calcContext brain.
 */
export async function POST(request: Request) {
  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json(
      { success: false, error: 'Invalid JSON' },
      { status: 400 }
    );
  }

  const dimensions = (body.dimensions || {}) as {
    length?: number;
    width?: number;
    depth?: number;
  };
  const concreteGrade = String(body.concreteGrade || 'M300');
  const soilPressure = Number(body.soilPressure || 0);
  const safetyFactor = Number(body.safetyFactor || 1.15);
  const totalVolume = Number(body.totalVolume || 0);
  const structureType = String(body.structureType || 'slab');
  const calcContext =
    body.calcContext && typeof body.calcContext === 'object'
      ? (body.calcContext as Record<string, unknown>)
      : {};

  const question = `Сделай краткий инженерный комментарий к смете (не КЖ).
Тип: ${structureType}. Габариты: ${dimensions.length}×${dimensions.width}×${dimensions.depth} м.
Бетон: ${concreteGrade}. Запас объёма: ${safetyFactor}. σ≈${soilPressure} кПа. V=${totalVolume} м³.
Верни: оценка рисков по checks/util, 3 рекомендации, сроки ухода. Без «соответствует СП» и без выдуманных заводов.`;

  const reply = await runAssistantChain({
    messages: [{ role: 'user', content: question }],
    calcContext: {
      ...calcContext,
      concreteVolumeM3: calcContext.concreteVolumeM3 ?? totalVolume,
      soilPressureKpa: calcContext.soilPressureKpa ?? soilPressure,
    },
    question,
  });

  const util = Number(calcContext.soilUtilizationPct ?? 0);
  const soilR = Number(calcContext.soilResistanceKpa ?? 200);

  return NextResponse.json({
    success: true,
    data: {
      feasibilityScore: Math.max(40, 100 - Math.max(0, util - 55)),
      bearingStatus:
        util < 70 ? 'ОРИЕНТИР В НОРМЕ' : util < 100 ? 'ПРЕДУПРЕЖДЕНИЕ' : 'КРИТИЧЕСКИ',
      bearingPressureRatio: `σ≈${soilPressure || calcContext.soilPressureKpa || '—'} кПа · R=${soilR} кПа · ${util}% (не ИГИ)`,
      structuralSummary: reply.answer,
      keyRecommendations: (reply.suggestions.length
        ? reply.suggestions
        : [
            {
              id: 'r1',
              label: 'Сверить R по ИГИ',
              reason: 'Справочное R не заменяет изыскания.',
            },
            {
              id: 'r2',
              label: 'Отправить раскрой на базу',
              reason: 'Ведомость уже в калькуляторе.',
            },
            {
              id: 'r3',
              label: 'Спланировать заливку',
              reason: 'Карта заливки по вашему объёму.',
            },
          ]
      )
        .slice(0, 3)
        .map((s) => ({
          title: s.label,
          impact: 'ОРИЕНТИР',
          description: s.reason,
        })),
      curingScheduleDays: {
        formworkRemovalDays: 3,
        fullLoadCapacityDays: 28,
        hydrationTip:
          'Укрытие и увлажнение 7 суток; полный набор ориентир 28 суток. Не путать с допуском техники.',
      },
      complianceNote: reply.disclaimer,
      provider: reply.provider,
      model: reply.model,
    },
  });
}
