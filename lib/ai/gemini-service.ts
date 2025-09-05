import { GoogleGenerativeAI, GenerativeModel } from '@google/generative-ai';
import { logger } from '@/lib/logger';
import type { SingleHintRequest, SingleHintResponse, LocationContext } from './types';

class GeminiService {
  private genAI: GoogleGenerativeAI | null = null;
  private model: GenerativeModel | null = null;
  private isInitialized = false;
  private lastRequestTime = 0;
  private minRequestInterval = 1000; // Minimum 1 second between requests

  async initialize(): Promise<void> {
    try {
      const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY;
      
      if (!apiKey) {
        throw new Error('Gemini API key not found. Please set NEXT_PUBLIC_GEMINI_API_KEY in your environment variables.');
      }

      this.genAI = new GoogleGenerativeAI(apiKey);
      this.model = this.genAI.getGenerativeModel({ 
        model: 'gemini-1.5-flash',
        generationConfig: {
          temperature: 0.9,
          topP: 0.95,
          topK: 40,
          maxOutputTokens: 300,
        },
      });

      this.isInitialized = true;
      logger.info('Gemini AI service initialized successfully', undefined, 'GeminiService');
    } catch (error) {
      logger.error('Failed to initialize Gemini AI service', error, 'GeminiService');
      throw error;
    }
  }

