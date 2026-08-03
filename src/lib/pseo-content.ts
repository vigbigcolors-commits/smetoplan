import type { PseoSnapshot } from '@/lib/pseo-snapshot';
import type { PseoRouteParams, StructureType } from '@/lib/types';

export type SeoSection = {
  h2: string;
  paragraphs: string[];
};

export type LongTailPack = {
  sections: SeoSection[];
  /** Extra long-tail FAQ beyond calc FAQ */
  extraFaqs: Array<{ q: string; a: string }>;
  breadcrumbsLabel: string;
};

const STRUCTURE_LONGTAIL: Record<
  StructureType,
  {
    nom: string;
    gen: string;
    useCase: string;
    longTailHooks: string[];
    howSteps: string[];
  }
> = {
  slab: {
    nom: 'плитный фундамент',
    gen: 'плитного фундамента',
    useCase:
      'монолитная плита под дом, баню или пристройку: равномерная передача нагрузки на грунт',
    longTailHooks: [
      'калькулятор плитного фундамента онлайн',
      'сколько бетона на плиту',
      'арматура для фундаментной плиты',
      'смета монолитной плиты',
    ],
    howSteps: [
      'Сверьте габариты плиты и марку бетона с вашим проектом или эскизом.',
      'При необходимости измените толщину, Ø арматуры и шаг сетки в панели справа.',
      'Скачайте ведомость материалов и сравните ориентир с прайсом РБУ на /ceny.',
    ],
  },
  strip: {
    nom: 'ленточный фундамент',
    gen: 'ленточного фундамента',
    useCase:
      'лента по контуру здания с внутренними несущими: частный дом, гараж, хозблок',
    longTailHooks: [
      'расчёт ленточного фундамента',
      'сколько кубов бетона на ленту',
      'арматурный каркас ленты',
      'смета ленточного фундамента',
    ],
    howSteps: [
      'Проверьте длину/ширину контура и глубину заложения относительно промерзания.',
      'Уточните ширину ленты и схему внутренних осей в калькуляторе.',
      'Сверьте смету с региональным ориентиром и запросите КП у РБУ.',
    ],
  },
  pier: {
    nom: 'свайный фундамент',
    gen: 'свайного фундамента',
    useCase:
      'свайно-ростверковое поле на слабых или пучинистых грунтах, лёгкие и средние дома',
    longTailHooks: [
      'калькулятор свайного фундамента',
      'расчёт ростверка',
      'сколько бетона на сваи',
      'смета свайного поля',
    ],
    howSteps: [
      'Сверьте шаг свай и наличие ростверка с решением по грунту.',
      'Измените диаметр/длину свай и высоту ростверка в параметрах.',
      'Используйте смету как ориентир закупки — число свай подтверждает проектировщик.',
    ],
  },
  beam: {
    nom: 'монолитная балка',
    gen: 'монолитной балки',
    useCase: 'пролётные балки перекрытий и ригели каркаса (сметный ориентир, не КЖ)',
    longTailHooks: [
      'калькулятор монолитной балки',
      'арматура балки пролётом',
      'сколько бетона на балку',
      'смета жб балки',
    ],
    howSteps: [
      'Проверьте пролёт и сечение балки.',
      'Задайте Ø продольной арматуры и шаг хомутов.',
      'Смету используйте для закупки; армирование по СП 63 уточняет КЖ.',
    ],
  },
  wall: {
    nom: 'подпорная стена',
    gen: 'подпорной стены',
    useCase: 'монолитные подпорные и цокольные стены с двусторонней опалубкой',
    longTailHooks: [
      'калькулятор подпорной стены',
      'сколько бетона на подпорную стену',
      'арматура подпорной стены',
      'смета монолитной стены',
    ],
    howSteps: [
      'Сверьте длину, толщину и высоту стены с перепадом рельефа.',
      'Проверьте двойную сетку и площадь опалубки.',
      'Уточните давление грунта и дренаж отдельно от сметного расчёта.',
    ],
  },
};

