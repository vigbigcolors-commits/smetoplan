import {
  type CalculatorDraft,
  parseCalculatorDraft,
} from '@/lib/calculator-draft';
import { calculatorHref } from '@/lib/calculator-routes';

export const SHARE_QUERY_PARAM = 's';

/** UTF-8 → base64url (URL-safe, no padding). */
export function bytesToBase64Url(bytes: Uint8Array): string {
  let bin = '';
  for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]!);
  const b64 =
    typeof btoa === 'function'
      ? btoa(bin)
      : Buffer.from(bytes).toString('base64');
  return b64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
}

export function base64UrlToBytes(token: string): Uint8Array | null {
  try {
    const padded = token.replace(/-/g, '+').replace(/_/g, '/');
    const pad = padded.length % 4 === 0 ? '' : '='.repeat(4 - (padded.length % 4));
    const b64 = padded + pad;
    if (typeof atob === 'function') {
      const bin = atob(b64);
      const out = new Uint8Array(bin.length);
      for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
      return out;
    }
    return new Uint8Array(Buffer.from(b64, 'base64'));
  } catch {
    return null;
  }
}

function utf8Encode(text: string): Uint8Array {
  return new TextEncoder().encode(text);
}

function utf8Decode(bytes: Uint8Array): string {
  return new TextDecoder().decode(bytes);
}

/**
 * Compact share token. Prefers deflate when CompressionStream exists;
 * falls back to raw JSON base64url (draft ~1–2 KB — fine for URL).
 */
export async function encodeShareToken(draft: CalculatorDraft): Promise<string> {
  const json = JSON.stringify(draft);
  const raw = utf8Encode(json);

  if (typeof CompressionStream !== 'undefined') {
    try {
      const stream = new Blob([raw.buffer.slice(raw.byteOffset, raw.byteOffset + raw.byteLength) as ArrayBuffer])
        .stream()
        .pipeThrough(new CompressionStream('deflate-raw'));
      const buf = await new Response(stream).arrayBuffer();
      return `d1.${bytesToBase64Url(new Uint8Array(buf))}`;
    } catch {
      // fall through
    }
  }

  return `j1.${bytesToBase64Url(raw)}`;
}

export async function decodeShareToken(token: string): Promise<CalculatorDraft | null> {
  const trimmed = token.trim();
  if (!trimmed) return null;

  const dot = trimmed.indexOf('.');
  const prefix = dot > 0 ? trimmed.slice(0, dot) : '';
  const body = dot > 0 ? trimmed.slice(dot + 1) : trimmed;
  const bytes = base64UrlToBytes(body);
  if (!bytes || bytes.length === 0) return null;

  let jsonBytes = bytes;

  if (prefix === 'd1') {
    if (typeof DecompressionStream === 'undefined') return null;
    try {
      const ab = bytes.buffer.slice(
        bytes.byteOffset,
        bytes.byteOffset + bytes.byteLength
      ) as ArrayBuffer;
      const stream = new Blob([ab])
        .stream()
        .pipeThrough(new DecompressionStream('deflate-raw'));
      jsonBytes = new Uint8Array(await new Response(stream).arrayBuffer());
    } catch {
      return null;
    }
  } else if (prefix !== 'j1' && prefix !== '') {
    return null;
  }

  try {
    const parsed: unknown = JSON.parse(utf8Decode(jsonBytes));
    return parseCalculatorDraft(parsed);
  } catch {
    return null;
  }
}

export async function buildShareUrl(
  draft: CalculatorDraft,
  origin?: string
): Promise<string> {
  const base =
    origin?.replace(/\/$/, '') ||
    (typeof window !== 'undefined' ? window.location.origin : 'https://smetoplan.ru');
  const path = calculatorHref(draft.structureType);
  const token = await encodeShareToken(draft);
  const join = path.includes('?') ? '&' : '?';
  return `${base}${path}${join}${SHARE_QUERY_PARAM}=${token}`;
}

export function readShareTokenFromLocation(
  search?: string
): string | null {
  if (typeof window === 'undefined' && search == null) return null;
  const q = search ?? window.location.search;
  try {
    return new URLSearchParams(q).get(SHARE_QUERY_PARAM);
  } catch {
    return null;
  }
}

/** Drop `s` from the address bar without reload (after restore). */
export function stripShareParamFromUrl(): void {
  if (typeof window === 'undefined') return;
  try {
    const url = new URL(window.location.href);
    if (!url.searchParams.has(SHARE_QUERY_PARAM)) return;
    url.searchParams.delete(SHARE_QUERY_PARAM);
    const next = `${url.pathname}${url.search}${url.hash}`;
    window.history.replaceState({}, '', next);
  } catch {
    // ignore
  }
}
