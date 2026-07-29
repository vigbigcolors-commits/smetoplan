import { NextResponse } from 'next/server';

interface QuoteBody {
  name?: string;
  phone?: string;
  email?: string;
  location?: string;
  deliveryDate?: string;
  totalCost?: number;
  concreteVolumeM3?: number;
}

export async function POST(request: Request) {
  let body: QuoteBody;
  try {
    body = (await request.json()) as QuoteBody;
  } catch {
    return NextResponse.json({ ok: false, error: 'Invalid JSON' }, { status: 400 });
  }

  const name = (body.name || '').trim();
  const phone = (body.phone || '').replace(/\D/g, '');

  if (name.length < 2 || phone.length < 10) {
    return NextResponse.json(
      { ok: false, error: 'Укажите имя и корректный телефон' },
      { status: 400 }
    );
  }

  const leadId = `SP-${Date.now().toString(36).toUpperCase()}`;

  return NextResponse.json({
    ok: true,
    leadId,
    message: 'Заявка принята. РБУ свяжется с вами в рабочее время.',
    echo: {
      name,
      phone: `+${phone}`,
      email: body.email || null,
      location: body.location || null,
      deliveryDate: body.deliveryDate || null,
      totalCost: body.totalCost ?? null,
      concreteVolumeM3: body.concreteVolumeM3 ?? null,
    },
  });
}
