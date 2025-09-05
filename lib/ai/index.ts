// Export shared types
export type { 
  SingleHintRequest, 
  SingleHintResponse, 
  LocationContext 
} from './types';

// Export the secure client-side hints service
export { hintsClient } from './hints-client';