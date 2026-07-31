export type AiProviderId = 'gemini-pro' | 'deepseek-r1' | 'local';

export interface AiChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export interface AiSuggestion {
  id: string;
  label: string;
  field?:
    | 'coverMm'
    | 'safetyFactor'
    | 'spacingMm'
    | 'diameterMm'
    | 'soilResistanceKpa'
    | 'stockLengthM';
  value?: number;
  /** DOM id на странице калькулятора — умный переход */
  scrollTo?: string;
  reason: string;
}

export interface AiAssistantReply {
  answer: string;
  provider: AiProviderId;
  model: string;
  suggestions: AiSuggestion[];
  disclaimer: string;
}
