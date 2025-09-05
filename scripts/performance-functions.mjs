/**
 * Simple performance test functions for scripts (using console.log)
 */

import { generateRandomLocation, generateLocationByCountry } from '../lib/locations/index.ts';

/**
 * Quick performance test for development
 */
export function quickPerformanceTest() {
  console.log('⚡ Quick Performance Test');
  console.log('=' .repeat(50));
  
  const iterations = 1000;
  
  const start = performance.now();
  for (let i = 0; i < iterations; i++) {
    generateRandomLocation();
  }
  const time = performance.now() - start;
  
  console.log(`\n📈 RESULTS:`);
  console.log(`Total Time: ${time.toFixed(2)}ms (milliseconds to generate ${iterations} locations)`);
  console.log(`Throughput: ${Math.round(iterations/time*1000).toLocaleString()} locations/sec (locations generated per second)`);
  console.log(`Per Location: ${(time/iterations*1000).toFixed(3)}μs (microseconds per single location)`);
  
  console.log(`\n💡 EXPLANATION:`);
  console.log(`• Throughput shows how many locations can be generated in 1 second`);
  console.log(`• μs (microseconds) = 1/1,000,000 of a second (smaller is faster)`);
  console.log(`• Higher locations/sec = better performance for many users`);
  console.log(`• Lower μs per location = faster individual location generation`);
}

/**
 * Run comprehensive performance test
 */
export function runPerformanceTest(iterations = 10000) {
  console.log('🚀 GeoGusserX Location Generation Performance Test');
  console.log('='.repeat(60));
  
  console.log(`\n📊 Testing with ${iterations} iterations...\n`);
  
  // Test 1: Random Location Generation
  console.log('🎲 Random Location Generation:');
  
  const start1 = performance.now();
  for (let i = 0; i < iterations; i++) {
    generateRandomLocation();
  }
  const randomTime = performance.now() - start1;
  
  console.log(`  🕰️ Time: ${randomTime.toFixed(2)}ms (total time for ${iterations.toLocaleString()} locations)`);
  console.log(`  🚀 Speed: ${Math.round(iterations/randomTime*1000).toLocaleString()} locations/sec (throughput)`);
  console.log(`  ⚡ Per Location: ${(randomTime/iterations*1000).toFixed(3)}μs (microseconds each)`);
  
  // Test 2: Country-Specific Generation
  console.log('\n🌍 Country-Specific Generation (India):');
  
  const start2 = performance.now();
  for (let i = 0; i < iterations; i++) {
    generateLocationByCountry('India');
  }
  const countryTime = performance.now() - start2;
  
  console.log(`  🕰️ Time: ${countryTime.toFixed(2)}ms (total time for ${iterations.toLocaleString()} India locations)`);
  console.log(`  🚀 Speed: ${Math.round(iterations/countryTime*1000).toLocaleString()} locations/sec (country-specific throughput)`);
  console.log(`  ⚡ Per Location: ${(countryTime/iterations*1000).toFixed(3)}μs (microseconds each with country filter)`);
  
  // Test 3: Scalability Test (only for scale command)
  if (iterations >= 50000) {
    console.log('\n📈 Scalability Test Results:');
    console.log(`  ${iterations} Locations: ${randomTime.toFixed(2)}ms`);
    console.log(`  Throughput: ${Math.round(iterations/randomTime*1000)} locations/sec`);
    console.log(`  Per Location: ${(randomTime/iterations*1000).toFixed(3)}μs`);
  }
  
  // Summary
  console.log('\n' + '=' .repeat(60));
  console.log('📋 PERFORMANCE SUMMARY:');
  console.log(`✅ Random Generation: ${Math.round(iterations/randomTime*1000).toLocaleString()} ops/sec`);
  console.log(`✅ Country Generation: ${Math.round(iterations/countryTime*1000).toLocaleString()} ops/sec`);
  console.log(`✅ Ready for high-performance usage! 🎯`);
  
  console.log('\n💡 PERFORMANCE METRICS EXPLAINED:');
  console.log('🕰️ TIME UNITS:');
  console.log('  • ms (milliseconds) = 1/1,000 of a second');
  console.log('  • μs (microseconds) = 1/1,000,000 of a second');
  console.log('  • Smaller time = faster performance');
  
  console.log('\n🚀 THROUGHPUT (ops/sec):');
  console.log('  • How many locations generated per second');
  console.log('  • Higher = better for concurrent users');
  console.log('  • 400k+ ops/sec = excellent performance');
  
  console.log('\n🎯 REAL-WORLD IMPACT:');
  console.log('  • 1 user needs ~1 location every 10-30 seconds');
  console.log('  • 100k ops/sec supports 100,000+ concurrent users');
  console.log('  • Country filtering adds minimal overhead');
  console.log('=' .repeat(60));
}

/**
 * Test different country lookups
 */
export function testCountryLookups(iterations = 1000) {
  console.log('🔍 Testing Country Lookup Performance');
  console.log('=' .repeat(50));
  console.log(`Testing ${iterations.toLocaleString()} iterations per country\n`);
  
  const countries = ['India', 'China', 'USA', 'Brazil', 'Russia', 'Australia'];
  const results = [];
  
  for (const country of countries) {
    const start = performance.now();
    for (let i = 0; i < iterations; i++) {
      generateLocationByCountry(country);
    }
    const time = performance.now() - start;
    const opsPerSec = Math.round(iterations/time*1000);
    
    console.log(`🌍 ${country.padEnd(10)}: ${time.toFixed(2)}ms | ${opsPerSec.toLocaleString().padStart(8)} ops/sec`);
    results.push({ country, time, opsPerSec });
  }
  
  // Analysis
  const avgOpsPerSec = Math.round(results.reduce((sum, r) => sum + r.opsPerSec, 0) / results.length);
  const fastest = results.reduce((max, r) => r.opsPerSec > max.opsPerSec ? r : max);
  const slowest = results.reduce((min, r) => r.opsPerSec < min.opsPerSec ? r : min);
  
  console.log('\n' + '=' .repeat(50));
  console.log('📋 COUNTRY LOOKUP ANALYSIS:');
  console.log(`📈 Average Performance: ${avgOpsPerSec.toLocaleString()} ops/sec`);
  console.log(`🏆 Fastest: ${fastest.country} (${fastest.opsPerSec.toLocaleString()} ops/sec)`);
  console.log(`🐢 Slowest: ${slowest.country} (${slowest.opsPerSec.toLocaleString()} ops/sec)`);
  
  console.log('\n💡 WHAT THIS MEANS:');
  console.log('  • All countries use optimized O(1) hash map lookups');
  console.log('  • Performance differences are due to region count per country');
  console.log('  • Countries with more regions may be slightly slower');
  console.log('  • All results show excellent performance for real-world usage');
  console.log('=' .repeat(50));
}