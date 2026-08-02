import type { AiCalcPatch, AiSuggestion } from '@/lib/ai/types';
import type { ConcreteSpec, StructureType } from '@/lib/types';

const APPLY_RE =
  /поставь|проставь|выставь|установи|заполни|примени|внеси|задай|сам(а|и)?\b|автомат|в калькулятор|все параметр|все цифр|эталон|скорректир|настро(й|и)|подставь|запиши|сделай\s+сам/i;

const CANNOT_APPLY_RE =
  /я\s+не\s+могу[^.!?\n]{0,80}(вносить|изменить|менять|поставить|заполнить|интерфейс)|не\s+могу\s+сам[^.!?\n]{0,60}|доступно\s+только\s+вам|вы\s+должны\s+ввести|вручную\s+введите|кликните\s+по/gi;

const STRUCTURE_RE: Array<{ re: RegExp; type: StructureType }> = [
  // pier раньше slab: «свайно-плитный» содержит «плит» и иначе уезжает в монолит.
  { re: /свайн\w*|свайн[оа][-\s]?плит|ростверк|\bpier\b|свай/i, type: 'pier' },
  { re: /лент/i, type: 'strip' },
  { re: /балк|колонн/i, type: 'beam' },
  { re: /подпорн|стен/i, type: 'wall' },
  { re: /плит|монолит/i, type: 'slab' },
];

const GRADE_RE = /\b(M(?:150|200|250|300|350|400)|B(?:15|20|22\.5|25|30|35|40))\b/i;

const GRADE_FROM_B: Record<string, ConcreteSpec['grade']> = {
  B15: 'M200',
  B20: 'M250',
  'B22.5': 'M300',
  B25: 'M350',
  B30: 'M400',
  B35: 'M400',
  B40: 'M400',
};

function num(v: string | undefined): number | undefined {
  if (!v) return undefined;
  const n = Number(String(v).replace(',', '.'));
  return Number.isFinite(n) ? n : undefined;
}

function firstMatch(text: string, re: RegExp): RegExpMatchArray | null {
  return text.match(re);
}

/** User asks helper to write numbers into the calculator itself. */
export function detectApplyIntent(text: string): boolean {
  return APPLY_RE.test(text);
}

/** Enough numbers to safely write into the calculator. */
export function isSubstantialPatch(patch: AiCalcPatch): boolean {
  const hasDims =
    patch.lengthM != null && patch.widthM != null && patch.depthM != null;
  const hasRebar =
    patch.diameterMm != null &&
    (patch.spacingMm != null || patch.layers != null || patch.coverMm != null);
  return hasDims || hasRebar;
}

/**
 * Decide whether HELPER should write the patch into the calculator now.
 * Covers «поставь сам», pasting a full assignment, and apply-intent in recent chat.
 */
export function shouldAutoApplyParams(
  question: string,
  history: Array<{ role: string; content: string }>,
  patch: AiCalcPatch
): boolean {
  if (isCalcPatchEmpty(patch) || !isSubstantialPatch(patch)) return false;
  if (detectApplyIntent(question)) return true;
  if (isSubstantialPatch(extractCalcPatchFromText(question))) return true;
  const recentUser = history
    .filter((m) => m.role === 'user')
    .slice(-3)
    .map((m) => m.content)
    .join('\n');
  return detectApplyIntent(recentUser);
}

