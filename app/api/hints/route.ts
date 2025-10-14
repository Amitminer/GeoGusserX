import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { logger } from '@/lib/logger';
import type { SingleHintRequest, SingleHintResponse } from '@/lib/ai/types';

/**
 * In-memory storage for rate limiting. In a production environment, this should be
 * replaced with a more robust solution like Redis or a similar distributed cache
 * to handle multiple server instances.
 */
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute
const RATE_LIMIT_MAX_REQUESTS = 10; // Max 10 requests per minute per IP

/**
 * Constants defining the validation boundaries for incoming hint requests.
 * These are used to prevent malformed or malicious data from being processed
 * and to keep the requests within reasonable, expected limits.
 */
const MAX_ROUND_NUMBER = 1000; // Reasonable max for round numbers
const MAX_HINT_NUMBER = 10; // Reasonable max for hints per round
const MAX_GAME_MODE_LENGTH = 50; // Reasonable max length for game mode string
const MAX_PREVIOUS_HINTS = 20; // Reasonable max for previous hints array
const MAX_HINT_LENGTH = 1000; // Reasonable max length for individual hints
const MAX_COUNTRY_INFO_LENGTH = 500; // Reasonable max length for country info strings

/**
 * A utility function that wraps a promise with a timeout.
 * If the promise does not resolve or reject within the specified time,
 * it will be rejected with a timeout error.
 * @param p The promise to wrap.
 * @param ms The timeout duration in milliseconds.
 * @param message The error message to use if the timeout is exceeded.
 * @returns A new promise that incorporates the timeout.
 */
function withTimeout<T>(p: Promise<T>, ms: number, message: string): Promise<T> {
	return new Promise<T>((resolve, reject) => {
		const timer = setTimeout(() => {
			reject(new Error(message));
		}, ms);

		p.then(
			(value) => {
				clearTimeout(timer);
				resolve(value);
			},
			(error) => {
				clearTimeout(timer);
				reject(error);
			}
		);
	});
}

/**
 * Validates the structure and content of the incoming request body.
 * This function performs strict checks on all expected properties to ensure
 * they are of the correct type and within acceptable bounds.
 * @param body The raw request body.
 * @returns A boolean indicating whether the request body is valid.
 */
function validateRequest(body: unknown): body is SingleHintRequest {
	if (!body || typeof body !== 'object' || body === null) {
		return false;
	}

	const obj = body as Record<string, unknown>;

	// Check location object with strict geographic bounds
	if (!obj.location || typeof obj.location !== 'object' || obj.location === null) {
		return false;
	}
	const location = obj.location as Record<string, unknown>;
	if (typeof location.lat !== 'number' || typeof location.lng !== 'number') {
		return false;
	}
	// Validate coordinates are finite numbers within valid geographic bounds
	if (!Number.isFinite(location.lat) || !Number.isFinite(location.lng) ||
		location.lat < -90 || location.lat > 90 ||
		location.lng < -180 || location.lng > 180) {
		return false;
	}

	// Check basic properties with strict validation
	if (typeof obj.roundNumber !== 'number' ||
		typeof obj.gameMode !== 'string' ||
		typeof obj.hintNumber !== 'number') {
		return false;
	}
	// Validate roundNumber and hintNumber are finite integers within reasonable bounds
	if (!Number.isFinite(obj.roundNumber) || !Number.isInteger(obj.roundNumber) ||
		obj.roundNumber < 1 || obj.roundNumber > MAX_ROUND_NUMBER) {
		return false;
	}
	if (!Number.isFinite(obj.hintNumber) || !Number.isInteger(obj.hintNumber) ||
		obj.hintNumber < 1 || obj.hintNumber > MAX_HINT_NUMBER) {
		return false;
	}
	// Validate gameMode is a non-empty string of reasonable length
	if (obj.gameMode.length === 0 || obj.gameMode.length > MAX_GAME_MODE_LENGTH) {
		return false;
	}

	// Check countryInfo object with strict string validation
	if (!obj.countryInfo || typeof obj.countryInfo !== 'object' || obj.countryInfo === null) {
		return false;
	}
	const countryInfo = obj.countryInfo as Record<string, unknown>;
	if (typeof countryInfo.country !== 'string' ||
		typeof countryInfo.countryCode !== 'string' ||
		typeof countryInfo.formattedAddress !== 'string') {
		return false;
	}
	// Validate countryInfo strings are non-empty and within reasonable length bounds
	if (countryInfo.country.length === 0 || countryInfo.country.length > MAX_COUNTRY_INFO_LENGTH ||
		countryInfo.countryCode.length === 0 || countryInfo.countryCode.length > 10 || // Country codes are typically 2-3 chars
		countryInfo.formattedAddress.length === 0 || countryInfo.formattedAddress.length > MAX_COUNTRY_INFO_LENGTH) {
		return false;
	}

	// Optional previousHints array with stricter validation
	if (obj.previousHints !== undefined && !Array.isArray(obj.previousHints)) {
		return false;
	}
	if (Array.isArray(obj.previousHints)) {
		// Validate array length is within reasonable bounds
		if (obj.previousHints.length > MAX_PREVIOUS_HINTS) {
			return false;
		}
		for (const hint of obj.previousHints) {
			if (typeof hint !== 'string' || hint.length === 0 || hint.length > MAX_HINT_LENGTH) {
				return false;
			}
		}
	}

	return true;
}

