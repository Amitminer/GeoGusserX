import type { Location } from '@/lib/types';
import type { GeocodeResult } from '@/lib/maps/geocoding';

export interface SingleHintRequest {
  location: Location;
  roundNumber: number;
  gameMode: string;
  hintNumber: number;
  previousHints?: string[];
  countryInfo: GeocodeResult;
}

export interface SingleHintResponse {
  hint: string;
  confidence: number;
  category: 'geographical' | 'cultural' | 'architectural' | 'environmental' | 'general';
  difficulty: 'easy' | 'medium' | 'hard';
}

export interface LocationContext {
  country: string;
  countryCode: string;
  formattedAddress: string;
}