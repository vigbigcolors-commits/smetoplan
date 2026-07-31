import { NextResponse } from 'next/server';
import {
  runAssistantChain,
  resolveProviderStatus,
  type AiChatMessage,
} from '@/lib/ai/providers';

export async function GET() {
  return NextResponse.json({ success: true, providers: resolveProviderStatus() });
}

export async function POST(request: Request) {
  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ success: false, error: 'Invalid JSON' }, { status: 400 });
  }

  const question = String(body.question || '').trim();
  if (!question || question.length > 2000) {
    return NextResponse.json(
      { success: false, error: 'Нужен вопрос (до 2000 символов)' },
      { status: 400 }
    );
  }

  const calcContext =
    body.calcContext && typeof body.calcContext === 'object'
      ? (body.calcContext as Record<string, unknown>)
      : {};

  const historyRaw = Array.isArray(body.history) ? body.history : [];
  const history: AiChatMessage[] = historyRaw
    .slice(-8)
    .map((m: { role?: string; content?: string }) => ({
      role: (m.role === 'assistant' ? 'assistant' : 'user') as 'user' | 'assistant',
      content: String(m.content || '').slice(0, 4000),
    }))
    .filter((m: AiChatMessage) => m.content);

  const messages: AiChatMessage[] = [
    ...history,
    { role: 'user', content: question },
  ];

  try {
    const data = await runAssistantChain({ messages, calcContext, question });
    return NextResponse.json({ success: true, data });
  } catch (err) {
    console.error('assistant route', err);
    return NextResponse.json(
      { success: false, error: 'Ассистент временно недоступен' },
      { status: 500 }
    );
  }
}
