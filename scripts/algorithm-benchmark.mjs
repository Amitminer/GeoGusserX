/**
 * A benchmark runner for the application's core algorithms, designed to be executed with Bun,
 * a fast JavaScript runtime. This script allows developers to test the performance of
 * location generation and country lookup functions.
 */

import { runPerformanceTest, quickPerformanceTest, testCountryLookups } from './performance-functions.mjs';

/**
 * The main function that parses command-line arguments and executes the requested benchmark.
 * It supports different commands for various types of performance tests and allows for a custom
 * number of iterations.
 */
async function main() {
	const args = process.argv.slice(2);
	const command = args[0] || 'quick';
	
	let customIterations = null;
	const iterIndex = args.indexOf('--iter');
	if (iterIndex !== -1 && args[iterIndex + 1]) {
		customIterations = parseInt(args[iterIndex + 1]);
		if (isNaN(customIterations) || customIterations <= 0) {
			console.error('❌ Invalid iteration count. Must be a positive number.');
			return;
		}
	}

	console.log('🧪 GeoGusserX Algorithm Benchmark Runner');
	console.log(`Command: ${command}`);
	if (customIterations) {
		console.log(`Custom iterations: ${customIterations.toLocaleString()}`);
	}
	console.log();

	try {
		switch (command) {
			// Runs a comprehensive performance test with a high number of iterations.
			case 'full': {
				const iterations = customIterations || 10000;
				console.log(`Running full algorithm benchmark (${iterations.toLocaleString()} iterations)...`);
				runPerformanceTest(iterations);
				break;
			}

			// Runs a quick performance test with a smaller number of iterations.
			case 'quick': {
				const iterations = customIterations || 1000;
				console.log(`Running quick algorithm benchmark (${iterations.toLocaleString()} iterations)...`);
				if (customIterations) {
					runPerformanceTest(iterations);
				} else {
					quickPerformanceTest();
				}
				break;
			}

			// Specifically benchmarks the performance of country lookup functions.
			case 'countries': {
				const iterations = customIterations || 1000;
				console.log(`Running country lookup benchmark (${iterations.toLocaleString()} iterations per country)...`);
				testCountryLookups(iterations);
				break;
			}

			// Runs a scalability test with a very large number of iterations to check for performance degradation.
			case 'scale': {
				const iterations = customIterations || 100000;
				console.log(`Running scalability benchmark (${iterations.toLocaleString()} iterations)...`);
				runPerformanceTest(iterations);
				break;
			}

			// Displays help information if an unknown command is provided.
			default:
				console.log('Available commands:');
				console.log('  quick     - Quick benchmark (1k iterations)');
				console.log('  full      - Full benchmark (10k iterations)');
				console.log('  countries - Country lookup benchmark (1k per country)');
				console.log('  scale     - Scalability benchmark (100k iterations)');
				console.log('\nOptions:');
				console.log('  --iter <number>  - Custom iteration count');
				console.log('\nUsage:');
				console.log('  bun scripts/algorithm-benchmark.mjs [command]');
				console.log('  bun scripts/algorithm-benchmark.mjs quick --iter 5000');
				console.log('  bun scripts/algorithm-benchmark.mjs scale --iter 1000000');
				break;
		}
	} catch (error) {
		console.error('❌ Error running algorithm benchmark:', error.message);
		console.log('💡 Make sure you have built the project first: npm run build');
		console.error('Full error:', error);
	}
}

main();