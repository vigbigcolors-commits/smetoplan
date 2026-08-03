import { NextResponse } from 'next/server';

/**
 * Self-serve only: email the visitor their own smeta package.
 * Never notifies site owners / hello@ — zero manual queue.
 */

interface Body {
  email?: string;
  shareUrl?: string;
  regionLabel?: string;
  structureLabel?: string;
  dimsLabel?: string;
  concreteGrade?: string;
  concreteVolumeM3?: number;
  rebarWeightKg?: number;
  formworkAreaM2?: number;
  totalLabel?: string;
  specText?: string;
}

const hits = new Map<string, { n: number; t: number }>();

function clientIp(req: Request): string {
  return (
    req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    req.headers.get('x-real-ip') ||
    'unknown'
  );
}

function rateLimit(ip: string): boolean {
  const now = Date.now();
  const row = hits.get(ip);
  if (!row || now - row.t > 60_000) {
    hits.set(ip, { n: 1, t: now });
    return true;
  }
  if (row.n >= 5) return false;
  row.n += 1;
  return true;
}

function isEmail(v: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v) && v.length <= 200;
}

export async function POST(request: Request) {
  const ip = clientIp(request);
  if (!rateLimit(ip)) {
    return NextResponse.json(
      { ok: false, error: 'Слишком много запросов. Подождите минуту.' },
      { status: 429 }
    );
  }

  let body: Body;
  try {
    body = (await request.json()) as Body;
  } catch {
    return NextResponse.json({ ok: false, error: 'Invalid JSON' }, { status: 400 });
  }

  const email = (body.email || '').trim().toLowerCase();
  if (!isEmail(email)) {
    return NextResponse.json(
      { ok: false, error: 'Укажите корректный email' },
      { status: 400 }
    );
  }

  const shareUrl = (body.shareUrl || '').trim();
  const specText = (body.specText || '').slice(0, 20_000);
  const regionLabel = body.regionLabel || 'регион';
  const structureLabel = body.structureLabel || 'конструкция';
  const dimsLabel = body.dimsLabel || '—';
  const concreteGrade = body.concreteGrade || '—';
  const vol = body.concreteVolumeM3 ?? '—';
  const rebar = body.rebarWeightKg ?? '—';
  const form = body.formworkAreaM2 ?? '—';
  const total = body.totalLabel || '—';

  const apiKey = process.env.RESEND_API_KEY?.trim();
  const from =
    process.env.RESEND_FROM?.trim() || 'Smetoplan <onboarding@resend.dev>';

  const subject = `Ваша смета Smetoplan · ${structureLabel}`;
  const text = [
    'Smetoplan — ваш пакет расчёта (автоматически)',
    '',
    `Конструкция: ${structureLabel}`,
    `Габариты: ${dimsLabel}`,
    `Регион: ${regionLabel}`,
    `Бетон: ${concreteGrade}, ${vol} м³`,
    `Арматура: ${rebar} кг`,
    `Опалубка: ${form} м²`,
    `Ориентир сметы: ${total}`,
    '',
    shareUrl ? `Открыть расчёт: ${shareUrl}` : '',
    '',
    '— Спецификация для РБУ —',
    specText || '(откройте ссылку в калькуляторе)',
    '',
    'Это разовое письмо по вашему запросу. Не подписка.',
    'Ориентир, не оферта и не проект КЖ.',
  ]
    .filter((l) => l !== undefined)
    .join('\n');

  if (!apiKey) {
    // Dev / misconfig: still ok for UX — client already has downloads.
    console.info('[smeta/email] RESEND_API_KEY missing — dry-run to', email);
    return NextResponse.json({
      ok: true,
      dryRun: true,
      message:
        'Письмо принято (режим без ключа Resend). Скачайте PDF на устройстве.',
    });
  }

  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from,
        to: [email],
        subject,
        text,
      }),
    });

    if (!res.ok) {
      const errText = await res.text().catch(() => '');
      console.error('[smeta/email] Resend error', res.status, errText);
      return NextResponse.json(
        {
          ok: false,
          error:
            'Почта временно недоступна. Скачайте пакет PDF + .txt на устройстве.',
        },
        { status: 502 }
      );
    }

    return NextResponse.json({ ok: true, message: 'Письмо отправлено' });
  } catch (e) {
    console.error('[smeta/email]', e);
    return NextResponse.json(
      {
        ok: false,
        error: 'Сеть недоступна. Скачайте пакет на устройство.',
      },
      { status: 502 }
    );
  }
}
