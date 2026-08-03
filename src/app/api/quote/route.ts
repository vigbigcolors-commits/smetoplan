import { NextResponse } from 'next/server';

/**
 * Legacy endpoint kept for compatibility.
 * Self-serve product does not create owner leads — use downloads / /api/smeta/email.
 */
export async function POST() {
  return NextResponse.json(
    {
      ok: false,
      error:
        'Ручные заявки отключены. Скачайте пакет «Готово» (PDF + ссылка) в калькуляторе.',
      code: 'SELF_SERVE_ONLY',
    },
    { status: 410 }
  );
}
