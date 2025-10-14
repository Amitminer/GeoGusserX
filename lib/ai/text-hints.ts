import type { TextHintResponse } from './types';
import type { GeocodeResult } from '@/lib/maps/geocoding';

const TEXT_HINT_BASE_COST = 50; // Cost per character reveal after the first free hint
const FREE_HINT_COST = 0; // First hint is free

/**
 * Generates a progressive text hint for the country name
 * First hint is free and shows first/last letters
 * Subsequent hints cost money and reveal one character at a time
 */
export function generateCountryLettersHint(
  countryInfo: GeocodeResult, 
  hintLevel: number = 1
): TextHintResponse {
  const countryName = countryInfo.country.toUpperCase();
  
  if (countryName.length <= 2) {
    // For very short country names, just show the full name
    return {
      hint: `Country: ${countryName}`,
      type: 'country-letters',
      cost: hintLevel === 1 ? FREE_HINT_COST : TEXT_HINT_BASE_COST,
      hintLevel,
      isComplete: true
    };
  }
  
  // Calculate which characters to reveal based on hint level
  const revealedPositions = getRevealedPositions(countryName.length, hintLevel);
  const hintText = buildHintText(countryName, revealedPositions);
  const isComplete = revealedPositions.length >= countryName.length;
  
  return {
    hint: `Country: ${hintText}`,
    type: 'country-letters',
    cost: hintLevel === 1 ? FREE_HINT_COST : TEXT_HINT_BASE_COST,
    hintLevel,
    isComplete
  };
}

/**
 * Determines which character positions should be revealed for a given hint level
 * Level 1: First and last letters (free)
 * Level 2+: Progressively reveal one character at a time from the middle
 */
function getRevealedPositions(nameLength: number, hintLevel: number): number[] {
  const positions: number[] = [];
  
  if (nameLength <= 2) {
    // For very short names, reveal everything
    for (let i = 0; i < nameLength; i++) {
      positions.push(i);
    }
    return positions;
  }
  
  // Always reveal first and last positions (level 1)
  positions.push(0, nameLength - 1);
  
  if (hintLevel === 1) {
    return positions;
  }
  
  // For subsequent levels, reveal characters progressively
  // Strategy: reveal from the middle outward, alternating sides
  const middlePositions = [];
  for (let i = 1; i < nameLength - 1; i++) {
    middlePositions.push(i);
  }
  
	/**
	 * Sorts the middle positions based on their distance from the center of the string.
	 * This makes the hints reveal characters from the inside out, which is a common game mechanic.
	 * If two characters have the same distance from the center, the one that appears earlier in the string is prioritized.
	 */
  const center = (nameLength - 1) / 2;
  middlePositions.sort((a, b) => {
    const distA = Math.abs(a - center);
    const distB = Math.abs(b - center);
    if (distA === distB) {
      // If same distance, prefer earlier position
      return a - b;
    }
    return distA - distB;
  });
  
  // Add revealed positions based on hint level
  const additionalReveals = Math.min(hintLevel - 1, middlePositions.length);
  for (let i = 0; i < additionalReveals; i++) {
    positions.push(middlePositions[i]);
  }
  
  return positions.sort((a, b) => a - b);
}

/**
 * Builds the hint text with revealed characters and underscores
 */
function buildHintText(countryName: string, revealedPositions: number[]): string {
  const result = [];
  
  for (let i = 0; i < countryName.length; i++) {
    if (revealedPositions.includes(i)) {
      result.push(countryName[i]);
    } else {
      result.push('_');
    }
  }
  
  return result.join(' ');
}

/**
 * Gets the cost of a text hint based on the hint level
 */
export function getTextHintCost(hintLevel: number = 1): number {
  return hintLevel === 1 ? FREE_HINT_COST : TEXT_HINT_BASE_COST;
}

/**
 * Gets the maximum number of text hints available for a country
 */
export function getMaxTextHints(countryInfo: GeocodeResult | null): number {
  if (!countryInfo || !countryInfo.country) return 0;
  
  const countryName = countryInfo.country.toUpperCase();
  if (countryName.length <= 2) return 1;
  
  // First hint (free) + one hint per middle character
  return countryName.length - 1;
}

/**
 * Checks if a text hint can be generated for the given country info
 */
export function canGenerateTextHint(countryInfo: GeocodeResult | null): boolean {
  return !!(countryInfo && countryInfo.country && countryInfo.country.trim().length > 0);
}

/**
 * Checks if more text hints are available
 */
export function hasMoreTextHints(countryInfo: GeocodeResult | null, currentHintLevel: number): boolean {
  if (!countryInfo) return false;
  const maxHints = getMaxTextHints(countryInfo);
  return currentHintLevel < maxHints;
}