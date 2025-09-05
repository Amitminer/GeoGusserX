/**
 * Browser Console Region Lookup Test
 * Copy and paste this into your browser console when running the app
 */

import { runPerformanceTest, quickPerformanceTest, testCountryLookups } from '../lib/locations/performance-test';

// Make functions available globally for browser console
declare global {
  interface Window {
    testLocationPerformance: {
      quick: () => void;
      full: () => void;
      countries: () => void;
      scale: () => void;
    };
  }
}

// Export functions to global window object for browser testing
if (typeof window !== 'undefined') {
  window.testLocationPerformance = {
    quick: () => quickPerformanceTest(),
    full: () => runPerformanceTest(10000),
    countries: () => testCountryLookups(),
    scale: () => runPerformanceTest(100000)
  };
  
  console.log('🧪 Location Performance Tests Available!');
  console.log('Run these commands in the console:');
  console.log('  testLocationPerformance.quick()     - Quick test');
  console.log('  testLocationPerformance.full()      - Full test');
  console.log('  testLocationPerformance.countries() - Country tests');
  console.log('  testLocationPerformance.scale()     - Scale test');
}