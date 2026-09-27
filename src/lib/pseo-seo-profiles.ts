import profiles from './pseo-seo-profiles.json';
import type { PseoRouteParams, StructureType } from '@/lib/types';

export const SEO_MATERIAL_PROFILES = profiles satisfies Record<
  StructureType,
  {
    grade: string;
    rebar_d: number;
    rebar_step: number;
    layers: number;
  }
>;

export function isCanonicalSeoMaterialProfile(
  structureType: StructureType,
  params: PseoRouteParams
): boolean {
  const profile = SEO_MATERIAL_PROFILES[structureType];
  return (
    params.grade === profile.grade &&
    Number(params.rebar_d) === profile.rebar_d &&
    Number(params.rebar_step) === profile.rebar_step &&
    Number(params.layers) === profile.layers
  );
}