export function buildLongTailPack(input: {
  structureType: StructureType;
  params: PseoRouteParams;
  regionLabel: string | null;
  regionLocative: string | null;
  snapshot: PseoSnapshot;
}): LongTailPack {
  const st = STRUCTURE_LONGTAIL[input.structureType];
  const p = input.params;
  const dims = `${p.length}×${p.width}×${p.depth}`;
  const dimsM = `${dims} м`;
  const region = input.regionLabel ?? 'Россия';
  const loc = input.regionLocative ?? 'по справочнику Smetoplan';
  const snap = input.snapshot;
  const hasRebar = p.layers > 0 && p.rebar_d > 0;

  const hooks = st.longTailHooks
    .map((h) => `${h} ${dimsM}`)
    .concat([
      `${st.nom} ${p.grade} ${region}`,
      `онлайн смета ${st.gen} ${p.length}×${p.width}`,
    ]);

  const sections: SeoSection[] = [
    {
      h2: `Сколько бетона на ${st.nom} ${dimsM}`,
      paragraphs: [
        `Для ${st.gen} ${dimsM} марки ${p.grade} объём бетона на этой странице ≈ ${snap.concreteVolumeM3} м³. Это геометрический расчёт под ${st.useCase}; запас 3–7% на укладку заложите отдельно.`,
        `Запрос long-tail вроде «${hooks[0]}» или «${hooks[1]}» как раз закрывается этими цифрами: готовый объём, марка и региональный ориентир ${loc}, без пустого шаблона.`,
      ],
    },
    {
      h2: hasRebar
        ? `Арматура Ø${p.rebar_d} для ${st.gen} ${p.length}×${p.width} м`
        : `Материалы без армирования — ${st.nom} ${dimsM}`,
      paragraphs: hasRebar
        ? [
            `В расчёте заложена арматура Ø${p.rebar_d} мм, шаг ${p.rebar_step} мм, слоёв: ${p.layers}. Масса ≈ ${snap.rebarWeightKg} кг; ориентир по хлыстам 11,7 м — ${snap.rebarStockBarsApprox} шт (отход ~${snap.rebarWastePct}%). Защитный слой ≈ ${snap.coverMm} мм.`,
            `Площадь опалубки ≈ ${snap.formworkAreaM2} м². Ориентир по использованию несущей способности грунта ≈ ${snap.soilUtilizationPct}% — проверка порядка величины, не расчёт оснований по СП 22.`,
          ]
        : [
            `Армирование отключено: считаются бетон и опалубка. Для несущего ${st.gen} включите диаметр и слои в калькуляторе.`,
          ],
    },
    {
      h2: `Смета ${st.gen} ${loc}`,
      paragraphs: [
        `Ориентировочная стоимость материалов ≈ ${snap.totalRub} для «${region}»: бетон ${snap.concretePrice.toLocaleString('ru-RU')} ₽/м³, арматура ${snap.rebarPrice.toLocaleString('ru-RU')} ₽/т, опалубка ${snap.formworkPrice.toLocaleString('ru-RU')} ₽/м² (справочник Smetoplan, не оферта РБУ).`,
        `Сравните итог с публичными котировками на странице цен региона и запросите коммерческое предложение по спецификации: объём ${snap.concreteVolumeM3} м³, арматура ${snap.rebarWeightKg} кг.`,
      ],
    },
    {
      h2: `Как пользоваться расчётом ${dimsM}`,
      paragraphs: [
        st.howSteps.map((s, i) => `${i + 1}. ${s}`).join(' '),
        `${snap.guideNote} Расчёт полезен для сметы и закупки; рабочая документация КЖ — по СП 63.13330.`,
      ],
    },
  ];

  const extraFaqs = [
    {
      q: `Чем отличается этот расчёт ${st.gen} ${dimsM} от пустого шаблона?`,
      a: `На странице уже посчитаны бетон ${snap.concreteVolumeM3} м³, арматура ${snap.rebarWeightKg} кг, опалубка ${snap.formworkAreaM2} м² и смета ${snap.totalRub} для «${region}». Параметры ${dimsM}, ${p.grade}${hasRebar ? `, Ø${p.rebar_d}` : ''} зашиты в URL — это уникальный long-tail лендинг, а не одна заготовка на все размеры.`,
    },
    {
      q: `Как искать «${hooks[2] ?? hooks[0]}» и получить цифры сразу?`,
      a: `Откройте эту страницу или близкий размер в каталоге: H1 и блоки ниже сразу показывают объём, каркас и смету ${loc}. Дальше можно изменить параметры в калькуляторе без потери исходного ориентира.`,
    },
  ];

  return {
    sections,
    extraFaqs,
    breadcrumbsLabel: `${st.nom} ${dimsM} · ${region}`,
  };
}

/** Gate helper: long-form must be substantial and mention dims + region. */
export function isRichLongTail(
  pack: LongTailPack,
  dimsLabel: string,
  regionLabel: string | null
): boolean {
  if (pack.sections.length < 4) return false;
  const text = pack.sections
    .flatMap((s) => [s.h2, ...s.paragraphs])
    .join(' ');
  if (text.length < 900) return false;
  if (!text.includes(dimsLabel) && !text.includes(dimsLabel.replace(/ м$/, ''))) {
    return false;
  }
  if (regionLabel && !text.includes(regionLabel.split(/[\s/]/)[0]!.slice(0, 5))) {
    return false;
  }
  for (const s of pack.sections) {
    if (s.h2.length < 12 || s.paragraphs.join(' ').length < 120) return false;
  }
  return true;
}
