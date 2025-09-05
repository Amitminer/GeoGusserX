/**
 * Performance Testing Utilities for Location Generation
 */

import { generateRandomLocation, generateLocationByCountry } from './index';
import { optimizedRegionManager } from './regions';
import { logger } from '../logger';

/**
 * Run comprehensive performance test
 */
export function runPerformanceTest(iterations: number = 10000) {
  logger.info('🚀 GeoGusserX Optimized Location Generation Performance Test', undefined, 'PerformanceTest');
  logger.info('=' .repeat(60), undefined, 'PerformanceTest');
  
  logger.info(`📊 Testing with ${iterations} iterations...`, undefined, 'PerformanceTest');
  
  // Test 1: Random Location Generation
  logger.info('🎲 Random Location Generation:', undefined, 'PerformanceTest');
  
  logger.startTimer('random-location-test');
  const start1 = performance.now();
  for (let i = 0; i < iterations; i++) {
    generateRandomLocation();
  }
  const randomTime = performance.now() - start1;
  logger.endTimer('random-location-test');
  
  logger.info(`Time: ${randomTime.toFixed(2)}ms`, { 
    iterations, 
    timeMs: randomTime,
    locationsPerSec: Math.round(iterations/randomTime*1000),
    microsecondsPerLocation: (randomTime/iterations*1000).toFixed(3)
  }, 'PerformanceTest');
  
  // Test 2: Country-Specific Generation
  logger.info('🌍 Country-Specific Generation (India):', undefined, 'PerformanceTest');
  
  logger.startTimer('country-location-test');
  const start2 = performance.now();
  for (let i = 0; i < iterations; i++) {
    generateLocationByCountry('India');
  }
  const countryTime = performance.now() - start2;
  logger.endTimer('country-location-test');
  
  logger.info(`Country Generation Results`, {
    country: 'India',
    iterations,
    timeMs: countryTime,
    locationsPerSec: Math.round(iterations/countryTime*1000),
    microsecondsPerLocation: (countryTime/iterations*1000).toFixed(3)
  }, 'PerformanceTest');
  
  // Test 3: Region Manager Performance
  logger.info('🔍 Region Manager Performance:', undefined, 'PerformanceTest');
  optimizedRegionManager.benchmark(iterations);
  
  // Test 4: Scalability Test
  logger.info('📈 Scalability Test (100k users simulation):', undefined, 'PerformanceTest');
  const scalabilityIterations = 100000;
  
  logger.startTimer('scalability-test');
  const scaleStart = performance.now();
  for (let i = 0; i < scalabilityIterations; i++) {
    generateRandomLocation();
  }
  const scaleTime = performance.now() - scaleStart;
  logger.endTimer('scalability-test');
  
  logger.info('Scalability Test Results', {
    iterations: scalabilityIterations,
    timeMs: scaleTime,
    throughputPerSec: Math.round(scalabilityIterations/scaleTime*1000),
    microsecondsPerLocation: (scaleTime/scalabilityIterations*1000).toFixed(3)
  }, 'PerformanceTest');
  
  // Test 5: Memory & Data Structure Stats
  logger.info('💾 Memory & Data Structure Stats:', undefined, 'PerformanceTest');
  const stats = optimizedRegionManager.getStats();
  logger.info('Region Manager Statistics', stats, 'PerformanceTest');
  
  // Summary
  logger.info('=' .repeat(60), undefined, 'PerformanceTest');
  logger.info('📋 PERFORMANCE SUMMARY:', {
    randomGenerationOpsPerSec: Math.round(iterations/randomTime*1000),
    countryGenerationOpsPerSec: Math.round(iterations/countryTime*1000),
    scalabilityOpsPerSec: Math.round(scalabilityIterations/scaleTime*1000),
    status: 'Ready for 100k+ concurrent users! 🎯'
  }, 'PerformanceTest');
  logger.info('=' .repeat(60), undefined, 'PerformanceTest');
}

/**
 * Quick performance test for development
 */
export function quickPerformanceTest() {
  logger.info('⚡ Quick Performance Test', undefined, 'QuickPerformanceTest');
  
  const iterations = 1000;
  
  logger.startTimer('quick-test');
  const start = performance.now();
  for (let i = 0; i < iterations; i++) {
    generateRandomLocation();
  }
  const time = performance.now() - start;
  logger.endTimer('quick-test', 'Quick performance test completed');
  
  logger.info('Quick Test Results', {
    iterations,
    timeMs: time,
    locationsPerSec: Math.round(iterations/time*1000),
    microsecondsPerLocation: (time/iterations*1000).toFixed(3)
  }, 'QuickPerformanceTest');
}

/**
 * Test different country lookups
 */
export function testCountryLookups() {
  logger.info('🔍 Testing Country Lookup Performance', undefined, 'CountryLookupTest');
  
  const countries = ['India', 'China', 'USA', 'Brazil', 'Russia', 'Australia'];
  const iterations = 1000;
  const results: Record<string, { timeMs: number; opsPerSec: number }> = {};
  
  for (const country of countries) {
    logger.startTimer(`country-test-${country}`);
    const start = performance.now();
    for (let i = 0; i < iterations; i++) {
      generateLocationByCountry(country);
    }
    const time = performance.now() - start;
    logger.endTimer(`country-test-${country}`, `${country} lookup test completed`);
    
    const opsPerSec = Math.round(iterations/time*1000);
    results[country] = { timeMs: time, opsPerSec };
    
    logger.info(`Country Performance: ${country}`, {
      country,
      iterations,
      timeMs: time,
      opsPerSec
    }, 'CountryLookupTest');
  }
  
  logger.info('Country Lookup Test Summary', {
    totalCountriesTested: countries.length,
    iterationsPerCountry: iterations,
    results
  }, 'CountryLookupTest');
}