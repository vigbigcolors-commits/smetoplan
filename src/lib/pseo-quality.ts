/**
 * Single source of truth: a PSEO URL may enter the index ONLY if
 * unique calc fingerprint + safe SSR snapshot (FAQ + regional prices) pass.
 * Never bypass. Drip, sitemap, and [slug] all call these helpers.
 */

import { buildPseoSnapshot, type PseoSnapshot } from '@/lib/pseo-snapshot';
import { isRichLongTail } from '@/lib/pseo-content';
import { resolvePseoRegion } from '@/lib/pseo-region';
import { isReservedHubSlug } from '@/lib/pseo-hubs';
import type { PseoRoute, PseoRouteParams, StructureType } from '@/lib/types';

/** Default ON — set PSEO_REQUIRE_REGION=0 only for emergency backfill. */
export const PSEO_REQUIRE_REGION = process.env.PSEO_REQUIRE_REGION !== '0';

/** Indexable leaves must include reinforcement — bare concrete shells are thin. */
const NEEDS_REBAR = new Set<StructureType>(['slab', 'strip', 'pier', 'wall', 'beam']);

export type PseoGateReason =
  | 'hub_reserved'
  | 'thin_params'
  | 'missing_region'
  | 'missing_region_and_rebar'
  | 'thin_description'
  | 'thin_title'
  | 'missing_rebar'
  | 'duplicate_fingerprint'
  | 'clone_title'
  | 'zero_volume'
  | 'weak_faq'
  | 'weak_snapshot';

export type PseoGateInput = {
  slug: string;
  structure_type: StructureType;
  params: PseoRouteParams;
  region_slug: string | null;
  title_template: string;
  h1_template: string;
  description?: string;
};

export function paramsFingerprint(row: {
  structure_type: string;
  params: PseoRouteParams | Record<string, unknown>;
  region_slug: string | null;
}): string {
  const p = row.params as PseoRouteParams;
  const region = resolvePseoRegion(row.region_slug);
  return [
    row.structure_type,
    Number(p.length),
    Number(p.width),
    Number(p.depth),
    String(p.grade || ''),
    Number(p.rebar_d ?? 0),
    Number(p.rebar_step ?? 0),
    Number(p.layers ?? 0),
    region?.slug || '',
  ].join('|');
}

export function normalizeTitle(t: string): string {
  return t
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .replace(/[×x]/gi, 'x')
    .replace(/[^a-zа-я0-9x\s]/gi, '')
    .trim();
}

function hasCyrillic(s: string): boolean {
  return /[а-яё]/i.test(s);
}

function titleMentionsRegion(title: string, label: string, locative: string): boolean {
  const t = title.toLowerCase();
  const tokens = new Set<string>();
  for (const raw of [label, locative.replace(/^в\s+/i, '')]) {
    for (const part of raw.toLowerCase().split(/[\s/,]+/)) {
      if (part.length >= 4) tokens.add(part.slice(0, 6));
    }
  }
  return [...tokens].some((tok) => t.includes(tok));
}

/** Snapshot must be unique useful content for bots — not a shell. */
export function isSafePseoSnapshot(snapshot: PseoSnapshot): boolean {
  if (!(snapshot.concreteVolumeM3 > 0)) return false;
  if (!snapshot.totalRub || snapshot.totalRub.length < 2) return false;
  if (!snapshot.disclaimer || snapshot.disclaimer.length < 40) return false;
  if (!snapshot.regionLabel) return false;
  if (snapshot.faqs.length < 6) return false;
  for (const f of snapshot.faqs) {
    if (f.q.length < 12 || f.a.length < 50) return false;
  }
  if (
    !isRichLongTail(snapshot.longTail, snapshot.dimsLabel, snapshot.regionLabel)
  ) {
    return false;
  }
  const joined = snapshot.faqs.map((f) => f.a).join(' ');
  const hasNumber = /\d/.test(joined);
  const hasDims =
    joined.includes(snapshot.dimsLabel) ||
    joined.includes(String(snapshot.concreteVolumeM3));
  const hasRegion = joined.includes(snapshot.regionLabel);
  return hasNumber && hasDims && hasRegion;
}

