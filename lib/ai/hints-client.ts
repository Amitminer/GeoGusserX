import { Location } from '@/lib/types';
import { logger } from '@/lib/logger';
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

class HintsClient {
  private lastRequestTime = 0;
  private minRequestInterval = 1000; // Minimum 1 second between requests

  async generateSingleHint(request: SingleHintRequest): Promise<SingleHintResponse> {
    // Rate limiting to prevent too many rapid requests
    const now = Date.now();
    const timeSinceLastRequest = now - this.lastRequestTime;
    if (timeSinceLastRequest < this.minRequestInterval) {
      const waitTime = this.minRequestInterval - timeSinceLastRequest;
      logger.info(`Rate limiting: waiting ${waitTime}ms before next request`, undefined, 'HintsClient');
      await new Promise(resolve => setTimeout(resolve, waitTime));
    }
    this.lastRequestTime = Date.now();

    try {
      logger.startTimer('hints-api-request');
      
      logger.info('Requesting AI hint from server', { 
        location: request.location, 
        roundNumber: request.roundNumber,
        hintNumber: request.hintNumber,
        country: request.countryInfo.country
      }, 'HintsClient');

      const response = await fetch('/api/hints', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          location: request.location,
          roundNumber: request.roundNumber,
          gameMode: request.gameMode,
          hintNumber: request.hintNumber,
          previousHints: request.previousHints,
          countryInfo: {
            country: request.countryInfo.country,
            countryCode: request.countryInfo.countryCode,
            formattedAddress: request.countryInfo.formattedAddress
          }
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
      }

      const result: SingleHintResponse = await response.json();
      
      const duration = logger.endTimer('hints-api-request', 'AI hint received from server');
      logger.perf('Hints API request', duration, {
        hintNumber: request.hintNumber,
        category: result.category,
        difficulty: result.difficulty,
        confidence: result.confidence,
        country: request.countryInfo.country
      });

      return result;
    } catch (error: unknown) {
      logger.endTimer('hints-api-request');
      logger.error('Failed to get hint from server', error, 'HintsClient');
      
      const errorMessage = error instanceof Error ? error.message : String(error);
      
      // Re-throw specific errors for better user feedback
      if (errorMessage.includes('Rate limit') || 
          errorMessage.includes('timeout') ||
          errorMessage.includes('Service temporarily unavailable') ||
          errorMessage.includes('AI service not available')) {
        throw error;
      }
      
      // Return fallback hint for other errors
      return this.getFallbackSingleHint(request);
    }
  }

  private getFallbackSingleHint(request: SingleHintRequest): SingleHintResponse {
    const { hintNumber } = request;
    
    let hint: string;
    let category: SingleHintResponse['category'] = 'geographical';
    
    switch (hintNumber) {
      case 1:
        hint = "Look for distinctive script types and language patterns on signs and buildings.";
        category = 'cultural';
        break;
        
      case 2:
        hint = "Notice the architectural styles and building materials typical of this region.";
        category = 'architectural';
        break;
        
      case 3:
        hint = "Look for specific regional characteristics in road signs, license plates, and building styles.";
        category = 'cultural';
        break;
        
      default:
        hint = "Look carefully at any visible text, license plates, and architectural details for country-specific clues.";
        category = 'cultural';
        break;
    }

    const difficulty = this.getDefaultDifficulty(hintNumber);

    return {
      hint,
      confidence: 0.5,
      category,
      difficulty
    };
  }

  private getDefaultDifficulty(hintNumber: number): SingleHintResponse['difficulty'] {
    if (hintNumber === 1) return 'easy';
    if (hintNumber === 2) return 'medium';
    return 'hard';
  }

  isReady(): boolean {
    // Always ready since we're using the API
    return true;
  }

  async initialize(): Promise<void> {
    // No initialization needed for API client
    logger.info('Hints client initialized (using server API)', undefined, 'HintsClient');
  }
}

export const hintsClient = new HintsClient();