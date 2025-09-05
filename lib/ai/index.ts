// Export shared types
export type { 
  SingleHintRequest, 
  SingleHintResponse, 
  LocationContext 
} from './types';

// Export the secure client-side hints service
export { hintsClient } from './hints-client';

// Keep the old gemini service for backward compatibility (server-side only)
export { geminiService } from './gemini-service';