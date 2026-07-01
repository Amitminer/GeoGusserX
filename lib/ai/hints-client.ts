import { logger } from '@/lib/logger';
import type { SingleHintRequest, SingleHintResponse } from './types';

class HintsClient {
  /**
   * Rate limiting properties to prevent spamming the hints API.
   * `lastRequestTime` tracks the timestamp of the last request.
   * `minRequestInterval` sets the minimum time (in ms) that must pass between requests.
   */
  private lastRequestTime = 0;
  private minRequestInterval = 1000; // Minimum 1 second between requests

  /**
   * Fetches a single hint from the AI service via a server-side API.
   * This function includes rate limiting to prevent abuse, a timeout to handle network issues,
   * and a fallback mechanism to provide a generic hint if the API call fails.
   *
   * @param request The request object containing all necessary context for the hint.
   * @returns A promise that resolves to a `SingleHintResponse` object.
   */
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

      // Set up an AbortController to cancel the fetch request if it takes too long.
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 35000); // 35s safety
      const response = await fetch('/api/hints', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        signal: controller.signal,
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
      clearTimeout(timeoutId);

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
      
      // Re-throw specific, user-actionable errors for better feedback in the UI.
      if (errorMessage.includes('Rate limit') || 
          errorMessage.includes('timeout') ||
          errorMessage.includes('Service temporarily unavailable') ||
          errorMessage.includes('AI service not available')) {
        throw error;
      }
      
      // For all other errors, return a generic, fallback hint to avoid disrupting the game.
      return this.getFallbackSingleHint(request);
    }
  }

  /**
   * Provides a generic, fallback hint when the primary AI service fails.
   * The hints are based on the hint number and offer general advice for the game.
   *
   * @param request The original hint request, used to determine the hint number.
   * @returns A `SingleHintResponse` object with a fallback hint.
   */
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

  /**
   * Determines the default difficulty for a fallback hint based on the hint number.
   * @param hintNumber The sequential number of the hint.
   * @returns The difficulty level for the hint.
   */
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


