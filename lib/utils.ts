import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Calculate the distance between two geographic points using the Haversine formula
 * @param lat1 Latitude of first point
 * @param lon1 Longitude of first point
 * @param lat2 Latitude of second point
 * @param lon2 Longitude of second point
 * @returns Distance in kilometers
 */
export function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371; // Earth's radius in kilometers
  const dLat = toRadians(lat2 - lat1);
  const dLon = toRadians(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(lat1)) *
      Math.cos(toRadians(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function toRadians(degrees: number): number {
  return degrees * (Math.PI / 180);
}

/**
 * Calculate score based on distance (0-5000 points)
 * @param distance Distance in kilometers
 * @returns Score between 0 and 5000
 */
export function calculateScore(distance: number): number {
  if (distance === 0) return 5000;
  if (distance >= 20000) return 0;
  
  // Exponential decay function for scoring
  const score = Math.max(0, Math.round(5000 * Math.exp(-distance / 2000)));
  return score;
}

/**
 * Format distance for display
 * @param distance Distance in kilometers
 * @returns Formatted distance string
 */
export function formatDistance(distance: number): string {
  if (distance < 1) {
    return `${Math.round(distance * 1000)}m`;
  } else if (distance < 1000) {
    return `${distance.toFixed(1)}km`;
  } else {
    return `${Math.round(distance).toLocaleString()}km`;
  }
}

/**
 * Format score for display
 * @param score Score value
 * @returns Formatted score string
 */
export function formatScore(score: number): string {
  return score.toLocaleString();
}