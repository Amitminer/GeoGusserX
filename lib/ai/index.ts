// Export shared types
export type { 
  SingleHintResponse, 
  TextHintResponse
} from './types';

// Export the secure client-side hints service
export { hintsClient } from './hints-client';

// Export text hints functionality
export { 
  generateCountryLettersHint, 
  getTextHintCost, 
  canGenerateTextHint,
  hasMoreTextHints
} from './text-hints';