/**
 * Checks if a request from a given IP address is within the defined rate limits.
 * @param ip The client's IP address.
 * @returns `true` if the request is allowed, `false` otherwise.
 */
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

/**
 * Retrieves the client's IP address from the request headers.
 * It checks for common proxy headers like 'x-forwarded-for' and 'x-real-ip'.
 * @param request The Next.js request object.
 * @returns The client's IP address or 'unknown' if it cannot be determined.
 */
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

/**
 * Constructs the prompt for the generative AI model.
 * This function is a key part of the prompt engineering strategy. It assembles all the
 * relevant context—location, game state, previous hints, and difficulty guidance—into a
 * single, detailed prompt that instructs the AI on how to generate a useful hint.
 * @param request The validated hint request object.
 * @returns A string containing the full prompt for the AI.
 */
function buildSingleHintPrompt(request: SingleHintRequest): string {
	const { roundNumber, gameMode, hintNumber, previousHints, countryInfo } = request;

	const difficultyGuidance = getDifficultyGuidance(hintNumber);
	const locationInfo = `LOCATION INFO: ${countryInfo.country} (${countryInfo.countryCode})\nFORMATTED ADDRESS: ${countryInfo.formattedAddress}`;

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

/**
 * Provides difficulty-specific guidance to the AI based on the hint number.
 * This helps the AI to generate progressively more specific hints as the player requests more.
 * @param hintNumber The sequential number of the hint being requested.
 * @returns A string containing guidance for the AI.
 */
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

/**
 * Parses the raw text response from the AI model into a structured `SingleHintResponse` object.
 * This function is designed to be robust, attempting to parse JSON from various formats
 * (e.g., plain JSON, JSON within code blocks). If JSON parsing fails, it falls back to
 * extracting a plausible hint from plain text.
 * @param text The raw text response from the AI.
 * @param hintNumber The current hint number, used for determining fallback difficulty.
 * @returns A structured `SingleHintResponse` object.
 */
function parseSingleHintResponse(text: string, hintNumber: number): SingleHintResponse {
	try {
		// Try to find a JSON object within the text, even if it's embedded in other text or code blocks.
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
						return {
							hint: parsed.hint.trim(),
							confidence: Math.max(0.1, Math.min(1.0, parsed.confidence || 0.7)),
							category: validateCategory(parsed.category) || 'general',
							difficulty: validateDifficulty(parsed.difficulty) || getDefaultDifficulty(hintNumber)
						};
					}
				} catch {
					// If parsing this match fails, continue to the next pattern.
					continue;
				}
			}
		}

		// Fallback: if no JSON is found, try to extract a hint from plain text.
		const lines = text.split('\n').filter(line => line.trim().length > 0);

		// Heuristics to identify a line that is likely a hint.
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
			return {
				hint,
				confidence: 0.6,
				category: 'general',
				difficulty: getDefaultDifficulty(hintNumber)
			};
		}

		// If we can't parse anything, return a generic fallback hint.
		return {
			hint: "Look for distinctive language, architecture, or cultural markers visible in the Street View.",
			confidence: 0.5,
			category: 'general',
			difficulty: getDefaultDifficulty(hintNumber)
		};
	} catch (error) {
		logger.error('Failed to parse AI response', error, 'HintsAPI');
		// Return fallback instead of throwing to ensure the user always gets a response.
		return {
			hint: "Look for distinctive language, architecture, or cultural markers visible in the Street View.",
			confidence: 0.5,
			category: 'general',
			difficulty: getDefaultDifficulty(hintNumber)
		};
	}
}

/**
 * Validates and normalizes the category string from the AI response.
 * It maps common synonyms to the official categories.
 * @param category The category string from the AI.
 * @returns A valid category or `null`.
 */
function validateCategory(category: string): SingleHintResponse['category'] | null {
	const validCategories: SingleHintResponse['category'][] = [
		'geographical', 'cultural', 'architectural', 'environmental', 'general'
	];

	// Map common AI responses to valid categories
	const categoryMap: Record<string, SingleHintResponse['category']> = {
		'language': 'cultural',
		'linguistic': 'cultural',
		'script': 'cultural',
		'text': 'cultural',
		'building': 'architectural',
		'structure': 'architectural',
		'infrastructure': 'architectural',
		'vehicles': 'cultural',
		'transportation': 'cultural',
		'nature': 'environmental',
		'climate': 'environmental',
		'location': 'geographical',
		'region': 'geographical'
	};

	if (validCategories.includes(category as SingleHintResponse['category'])) {
		return category as SingleHintResponse['category'];
	}

	return categoryMap[category.toLowerCase()] || null;
}