/** Remove LLM refusals like «я не могу вносить значения в интерфейс». */
export function stripCannotApplyClaims(text: string): string {
  return text
    .replace(CANNOT_APPLY_RE, '')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

/**
 * Pull calculator inputs from free-form Russian engineering text
 * (current message + recent chat history).
 */
export function extractCalcPatchFromText(text: string): AiCalcPatch {
  const patch: AiCalcPatch = {};
  if (!text.trim()) return patch;

  for (const { re, type } of STRUCTURE_RE) {
    if (re.test(text)) {
      patch.structureType = type;
      break;
    }
  }

  const dims =
    firstMatch(
      text,
      /(?:габарит\S{0,12}|плит\S{0,12}|размер\S{0,12}|L\s*[×xх])[^0-9]{0,24}(\d+(?:[.,]\d+)?)\s*[×xх]\s*(\d+(?:[.,]\d+)?)\s*[×xх]\s*(\d+(?:[.,]\d+)?)/i
    ) ||
    firstMatch(
      text,
      /(\d+(?:[.,]\d+)?)\s*[×xх]\s*(\d+(?:[.,]\d+)?)\s*[×xх]\s*(\d+(?:[.,]\d+)?)\s*м\b/i
    );
  if (dims) {
    const lengthM = num(dims[1]);
    const widthM = num(dims[2]);
    const depthM = num(dims[3]);
    if (lengthM != null) patch.lengthM = lengthM;
    if (widthM != null) patch.widthM = widthM;
    if (depthM != null) patch.depthM = depthM;
  }

  const ribs = firstMatch(
    text,
    /р[её]бр\S{0,20}[^0-9]{0,40}(\d+(?:[.,]\d+)?)\s*[×xх]\s*(\d+(?:[.,]\d+)?)/i
  );
  if (ribs) {
    const w = num(ribs[1]);
    const d = num(ribs[2]);
    if (w != null) patch.ribWidthM = w;
    if (d != null) patch.ribDepthM = d;
  }

  const cover = firstMatch(
    text,
    /защитн\S{0,12}\s*слой[^0-9]{0,16}(\d+(?:[.,]\d+)?)\s*мм|a\s*=\s*(\d+(?:[.,]\d+)?)\s*мм|cover[^0-9]{0,8}(\d+)/i
  );
  if (cover) {
    const c = num(cover[1] || cover[2] || cover[3]);
    if (c != null) patch.coverMm = c;
  }

  const dia = firstMatch(
    text,
    // Только арматура (мм / Ø). «Диаметр 0.3 м» у свай — не diameterMm.
    /[Øø⌀]\s*(\d+(?:[.,]\d+)?)|диаметр[^0-9]{0,12}(\d+(?:[.,]\d+)?)\s*мм/i
  );
  if (dia) {
    const d = num(dia[1] || dia[2]);
    if (d != null && d >= 6) patch.diameterMm = d;
  }

  const layers = firstMatch(text, /(\d+)\s*сло[яй]/i);
  if (layers) {
    const n = Number(layers[1]);
    if (n === 1 || n === 2 || n === 3) patch.layers = n;
  }

  const longBars = firstMatch(
    text,
    /(\d+)\s*(?:продольн\S{0,12}|стержн\S{0,8}\s*в\s*сечени)/i
  );
  if (longBars) {
    const n = Number(longBars[1]);
    if (n === 4 || n === 6 || n === 8) patch.longitudinalBars = n;
  }

  const spacing =
    firstMatch(
      text,
      /шаг[^0-9]{0,16}(?:хомут\S{0,8}[^0-9]{0,12})?(\d+(?:[.,]\d+)?)\s*[×xх]\s*(\d+(?:[.,]\d+)?)/i
    ) ||
    firstMatch(text, /шаг[^0-9]{0,16}(?:хомут\S{0,8}[^0-9]{0,12})?(\d+(?:[.,]\d+)?)\s*мм/i) ||
    firstMatch(text, /хомут\S{0,12}шаг[^0-9]{0,12}(\d+(?:[.,]\d+)?)\s*мм/i);
  if (spacing) {
    const a = num(spacing[1]);
    const b = num(spacing[2]);
    if (a != null) patch.spacingMm = a;
    else if (b != null) patch.spacingMm = b;
  }

  if (
    /нулев\S{0,8}\s*запас|запас\S{0,12}\s*(объ[её]м\S{0,8})?\s*[:=]?\s*0\s*%|без\s*запас|0%\s*запас/i.test(
      text
    )
  ) {
    patch.safetyFactor = 1;
  } else {
    const sfPct = firstMatch(
      text,
      /запас\S{0,12}(?:\s*объ[её]м\S{0,8})?[^0-9%]{0,12}(\d+(?:[.,]\d+)?)\s*%/
    );
    if (sfPct) {
      const pct = num(sfPct[1]);
      if (pct != null) patch.safetyFactor = Math.round((1 + pct / 100) * 1000) / 1000;
    }
  }

  const stock = firstMatch(
    text,
    /хлыст\S{0,12}[^0-9]{0,16}(\d+(?:[.,]\d+)?)\s*м|склад\S{0,12}[^0-9]{0,16}(\d+(?:[.,]\d+)?)\s*м/i
  );
  if (stock) {
    const s = num(stock[1] || stock[2]);
    if (s != null) patch.stockLengthM = s;
  }

  const gradeM = firstMatch(text, GRADE_RE);
  if (gradeM) {
    const raw = gradeM[1].toUpperCase();
    if (raw.startsWith('M')) {
      patch.concreteGrade = raw as ConcreteSpec['grade'];
    } else if (GRADE_FROM_B[raw]) {
      patch.concreteGrade = GRADE_FROM_B[raw];
    }
  }

  // Свайно-плитный: глубина/Ø свай (м) ≠ толщина плиты / Ø арматуры.
  if (patch.structureType === 'pier') {
    const pileDepth = firstMatch(
      text,
      /глубин\S{0,20}(?:свай\S{0,8})?[^0-9]{0,16}(\d+(?:[.,]\d+)?)\s*м|(?:свай\S{0,12}[^0-9]{0,20})глубин\S{0,12}[^0-9]{0,12}(\d+(?:[.,]\d+)?)\s*м/i
    );
    const pileDia = firstMatch(
      text,
      /диаметр[^0-9]{0,16}(\d+(?:[.,]\d+)?)\s*м(?![а-яё])/i
    );
    if (pileDepth) {
      const d = num(pileDepth[1] || pileDepth[2]);
      if (d != null && d >= 1) {
        // «Габариты плиты … × 0.5» уже легли в depthM — это ростверк/плита.
        if (patch.depthM != null && patch.depthM < 1.2 && patch.ribDepthM == null) {
          patch.ribDepthM = patch.depthM;
        }
        patch.depthM = d;
      }
    }
    if (pileDia) {
      const d = num(pileDia[1]);
      if (d != null && d > 0 && d < 2) patch.ribWidthM = d;
    }
  }

  return patch;
}

export function mergeCalcPatches(...parts: AiCalcPatch[]): AiCalcPatch {
  const out: AiCalcPatch = {};
  for (const p of parts) {
    Object.assign(out, p);
  }
  return out;
}

export function isCalcPatchEmpty(patch: AiCalcPatch): boolean {
  return Object.keys(patch).length === 0;
}

export function describeCalcPatch(patch: AiCalcPatch): string[] {
  const lines: string[] = [];
  if (patch.structureType) lines.push(`Тип: ${patch.structureType}`);
  if (
    patch.lengthM != null &&
    patch.widthM != null &&
    patch.depthM != null
  ) {
    lines.push(
      `Габариты: ${patch.lengthM} × ${patch.widthM} × ${patch.depthM} м`
    );
  }
  if (patch.ribWidthM != null || patch.ribDepthM != null) {
    lines.push(
      `Рёбра: ${patch.ribWidthM ?? '—'} × ${patch.ribDepthM ?? '—'} м`
    );
  }
  if (patch.coverMm != null) lines.push(`Защитный слой: ${patch.coverMm} мм`);
  if (patch.diameterMm != null || patch.spacingMm != null || patch.layers != null) {
    lines.push(
      `Арматура: Ø${patch.diameterMm ?? '—'}, шаг ${patch.spacingMm ?? '—'} мм, слоёв ${patch.layers ?? '—'}`
    );
  }
  if (patch.safetyFactor != null) {
    const pct = Math.round((patch.safetyFactor - 1) * 1000) / 10;
    lines.push(`Запас объёма: ${pct}% (k=${patch.safetyFactor})`);
  }
  if (patch.stockLengthM != null) lines.push(`Хлыст: ${patch.stockLengthM} м`);
  if (patch.concreteGrade) lines.push(`Бетон: ${patch.concreteGrade}`);
  return lines;
}

export function patchToSuggestions(patch: AiCalcPatch): AiSuggestion[] {
  const out: AiSuggestion[] = [];
  const push = (
    id: string,
    label: string,
    field: AiSuggestion['field'],
    value: number,
    reason: string
  ) => {
    if (field == null) return;
    out.push({ id, label, field, value, reason });
  };

  if (patch.lengthM != null)
    push('len', `Длина: ${patch.lengthM} м`, 'lengthM', patch.lengthM, 'Из задания');
  if (patch.widthM != null)
    push('wid', `Ширина: ${patch.widthM} м`, 'widthM', patch.widthM, 'Из задания');
  if (patch.depthM != null)
    push('dep', `Толщина: ${patch.depthM} м`, 'depthM', patch.depthM, 'Из задания');
  if (patch.ribWidthM != null)
    push(
      'ribW',
      `Ребро ширина: ${patch.ribWidthM} м`,
      'ribWidthM',
      patch.ribWidthM,
      'Рёбра жёсткости'
    );
  if (patch.ribDepthM != null)
    push(
      'ribD',
      `Ребро высота: ${patch.ribDepthM} м`,
      'ribDepthM',
      patch.ribDepthM,
      'Рёбра жёсткости'
    );
  if (patch.coverMm != null)
    push('cover', `Защитный слой: ${patch.coverMm} мм`, 'coverMm', patch.coverMm, 'Из задания');
  if (patch.diameterMm != null)
    push('dia', `Ø${patch.diameterMm}`, 'diameterMm', patch.diameterMm, 'Армирование');
  if (patch.spacingMm != null)
    push('sp', `Шаг: ${patch.spacingMm} мм`, 'spacingMm', patch.spacingMm, 'Армирование');
  if (patch.layers != null)
    push('lay', `Слоёв: ${patch.layers}`, 'layers', patch.layers, 'Армирование');
  if (patch.safetyFactor != null)
    push(
      'sf',
      `Запас объёма: ${Math.round((patch.safetyFactor - 1) * 100)}%`,
      'safetyFactor',
      patch.safetyFactor,
      'Нулевой/заданный запас'
    );
  if (patch.stockLengthM != null)
    push(
      'stock',
      `Хлыст: ${patch.stockLengthM} м`,
      'stockLengthM',
      patch.stockLengthM,
      'Раскрой'
    );
  return out;
}

/** Build patch from current question + recent user messages (for «поставь сам»). */
export function extractApplyPatchFromDialog(
  question: string,
  history: Array<{ role: string; content: string }>
): AiCalcPatch {
  const userChunks = [
    ...history.filter((m) => m.role === 'user').map((m) => m.content),
    question,
  ];
  const blob = userChunks.join('\n\n');
  // Prefer denser recent messages last so they win in merge
  const patches = userChunks.map((c) => extractCalcPatchFromText(c));
  return mergeCalcPatches(...patches, extractCalcPatchFromText(blob));
}
