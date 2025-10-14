// Export shared types
export type { 
  SingleHintRequest, 
  SingleHintResponse, 
  LocationContext,
  TextHintResponse
} from './types';

// Export the secure client-side hints service
export { hintsClient } from './hints-client';

// Export text hints functionality
export { 
  generateCountryLettersHint, 
  getTextHintCost, 
  canGenerateTextHint,
  getMaxTextHints,
  hasMoreTextHints
} from './text-hints';