/**
 * Validates the difficulty string from the AI response.
 * @param difficulty The difficulty string from the AI.
 * @returns A valid difficulty or `null`.
 */
function validateDifficulty(difficulty: string): SingleHintResponse['difficulty'] | null {
	const validDifficulties: SingleHintResponse['difficulty'][] = ['easy', 'medium', 'hard'];
	return validDifficulties.includes(difficulty as SingleHintResponse['difficulty']) ? difficulty as SingleHintResponse['difficulty'] : null;
}

/**
 * Determines the default difficulty for a hint based on its number.
 * @param hintNumber The sequential number of the hint.
 * @returns The difficulty level.
 */
function getDefaultDifficulty(hintNumber: number): SingleHintResponse['difficulty'] {
	if (hintNumber === 1) return 'easy';
	if (hintNumber === 2) return 'medium';
	return 'hard';
}

/**
 * Redacts terms from the hint that would directly reveal the answer (country name or code).
 * This is a security measure to ensure the game remains challenging.
 * @param resp The hint response object.
 * @param info An object containing the country name and code to redact.
 * @returns The hint response with redacted terms.
 */
function redactCountryTerms(
	resp: SingleHintResponse,
	info: { country: string; countryCode: string }
): SingleHintResponse {
	// Escape user-provided terms to prevent RegExp injection and apply global replacement
	const esc = (s: string) => s.replace(/[-/\^$*+?.()|[\\]{}]/g, '\\$&');
	const patterns = [
		new RegExp(`\\b${esc(info.country)}\\b`, 'ig'),
		new RegExp(`\\b${esc(info.countryCode)}\\b`, 'ig')
	];
	let hint = resp.hint;
	for (const re of patterns) {
		hint = hint.replace(re, 'this country');
	}
	return { ...resp, hint };
}

/**
 * Provides a generic, fallback hint when the primary AI service fails.
 * The hints are based on the hint number and offer general advice.
 * @param request The original hint request.
 * @returns A `SingleHintResponse` with a fallback hint.
 */
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

/**
 * The main handler for the POST request to the /api/hints endpoint.
 * It orchestrates the entire process of receiving a hint request, validating it,
 * checking rate limits, calling the AI service, parsing the response, and returning
 * a structured hint to the client.
 * @param request The incoming Next.js request.
 * @returns A Next.js response object.
 */
export async function POST(request: NextRequest) {
	// Parse request body once and store it in outer scope
	let body: unknown;
	try {
		body = await request.json();
	} catch (parseError) {
		logger.error('Failed to parse request body', parseError, 'HintsAPI');
		return NextResponse.json(
			{ error: 'Invalid JSON in request body' },
			{ status: 400 }
		);
	}

	// Get client IP for rate limiting
	const clientIP = getClientIP(request);

	// Check rate limit
	if (!checkRateLimit(clientIP)) {
		return NextResponse.json(
			{ error: 'Rate limit exceeded. Please wait before requesting another hint.' },
			{ status: 429 }
		);
	}

	// Validate request
	if (!validateRequest(body)) {
		return NextResponse.json(
			{ error: 'Invalid request format' },
			{ status: 400 }
		);
	}

	// Type-cast the validated body for type safety - now in broader scope
	const reqBody = body as SingleHintRequest;

	try {

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
			model: 'gemini-2.0-flash',
			generationConfig: {
				temperature: 0.7,
				topP: 0.8,
				topK: 40,
				maxOutputTokens: 1000,
			},
		});

		// Build prompt and generate hint
		const prompt = buildSingleHintPrompt(reqBody);

		// Add timeout to prevent hanging requests with proper cleanup
		const result = await withTimeout(
			model.generateContent(prompt),
			30000,
			'AI request timeout after 30 seconds'
		);

		const response = result.response;
		const text = response.text();

		// Parse the response (now with built-in fallback handling)
		const parsedResponse = parseSingleHintResponse(text, reqBody.hintNumber);
		const safeResponse = redactCountryTerms(parsedResponse, {
			country: reqBody.countryInfo.country,
			countryCode: reqBody.countryInfo.countryCode
		});
		return NextResponse.json(safeResponse);

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

		// For other errors, return fallback hint using already-validated reqBody
		const fallbackHint = getFallbackSingleHint(reqBody);
		const safeResponse = redactCountryTerms(fallbackHint, {
			country: reqBody.countryInfo.country,
			countryCode: reqBody.countryInfo.countryCode
		});
		return NextResponse.json(safeResponse);
	}
}
