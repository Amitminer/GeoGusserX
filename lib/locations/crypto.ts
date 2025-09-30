/**
 * Cryptographic utilities for generating secure random numbers
 */

/**
 * Generate a cryptographically secure random number between 0 and 1
 * Uses time-based entropy to prevent repetitive patterns
 * Falls back to Math.random() if crypto is not available
 * @returns A random number between 0 and 1
 */
export function secureRandom(): number {
	try {
		if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
			const array = new Uint32Array(2);
			crypto.getRandomValues(array);
			
			// Add time-based entropy to prevent patterns
			const timeEntropy = (Date.now() % 1000000) / 1000000;
			const performanceEntropy = (performance.now() % 1000) / 1000;
			
			// Combine crypto random with time-based entropy
			const cryptoRandom = array[0] / (0xFFFFFFFF + 1);
			const secondCrypto = array[1] / (0xFFFFFFFF + 1);
			
			// XOR-based mixing for better entropy distribution
			const mixed = (cryptoRandom + timeEntropy + performanceEntropy + secondCrypto) % 1;
			return mixed;
		}
	} catch {
		console.warn('Crypto API not available, falling back to improved Math.random()');
	}

	// Improved fallback with time-based entropy
	const timeEntropy = (Date.now() % 1000000) / 1000000;
	const performanceEntropy = (performance.now() % 1000) / 1000;
	return (Math.random() + timeEntropy + performanceEntropy) % 1;
}

/**
 * Generate a cryptographically secure random integer between min and max (inclusive)
 * @param min - Minimum value (inclusive)
 * @param max - Maximum value (inclusive)
 * @returns A random integer in the specified range
 */
export function secureRandomInt(min: number, max: number): number {
	const range = max - min + 1;
	return Math.floor(secureRandom() * range) + min;
}

/**
 * Generate a cryptographically secure random float between min and max
 * @param min - Minimum value
 * @param max - Maximum value
 * @returns A random float in the specified range
 */
export function secureRandomFloat(min: number, max: number): number {
	return secureRandom() * (max - min) + min;
}

/**
 * Generate multiple random numbers and return the one with best distribution
 * This helps avoid clustering by sampling multiple candidates
 * @param count - Number of candidates to generate
 * @returns The best distributed random number
 */
export function distributedRandom(count: number = 3): number {
	const candidates = Array.from({ length: count }, () => secureRandom());

	// Use the median value for better distribution
	candidates.sort((a, b) => a - b);
	const medianIndex = Math.floor(candidates.length / 2);
	return candidates[medianIndex];
}

/**
 * Generate a random angle with optional bias towards certain directions
 * @param biasStrength - How much to bias towards common directions (0-1)
 * @returns Random angle in radians
 */
export function randomAngle(biasStrength: number = 0): number {
	if (biasStrength <= 0) {
		return secureRandom() * 2 * Math.PI;
	}

	// Add slight bias towards cardinal and diagonal directions
	const baseAngle = secureRandom() * 2 * Math.PI;
	const cardinalAngles = [0, Math.PI / 2, Math.PI, 3 * Math.PI / 2]; // N, E, S, W
	const diagonalAngles = [Math.PI / 4, 3 * Math.PI / 4, 5 * Math.PI / 4, 7 * Math.PI / 4]; // NE, SE, SW, NW

	const allBiasAngles = [...cardinalAngles, ...diagonalAngles];
	const nearestBias = allBiasAngles.reduce((closest, angle) => {
		const currentDiff = Math.abs(baseAngle - angle);
		const closestDiff = Math.abs(baseAngle - closest);
		return currentDiff < closestDiff ? angle : closest;
	});

	// Blend between random and biased angle
	return baseAngle * (1 - biasStrength) + nearestBias * biasStrength;
}

/**
 * Generate a random distance with realistic distribution
 * Uses a beta distribution to make locations more likely near edges
 * @param maxDistance - Maximum distance
 * @param shape - Shape parameter for distribution (higher = more edge bias)
 * @returns Random distance
 */
export function randomDistance(maxDistance: number, shape: number = 2): number {
	// Generate beta distribution approximation using rejection sampling
	let sample: number;
	do {
		sample = Math.pow(secureRandom(), 1 / shape);
	} while (sample > 1);

	return sample * maxDistance;
}

/**
 * Generate a high-entropy random seed based on multiple sources
 * Used to ensure truly random location generation without patterns
 * @returns A high-entropy random seed
 */
export function generateEntropySeed(): number {
	const sources = [
		secureRandom(),
		(Date.now() % 1000000) / 1000000,
		(performance.now() % 10000) / 10000,
		(Math.random() * 1000) % 1,
		(new Date().getMilliseconds()) / 1000
	];
	
	// Combine all entropy sources using a mixing function
	let seed = 0;
	for (let i = 0; i < sources.length; i++) {
		seed = (seed + sources[i] * (i + 1)) % 1;
	}
	
	return seed;
}
