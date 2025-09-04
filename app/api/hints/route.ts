import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { logger } from '@/lib/logger';

// Types for the API
interface SingleHintRequest {
	location: {
		lat: number;
		lng: number;
	};
	roundNumber: number;
	gameMode: string;
	hintNumber: number;
	previousHints?: string[];
	countryInfo: {
		country: string;
		countryCode: string;
		formattedAddress: string;
	};
}

interface SingleHintResponse {
	hint: string;
	confidence: number;
	category: 'geographical' | 'cultural' | 'architectural' | 'environmental' | 'general';
	difficulty: 'easy' | 'medium' | 'hard';
}

// Rate limiting storage (in production, use Redis or similar)
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute
const RATE_LIMIT_MAX_REQUESTS = 10; // Max 10 requests per minute per IP

// Request validation
function validateRequest(body: unknown): body is SingleHintRequest {
	if (!body || typeof body !== 'object' || body === null) {
		return false;
	}

	const obj = body as Record<string, unknown>;

	// Check location object
	if (!obj.location || typeof obj.location !== 'object' || obj.location === null) {
		return false;
	}
	const location = obj.location as Record<string, unknown>;
	if (typeof location.lat !== 'number' || typeof location.lng !== 'number') {
		return false;
	}

	// Check basic properties
	if (typeof obj.roundNumber !== 'number' ||
		typeof obj.gameMode !== 'string' ||
		typeof obj.hintNumber !== 'number') {
		return false;
	}

	// Check countryInfo object
	if (!obj.countryInfo || typeof obj.countryInfo !== 'object' || obj.countryInfo === null) {
		return false;
	}
	const countryInfo = obj.countryInfo as Record<string, unknown>;
	if (typeof countryInfo.country !== 'string' ||
		typeof countryInfo.countryCode !== 'string' ||
		typeof countryInfo.formattedAddress !== 'string') {
		return false;
	}

	// Optional previousHints array
	if (obj.previousHints !== undefined && !Array.isArray(obj.previousHints)) {
		return false;
	}
	if (Array.isArray(obj.previousHints)) {
		for (const hint of obj.previousHints) {
			if (typeof hint !== 'string') {
				return false;
			}
		}
	}

	return true;
}

// Rate limiting check
function checkRateLimit(ip: string): boolean {
	const now = Date.now();
	const userLimit = rateLimitMap.get(ip);

	if (!userLimit || now > userLimit.resetTime) {
		// Reset or create new limit
		rateLimitMap.set(ip, { count: 1, resetTime: now + RATE_LIMIT_WINDOW });
		return true;
	}

	if (userLimit.count >= RATE_LIMIT_MAX_REQUESTS) {
		return false;
	}

	userLimit.count++;
	return true;
}

// Get client IP address
function getClientIP(request: NextRequest): string {
	const forwarded = request.headers.get('x-forwarded-for');
	const realIP = request.headers.get('x-real-ip');

	if (forwarded) {
		return forwarded.split(',')[0].trim();
	}

	if (realIP) {
		return realIP;
	}

	return 'unknown';
}

