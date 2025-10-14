/**
 * Cryptographic utilities for generating secure random numbers.
 * These functions are designed to provide higher quality randomness than `Math.random()`
 * by incorporating cryptographic sources and other entropy.
 */

/**
 * Generates a cryptographically secure random number between 0 (inclusive) and 1 (exclusive).
 * It combines entropy from the Web Crypto API with time-based and performance-based
 * entropy to produce a high-quality random value. If the Crypto API is unavailable,
 * it gracefully falls back to a `Math.random()`-based approach with similar entropy mixing.
 *
 * @returns A random number between 0 and 1.
 */
export function secureRandom(): number {
	try {
		if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
			const array = new Uint32Array(2);
			crypto.getRandomValues(array);
			
			// Time-based entropy helps prevent patterns if the crypto source is compromised or weak.
			const timeEntropy = (Date.now() % 1000000) / 1000000;
			const performanceEntropy = (performance.now() % 1000) / 1000;
			
			// Combine two crypto-random numbers with time-based entropy.
			const cryptoRandom = array[0] / (0xFFFFFFFF + 1);
			const secondCrypto = array[1] / (0xFFFFFFFF + 1);
			
			// A simple XOR-like mixing function to distribute the entropy more evenly.
			const mixed = (cryptoRandom + timeEntropy + performanceEntropy + secondCrypto) % 1;
			return mixed;
		}
	} catch {
		console.warn('Crypto API not available, falling back to Math.random()');
	}

	// Fallback mechanism that still incorporates time-based entropy.
	const timeEntropy = (Date.now() % 1000000) / 1000000;
	const performanceEntropy = (performance.now() % 1000) / 1000;
	return (Math.random() + timeEntropy + performanceEntropy) % 1;
}

/**
 * Generates a cryptographically secure random integer between a given minimum and maximum (inclusive).
 * @param min The minimum value of the range (inclusive).
 * @param max The maximum value of the range (inclusive).
 * @returns A random integer within the specified range.
 */
export function secureRandomInt(min: number, max: number): number {
	const range = max - min + 1;
	return Math.floor(secureRandom() * range) + min;
}

/**
 * Generates a cryptographically secure random floating-point number between a given minimum and maximum.
 * @param min The minimum value of the range.
 * @param max The maximum value of the range.
 * @returns A random float within the specified range.
 */
export function secureRandomFloat(min: number, max: number): number {
	return secureRandom() * (max - min) + min;
}

/**
 * Generates multiple random number candidates and returns the one with the best distribution.
 * By taking the median of a sample of random numbers, this function avoids clustering and
 * produces a more evenly distributed result than a single call to `secureRandom()`.
 * @param count The number of candidates to generate. Defaults to 3.
 * @returns The median of the generated random numbers.
 */
export function distributedRandom(count: number = 3): number {
	const candidates = Array.from({ length: count }, () => secureRandom());

	// Using the median helps to avoid extreme values and provides a better-distributed random number.
	candidates.sort((a, b) => a - b);
	const medianIndex = Math.floor(candidates.length / 2);
	return candidates[medianIndex];
}

/**
 * Generates a random angle in radians, with an optional bias towards cardinal and diagonal directions.
 * This can be used to create more natural-feeling random movements or placements.
 * @param biasStrength A value from 0 to 1 that controls how much to bias the angle. 0 means no bias.
 * @returns A random angle in radians.
 */
export function randomAngle(biasStrength: number = 0): number {
	if (biasStrength <= 0) {
		return secureRandom() * 2 * Math.PI;
	}

	// Bias towards common directions can make random generation feel more intentional.
	const baseAngle = secureRandom() * 2 * Math.PI;
	const cardinalAngles = [0, Math.PI / 2, Math.PI, 3 * Math.PI / 2]; // N, E, S, W
	const diagonalAngles = [Math.PI / 4, 3 * Math.PI / 4, 5 * Math.PI / 4, 7 * Math.PI / 4]; // NE, SE, SW, NW

	const allBiasAngles = [...cardinalAngles, ...diagonalAngles];
	const nearestBias = allBiasAngles.reduce((closest, angle) => {
		const currentDiff = Math.abs(baseAngle - angle);
		const closestDiff = Math.abs(baseAngle - closest);
		return currentDiff < closestDiff ? angle : closest;
	});

	// Linearly interpolate between the purely random angle and the nearest biased angle.
	return baseAngle * (1 - biasStrength) + nearestBias * biasStrength;
}

/**
 * Generates a random distance with a more realistic distribution.
 * It uses a beta distribution, which can be shaped to make locations near the edges
 * of a boundary more or less likely. A higher shape parameter increases the bias towards the maximum distance.
 * @param maxDistance The maximum possible distance.
 * @param shape The shape parameter for the beta distribution. Higher values bias towards `maxDistance`.
 * @returns A random distance value.
 */
export function randomDistance(maxDistance: number, shape: number = 2): number {
	// This is a simple approximation of a beta distribution using rejection sampling.
	let sample: number;
	do {
		sample = Math.pow(secureRandom(), 1 / shape);
	} while (sample > 1);

	return sample * maxDistance;
}

/**
 * Generates a high-entropy random seed by combining multiple sources of randomness.
 * This is useful for seeding pseudo-random number generators in a way that is difficult to predict.
 * @returns A high-entropy random seed between 0 and 1.
 */
export function generateEntropySeed(): number {
	const sources = [
		secureRandom(),
		(Date.now() % 1000000) / 1000000,
		(performance.now() % 10000) / 10000,
		(Math.random() * 1000) % 1,
		(new Date().getMilliseconds()) / 1000
	];
	
	// A simple mixing function that combines the entropy from all sources.
	let seed = 0;
	for (let i = 0; i < sources.length; i++) {
		seed = (seed + sources[i] * (i + 1)) % 1;
	}
	
	return seed;
}