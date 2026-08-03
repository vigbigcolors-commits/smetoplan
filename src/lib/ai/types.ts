export type AiProviderId = 'gemini-pro' | 'deepseek-r1' | 'local';

export interface AiChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export type AiSuggestionField =
  | 'coverMm'
  | 'safetyFactor'
  | 'spacingMm'
  | 'diameterMm'
  | 'layers'
  | 'soilResistanceKpa'
  | 'stockLengthM'
  | 'lengthM'
  | 'widthM'
  | 'depthM'
  | 'ribWidthM'
  | 'ribDepthM'
  | 'structureType';

export interface AiSuggestion {
  id: string;
  label: string;
  field?: AiSuggestionField;
  value?: number | string;
  /** DOM id на странице калькулятора — умный переход */
  scrollTo?: string;
  reason: string;
}

/** Batch write into calculator inputs — applied automatically when autoApply=true. */
export interface AiCalcPatch {
  structureType?: 'slab' | 'strip' | 'beam' | 'pier' | 'wall';
  lengthM?: number;
  widthM?: number;
  depthM?: number;
  ribWidthM?: number;
  ribDepthM?: number;
  coverMm?: number;
  diameterMm?: number;
  spacingMm?: number;
  layers?: 1 | 2 | 3;
  longitudinalBars?: 4 | 6 | 8;
  stirrupDiameterMm?: number;
  safetyFactor?: number;
  stockLengthM?: number;
  concreteGrade?: 'M150' | 'M200' | 'M250' | 'M300' | 'M350' | 'M400';
}

export interface AiAssistantReply {
  answer: string;
  provider: AiProviderId;
  model: string;
  suggestions: AiSuggestion[];
  disclaimer: string;
  /** When true, client writes patch + field suggestions into the calculator without clicks. */
  autoApply?: boolean;
  patch?: AiCalcPatch;
}