// Build the AI prompt
function buildSingleHintPrompt(request: SingleHintRequest): string {
	const { roundNumber, gameMode, hintNumber, previousHints, countryInfo } = request;

	const difficultyGuidance = getDifficultyGuidance(hintNumber);
	const locationInfo = `LOCATION INFO: ${countryInfo.country} (${countryInfo.countryCode})\\nFORMATTED ADDRESS: ${countryInfo.formattedAddress}`;

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

function getDifficultyGuidance(hintNumber: number): string {
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

// Parse AI response with improved error handling
function parseSingleHintResponse(text: string, hintNumber: number): SingleHintResponse {
	// Log the raw response for debugging
	logger.info('Raw AI response received', { text: text.substring(0, 500) }, 'HintsAPI');

	try {
		// Try multiple JSON extraction patterns
		const jsonPatterns = [
			/\{[\s\S]*?\}/,  // Basic JSON pattern
			/```json\s*(\{[\s\S]*?\})\s*```/,  // JSON in code blocks
			/```\s*(\{[\s\S]*?\})\s*```/,  // JSON in generic code blocks
		];

		for (const pattern of jsonPatterns) {
			const jsonMatch = text.match(pattern);
			if (jsonMatch) {
				try {
					const jsonText = jsonMatch[1] || jsonMatch[0];
					const parsed = JSON.parse(jsonText);

					if (parsed.hint && typeof parsed.hint === 'string') {
						logger.info('Successfully parsed JSON response', { 
							hint: parsed.hint.substring(0, 100),
							category: parsed.category,
							difficulty: parsed.difficulty 
						}, 'HintsAPI');

						return {
							hint: parsed.hint.trim(),
							confidence: Math.max(0.1, Math.min(1.0, parsed.confidence || 0.7)),
							category: validateCategory(parsed.category) || 'general',
							difficulty: validateDifficulty(parsed.difficulty) || getDefaultDifficulty(hintNumber)
						};
					}
				} catch (parseError) {
					logger.warn('Failed to parse JSON match', { 
						jsonText: jsonMatch[0].substring(0, 200),
						error: parseError 
					}, 'HintsAPI');
					continue;
				}
			}
		}

		// Fallback: try to extract hint from plain text
		const lines = text.split('\n').filter(line => line.trim().length > 0);
		
		// Look for lines that could be hints
		const potentialHints = lines.filter(line => {
			const trimmed = line.trim();
			return (
				trimmed.length > 20 &&
				trimmed.length < 200 &&
				!trimmed.includes('{') &&
				!trimmed.includes('}') &&
				!trimmed.toLowerCase().includes('hint:') &&
				!trimmed.toLowerCase().includes('json') &&
				!trimmed.toLowerCase().includes('format') &&
				!trimmed.toLowerCase().includes('example') &&
				!trimmed.startsWith('*') &&
				!trimmed.startsWith('-') &&
				!trimmed.startsWith('#')
			);
		});

		if (potentialHints.length > 0) {
			const hint = potentialHints[0].trim();
			logger.info('Using fallback text parsing', { hint: hint.substring(0, 100) }, 'HintsAPI');
			
			return {
				hint,
				confidence: 0.6,
				category: 'general',
				difficulty: getDefaultDifficulty(hintNumber)
			};
		}

		// If all else fails, log the response and return a fallback
		logger.warn('Could not parse AI response, using fallback', { 
			responseLength: text.length,
			firstChars: text.substring(0, 200) 
		}, 'HintsAPI');

		throw new Error('Could not parse valid hint from response');
	} catch (error) {
		logger.error('Failed to parse Gemini single hint response', { 
			error,
			responseText: text.substring(0, 500) 
		}, 'HintsAPI');
		throw error;
	}
}

function validateCategory(category: string): SingleHintResponse['category'] | null {
	const validCategories: SingleHintResponse['category'][] = [
		'geographical', 'cultural', 'architectural', 'environmental', 'general'
	];
	return validCategories.includes(category as SingleHintResponse['category']) ? category as SingleHintResponse['category'] : null;
}

function validateDifficulty(difficulty: string): SingleHintResponse['difficulty'] | null {
	const validDifficulties: SingleHintResponse['difficulty'][] = ['easy', 'medium', 'hard'];
	return validDifficulties.includes(difficulty as SingleHintResponse['difficulty']) ? difficulty as SingleHintResponse['difficulty'] : null;
}

function getDefaultDifficulty(hintNumber: number): SingleHintResponse['difficulty'] {
	if (hintNumber === 1) return 'easy';
	if (hintNumber === 2) return 'medium';
	return 'hard';
}

function getFallbackSingleHint(request: SingleHintRequest): SingleHintResponse {
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

	return {
		hint,
		confidence: 0.5,
		category,
		difficulty: getDefaultDifficulty(hintNumber)
	};
}

export async function POST(request: NextRequest) {
	try {
		// Get client IP for rate limiting
		const clientIP = getClientIP(request);

		// Check rate limit
		if (!checkRateLimit(clientIP)) {
			return NextResponse.json(
				{ error: 'Rate limit exceeded. Please wait before requesting another hint.' },
				{ status: 429 }
			);
		}

		// Parse request body
		const body = await request.json();

		// Validate request
		if (!validateRequest(body)) {
			return NextResponse.json(
				{ error: 'Invalid request format' },
				{ status: 400 }
			);
		}

		// Check for API key
		const apiKey = process.env.GEMINI_API_KEY;
		if (!apiKey) {
			logger.error('Gemini API key not configured', undefined, 'HintsAPI');
			return NextResponse.json(
				{ error: 'AI service not available' },
				{ status: 503 }
			);
		}

		// Initialize Gemini AI
		const genAI = new GoogleGenerativeAI(apiKey);
		const model = genAI.getGenerativeModel({
			model: 'gemini-1.5-flash',
			generationConfig: {
				temperature: 0.9,
				topP: 0.95,
				topK: 40,
				maxOutputTokens: 300,
			},
		});

		// Build prompt and generate hint
		const prompt = buildSingleHintPrompt(body);

		logger.info('Generating AI hint via API', {
			location: body.location,
			roundNumber: body.roundNumber,
			hintNumber: body.hintNumber,
			country: body.countryInfo.country,
			clientIP
		}, 'HintsAPI');

		// Add timeout to prevent hanging requests
		const timeoutPromise = new Promise<never>((_, reject) => {
			setTimeout(() => reject(new Error('AI request timeout after 30 seconds')), 30000);
		});

		const result = await Promise.race([
			model.generateContent(prompt),
			timeoutPromise
		]);

		const response = result.response;
		const text = response.text();

		// Try to parse the response, with fallback handling
		let parsedResponse: SingleHintResponse;
		try {
			parsedResponse = parseSingleHintResponse(text, body.hintNumber);
		} catch (parseError) {
			// If parsing fails, return a fallback hint instead of throwing
			logger.warn('AI response parsing failed, using fallback hint', {
				parseError,
				hintNumber: body.hintNumber,
				country: body.countryInfo.country
			}, 'HintsAPI');
			
			parsedResponse = getFallbackSingleHint(body);
		}

		logger.info('AI hint generated successfully via API', {
			hintNumber: body.hintNumber,
			category: parsedResponse.category,
			difficulty: parsedResponse.difficulty,
			confidence: parsedResponse.confidence,
			country: body.countryInfo.country,
			clientIP
		}, 'HintsAPI');

		return NextResponse.json(parsedResponse);

	} catch (error: unknown) {
		logger.error('Failed to generate hint via API', error, 'HintsAPI');

		const errorMessage = error instanceof Error ? error.message : String(error);

		// For certain errors, return specific error responses
		if (errorMessage.includes('timeout')) {
			return NextResponse.json(
				{ error: 'Request timeout. Please try again.' },
				{ status: 408 }
			);
		}

		if (errorMessage.includes('OVER_QUERY_LIMIT')) {
			return NextResponse.json(
				{ error: 'Service temporarily unavailable. Please try again later.' },
				{ status: 503 }
			);
		}

		// For other errors, return fallback hint instead of error
		try {
			const body = await request.json();
			if (validateRequest(body)) {
				const fallbackHint = getFallbackSingleHint(body);
				logger.info('Returning fallback hint due to API error', {
					hintNumber: body.hintNumber,
					error: errorMessage
				}, 'HintsAPI');
				return NextResponse.json(fallbackHint);
			}
		} catch {
			// If we can't even parse the request, return generic error
		}

		return NextResponse.json(
			{ error: 'Failed to generate hint. Please try again.' },
			{ status: 500 }
		);
	}
}