  async generateSingleHint(request: SingleHintRequest): Promise<SingleHintResponse> {
    if (!this.isInitialized || !this.model) {
      throw new Error('Gemini service not initialized. Call initialize() first.');
    }

    // Rate limiting to prevent too many rapid requests
    const now = Date.now();
    const timeSinceLastRequest = now - this.lastRequestTime;
    if (timeSinceLastRequest < this.minRequestInterval) {
      const waitTime = this.minRequestInterval - timeSinceLastRequest;
      logger.info(`Rate limiting: waiting ${waitTime}ms before next request`, undefined, 'GeminiService');
      await new Promise(resolve => setTimeout(resolve, waitTime));
    }
    this.lastRequestTime = Date.now();

    try {
      logger.startTimer('gemini-single-hint-generation');
      
      // Use country info from street view component
      const locationContext = {
        country: request.countryInfo.country,
        countryCode: request.countryInfo.countryCode,
        formattedAddress: request.countryInfo.formattedAddress
      };
      
      const prompt = this.buildSingleHintPrompt(request, locationContext);
      logger.info('Generating single AI hint', { 
        location: request.location, 
        roundNumber: request.roundNumber,
        hintNumber: request.hintNumber,
        locationInfo: locationContext.country
      }, 'GeminiService');

      // Add timeout to prevent hanging requests
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error('AI request timeout after 30 seconds')), 30000);
      });
      
      const result = await Promise.race([
        this.model.generateContent(prompt),
        timeoutPromise
      ]);
      
      const response = result.response;
      const text = response.text();

      const parsedResponse = this.parseSingleHintResponse(text, request.hintNumber);
      
      const duration = logger.endTimer('gemini-single-hint-generation', 'Single AI hint generated successfully');
      logger.perf('Gemini single hint generation', duration, {
        hintNumber: request.hintNumber,
        category: parsedResponse.category,
        difficulty: parsedResponse.difficulty,
        confidence: parsedResponse.confidence,
        locationInfo: locationContext.country
      });

      return parsedResponse;
    } catch (error: unknown) {
      logger.endTimer('gemini-single-hint-generation');
      logger.error('Failed to generate single hint', error, 'GeminiService');
      
      const errorMessage = error instanceof Error ? error.message : String(error);
      
      // For certain errors, throw instead of using fallback to provide better user feedback
      if (errorMessage.includes('API key') || 
          errorMessage.includes('timeout') ||
          errorMessage.includes('network') ||
          errorMessage.includes('OVER_QUERY_LIMIT')) {
        throw error;
      }
      
      // Return fallback hint for other errors
      return this.getFallbackSingleHint(request);
    }
  }

  private buildSingleHintPrompt(request: SingleHintRequest, locationContext: LocationContext): string {
    const { roundNumber, gameMode, hintNumber, previousHints } = request;
    
    const difficultyGuidance = this.getDifficultyGuidance(hintNumber);
    const locationInfo = `LOCATION INFO: ${locationContext.country} (${locationContext.countryCode})\nFORMATTED ADDRESS: ${locationContext.formattedAddress}`;
    
    return `You are an AI assistant for a GeoGuessr-style game. A player is looking at a Street View location and needs ONE strategic hint worth 300 points.

${locationInfo}
ROUND: ${roundNumber} (Game Mode: ${gameMode})
HINT NUMBER: ${hintNumber} (Player pays 300 points per hint)
${previousHints && previousHints.length > 0 ? `PREVIOUS HINTS: ${previousHints.join(' | ')}` : ''}

${difficultyGuidance}

CRITICAL RULES:
- Provide ONLY ONE specific, actionable hint
- Focus on what's ACTUALLY OBSERVABLE in Street View
- Don't directly name the country, city, or exact location
- Make it worth 300 points - be specific and helpful
- Give clues about things players can SEE: signs, architecture, vehicles, vegetation, infrastructure
- Avoid vague geographical descriptions like "temperate climate" or "hilly terrain"

FOCUS ON OBSERVABLE DETAILS:
- **Language on signs**: Script types, alphabet systems, specific language patterns
- **Architecture**: Building materials, roof styles, window designs, urban planning
- **Infrastructure**: Road markings, traffic signs, utility poles, street lighting
- **Vehicles**: License plate styles, car models, driving side
- **Vegetation**: Specific plant types, agricultural patterns
- **Cultural markers**: Religious buildings, architectural styles, urban design

EXAMPLES OF GOOD HINTS:
- "Look for Cyrillic script on signs and buildings"
- "The architecture features red tile roofs typical of Mediterranean regions"
- "Notice the yellow license plates and right-hand traffic"
- "The utility poles have a distinctive cross-beam design common in Nordic countries"
- "Look for kanji characters mixed with hiragana on street signs"

EXAMPLES OF BAD HINTS:
- "You are in East Asia with temperate climate" (too vague)
- "This is a hilly region with urban development" (not observable)
- "The terrain suggests mountainous areas" (not specific enough)

Respond in this exact JSON format:
{
  "hint": "Your specific, observable hint here",
  "confidence": 0.85,
  "category": "cultural",
  "difficulty": "medium"
}`;
  }

  private getDifficultyGuidance(hintNumber: number): string {
    switch (hintNumber) {
      case 1:
        return `FIRST HINT - BROAD BUT SPECIFIC:
- Focus on major observable characteristics (language family, architectural style, driving side)
- Help narrow down from 195 countries to maybe 10-20 possibilities
- Example: "Look for Arabic script on signs and buildings"`;
      
      case 2:
        return `SECOND HINT - MORE SPECIFIC:
- Focus on distinctive regional characteristics that are visible
- Help narrow down to a specific country or small region
- Example: "The license plates are white with blue EU strip on the left"`;
      
      case 3:
        return `THIRD HINT - QUITE SPECIFIC:
- Focus on country-specific observable details
- Help identify the exact country without giving it away
- Example: "Notice the distinctive red and white striped road barriers"`;
      
      default:
        return `ADDITIONAL HINT - VERY SPECIFIC:
- Focus on highly distinctive local characteristics
- Help pinpoint the exact country or region
- Example: "The combination of kanji and hiragana characters with specific architectural elements"`;
    }
  }

  private parseSingleHintResponse(text: string, hintNumber: number): SingleHintResponse {
    try {
      // Try to extract JSON from the response
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        
        if (parsed.hint && typeof parsed.hint === 'string') {
          return {
            hint: parsed.hint.trim(),
            confidence: Math.max(0.1, Math.min(1.0, parsed.confidence || 0.7)),
            category: this.validateCategory(parsed.category) || 'general',
            difficulty: this.validateDifficulty(parsed.difficulty) || this.getDefaultDifficulty(hintNumber)
          };
        }
      }
      
      // Fallback: try to extract hint from plain text
      const lines = text.split('\n').filter(line => line.trim().length > 0);
      const hintLine = lines.find(line => 
        line.length > 20 && 
        !line.includes('{') && 
        !line.includes('}') &&
        !line.toLowerCase().includes('hint:')
      );

      if (hintLine) {
        return {
          hint: hintLine.trim(),
          confidence: 0.6,
          category: 'general',
          difficulty: this.getDefaultDifficulty(hintNumber)
        };
      }

      throw new Error('Could not parse valid hint from response');
    } catch (error) {
      logger.error('Failed to parse Gemini single hint response', error, 'GeminiService');
      throw error;
    }
  }

  private validateCategory(category: string): SingleHintResponse['category'] | null {
    const validCategories: SingleHintResponse['category'][] = [
      'geographical', 'cultural', 'architectural', 'environmental', 'general'
    ];
    return validCategories.includes(category as SingleHintResponse['category']) ? category as SingleHintResponse['category'] : null;
  }

  private validateDifficulty(difficulty: string): SingleHintResponse['difficulty'] | null {
    const validDifficulties: SingleHintResponse['difficulty'][] = ['easy', 'medium', 'hard'];
    return validDifficulties.includes(difficulty as SingleHintResponse['difficulty']) ? difficulty as SingleHintResponse['difficulty'] : null;
  }

  private getDefaultDifficulty(hintNumber: number): SingleHintResponse['difficulty'] {
    if (hintNumber === 1) return 'easy';
    if (hintNumber === 2) return 'medium';
    return 'hard';
  }

  private getFallbackSingleHint(request: SingleHintRequest): SingleHintResponse {
    const { hintNumber } = request;
    
    // Generate more specific geographical hints based on hint number
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

    return {
      hint,
      confidence: 0.5,
      category,
      difficulty: this.getDefaultDifficulty(hintNumber)
    };
  }

  isReady(): boolean {
    return this.isInitialized && this.model !== null;
  }
}

export const geminiService = new GeminiService();