export function routeToGateInput(route: PseoRoute): PseoGateInput {
  return {
    slug: route.slug,
    structure_type: route.structure_type,
    params: route.params,
    region_slug: route.region_slug,
    title_template: route.title_template,
    h1_template: route.h1_template,
    description: route.description,
  };
}

/**
 * Structural + uniqueness gate (no DB). Used by drip and runtime.
 */
export function evaluatePseoStructureGate(
  row: PseoGateInput,
  publishedFingerprints: Set<string>,
  publishedTitles: Set<string>,
  batchFingerprints: Set<string> = new Set()
): { ok: true; fingerprint: string } | { ok: false; reason: PseoGateReason } {
  if (isReservedHubSlug(row.slug)) {
    return { ok: false, reason: 'hub_reserved' };
  }

  const p = row.params;
  const length = Number(p.length);
  const width = Number(p.width);
  const depth = Number(p.depth);
  const layers = Number(p.layers ?? 0);
  const rebarD = Number(p.rebar_d ?? 0);

  if (!(length > 0 && width > 0 && depth > 0 && p.grade)) {
    return { ok: false, reason: 'thin_params' };
  }

  const region = resolvePseoRegion(row.region_slug);
  if (PSEO_REQUIRE_REGION && !region) {
    return { ok: false, reason: 'missing_region' };
  }
  if (!region && !(layers > 0 && rebarD > 0)) {
    return { ok: false, reason: 'missing_region_and_rebar' };
  }

  if (NEEDS_REBAR.has(row.structure_type) && !(layers > 0 && rebarD > 0)) {
    return { ok: false, reason: 'missing_rebar' };
  }

  const title = row.title_template || row.h1_template || '';
  if (title.length < 24 || !hasCyrillic(title)) {
    return { ok: false, reason: 'thin_title' };
  }
  if (region && !titleMentionsRegion(title, region.label, region.locative)) {
    return { ok: false, reason: 'thin_title' };
  }

  const desc = row.description || '';
  if (desc.length < 80 || !hasCyrillic(desc)) {
    return { ok: false, reason: 'thin_description' };
  }

  const fingerprint = paramsFingerprint({
    structure_type: row.structure_type,
    params: p,
    region_slug: row.region_slug,
  });
  if (publishedFingerprints.has(fingerprint) || batchFingerprints.has(fingerprint)) {
    return { ok: false, reason: 'duplicate_fingerprint' };
  }

  const titleKey = normalizeTitle(row.title_template || row.h1_template);
  if (titleKey.length > 12 && publishedTitles.has(titleKey)) {
    return { ok: false, reason: 'clone_title' };
  }

  return { ok: true, fingerprint };
}

/**
 * Full gate: structure + live snapshot (calc + FAQ + prices).
 * ALWAYS run before publish and before indexing a leaf URL.
 */
export function evaluatePseoIndexability(
  row: PseoGateInput,
  publishedFingerprints: Set<string> = new Set(),
  publishedTitles: Set<string> = new Set(),
  batchFingerprints: Set<string> = new Set()
):
  | { ok: true; fingerprint: string; snapshot: PseoSnapshot }
  | { ok: false; reason: PseoGateReason } {
  const structural = evaluatePseoStructureGate(
    row,
    publishedFingerprints,
    publishedTitles,
    batchFingerprints
  );
  if (!structural.ok) return structural;

  const snapshot = buildPseoSnapshot({
    id: 0,
    slug: row.slug,
    structure_type: row.structure_type,
    intent_cluster: 'kalkulyator',
    title_template: row.title_template,
    h1_template: row.h1_template,
    description: row.description || row.h1_template,
    params: row.params,
    layout_variant: 1,
    show_rebar: true,
    show_bom: true,
    show_cad: true,
    show_ai: true,
    show_contractors: true,
    region_slug: row.region_slug,
    material_sku: null,
    formula_code: null,
    is_published: false,
    publish_date: null,
  });

  if (!(snapshot.concreteVolumeM3 > 0)) {
    return { ok: false, reason: 'zero_volume' };
  }
  if (!isSafePseoSnapshot(snapshot)) {
    return { ok: false, reason: 'weak_snapshot' };
  }
  if (snapshot.faqs.length < 6) {
    return { ok: false, reason: 'weak_faq' };
  }

  return { ok: true, fingerprint: structural.fingerprint, snapshot };
}
