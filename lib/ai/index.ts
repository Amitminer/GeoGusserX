// Export the secure client-side hints service
export { 
  hintsClient, 
  type SingleHintRequest, 
  type SingleHintResponse 
} from './hints-client';

// Keep the old gemini service for backward compatibility (server-side only)
export { 
  geminiService
} from './gemini-service';