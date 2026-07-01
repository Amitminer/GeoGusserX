import { generateRandomLocation, generateLocationByCountry } from '../lib/locations/index.ts';

function printHelp() {
  console.log(`
GeoGusserX Algorithm Benchmark Tool

Usage:
  bun scripts/algorithm-benchmark.mjs [options]

Options:
  --iter <number>    Number of iterations to run (default: 10000)
  --type <type>      Type of benchmark to run: 'random', 'country', 'all' (default: 'all')
  --help, -h         Show this help message
`);
}

function runRandomBenchmark(iterations) {
  const start = performance.now();
  for (let i = 0; i < iterations; i++) {
    generateRandomLocation();
  }
  const duration = performance.now() - start;
  const opsPerSec = Math.round((iterations / duration) * 1000);
  const avgDuration = (duration / iterations) * 1000;

  return { duration, opsPerSec, avgDuration };
}

function runCountryBenchmark(iterations, country = 'India') {
  const start = performance.now();
  for (let i = 0; i < iterations; i++) {
    generateLocationByCountry(country);
  }
  const duration = performance.now() - start;
  const opsPerSec = Math.round((iterations / duration) * 1000);
  const avgDuration = (duration / iterations) * 1000;

  return { duration, opsPerSec, avgDuration };
}

function runAllCountryComparison(iterations) {
  const countries = ['India', 'China', 'United States', 'Brazil', 'Russia', 'Australia'];
  const results = [];

  for (const country of countries) {
    const res = runCountryBenchmark(iterations, country);
    results.push({ country, ...res });
  }

  return results;
}

async function main() {
  const args = process.argv.slice(2);
  let iterations = 10000;
  let benchmarkType = 'all';

  if (args.includes('--help') || args.includes('-h')) {
    printHelp();
    return;
  }

  const iterIndex = args.indexOf('--iter');
  if (iterIndex !== -1 && args[iterIndex + 1]) {
    const val = parseInt(args[iterIndex + 1], 10);
    if (!isNaN(val) && val > 0) {
      iterations = val;
    } else {
      console.error('Error: --iter must be a positive integer.');
      process.exit(1);
    }
  }

  const typeIndex = args.indexOf('--type');
  if (typeIndex !== -1 && args[typeIndex + 1]) {
    const val = args[typeIndex + 1].toLowerCase();
    if (['random', 'country', 'all'].includes(val)) {
      benchmarkType = val;
    } else {
      console.error("Error: --type must be one of 'random', 'country', or 'all'.");
      process.exit(1);
    }
  }

  console.log('==================================================');
  console.log('          GeoGusserX Algorithm Benchmark          ');
  console.log('==================================================');
  console.log(`Iterations: ${iterations.toLocaleString()}`);
  console.log(`Type:       ${benchmarkType}`);
  console.log('--------------------------------------------------');

  const memoryStart = process.memoryUsage().heapUsed;

  if (benchmarkType === 'random' || benchmarkType === 'all') {
    console.log('Running random location generation benchmark...');
    const result = runRandomBenchmark(iterations);
    console.log(`  Duration:    ${result.duration.toFixed(2)} ms`);
    console.log(`  Throughput:  ${result.opsPerSec.toLocaleString()} locations/sec`);
    console.log(`  Average:     ${result.avgDuration.toFixed(3)} μs/location`);
    console.log('--------------------------------------------------');
  }

  if (benchmarkType === 'country' || benchmarkType === 'all') {
    console.log('Running country lookup & generation benchmark (India)...');
    const result = runCountryBenchmark(iterations, 'India');
    console.log(`  Duration:    ${result.duration.toFixed(2)} ms`);
    console.log(`  Throughput:  ${result.opsPerSec.toLocaleString()} locations/sec`);
    console.log(`  Average:     ${result.avgDuration.toFixed(3)} μs/location`);
    console.log('--------------------------------------------------');

    if (benchmarkType === 'all') {
      console.log('Running comparison across major countries...');
      const countryResults = runAllCountryComparison(Math.min(iterations, 2000));
      for (const res of countryResults) {
        console.log(`  - ${res.country.padEnd(15)}: ${res.opsPerSec.toLocaleString().padStart(9)} locations/sec (${res.avgDuration.toFixed(3)} μs/loc)`);
      }
      console.log('--------------------------------------------------');
    }
  }

  const memoryEnd = process.memoryUsage().heapUsed;
  const memoryDiff = (memoryEnd - memoryStart) / (1024 * 1024);
  console.log(`Memory footprint: +${memoryDiff.toFixed(2)} MB heap used`);
  console.log('==================================================');
}

main().catch((err) => {
  console.error('Benchmark execution failed:', err);
  process.exit(1);
});