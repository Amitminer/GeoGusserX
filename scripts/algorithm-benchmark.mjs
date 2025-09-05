/**
 * Algorithm Benchmark Runner for Bun (fast JavaScript runtime)
 * Run: bun scripts/algorithm-benchmark.mjs
 */

// Import the performance test functions
import { runPerformanceTest, quickPerformanceTest, testCountryLookups } from '../lib/locations/performance-test.js';
import { logger } from '../lib/logger/index.js';

async function main() {
	const command = process.argv[2] || 'quick';

	logger.info('🧪 GeoGusserX Algorithm Benchmark Runner', { command }, 'AlgorithmBenchmark');

	try {
		switch (command) {
			case 'full':
				logger.info('Running full algorithm benchmark...', { iterations: 10000 }, 'AlgorithmBenchmark');
				runPerformanceTest(10000);
				break;

			case 'quick':
				logger.info('Running quick algorithm benchmark...', { iterations: 1000 }, 'AlgorithmBenchmark');
				quickPerformanceTest();
				break;

			case 'countries':
				logger.info('Running country lookup benchmark...', undefined, 'AlgorithmBenchmark');
				testCountryLookups();
				break;

			case 'scale':
				logger.info('Running scalability benchmark...', { iterations: 100000 }, 'AlgorithmBenchmark');
				runPerformanceTest(100000);
				break;

			default:
				logger.info('Available commands:', {
					commands: {
						quick: 'Quick benchmark (1k iterations)',
						full: 'Full benchmark (10k iterations)',
						countries: 'Country lookup benchmark',
						scale: 'Scalability benchmark (100k iterations)'
					},
					usage: 'bun scripts/algorithm-benchmark.mjs [command]'
				}, 'AlgorithmBenchmark');
				break;
		}
	} catch (error) {
		logger.error('Error running algorithm benchmark', { error: error.message }, 'AlgorithmBenchmark');
		logger.info('Make sure you have built the project first: npm run build', undefined, 'AlgorithmBenchmark');
	}
}

main();
