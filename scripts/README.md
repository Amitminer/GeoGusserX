# Scripts Directory

**Developer utilities and tools for GeoGusserX development.**

## Algorithm Benchmarking

### Quick Commands
```bash
npm run test:algorithm          # Quick benchmark (1k iterations)
npm run test:algorithm:full     # Full benchmark (10k iterations)
npm run test:algorithm:countries # Country lookup tests
npm run test:algorithm:scale    # Scalability (100k iterations)
```

### Browser Region Lookup Tests
1. Import `scripts/region-lookup-test.ts` in a component
2. Console: `testLocationPerformance.quick()`

## Region Data Generation

### Python Region Generator
```bash
# Setup (one-time)
cd scripts
python -m venv .venv
source .venv/bin/activate  # Linux/Mac
# .venv\Scripts\activate   # Windows
pip install -r requirements.txt

# Generate new regions data
python generate_regions.py
```

**Purpose**: Generates `lib/locations/regions.json` with geographic region data for location generation algorithm.

## Files

| File | Purpose |
|------|----------|
| `algorithm-benchmark.mjs` | Bun algorithm benchmark runner (fast) |
| `region-lookup-test.ts` | Browser console region lookup tests |
| `generate_regions.py` | Python script to generate regions.json |
| `requirements.txt` | Python dependencies |

## Output

- **Benchmarks**: ops/sec, timing, memory usage
- **Logs**: Structured logging with file output
- **Regions**: Updated geographic data for algorithm

## Requirements

- **Bun**: Ultra-fast JavaScript runtime for algorithm benchmarks
  ```bash
  # Install Bun (if not already installed)
  curl -fsSL https://bun.sh/install | bash
  ```
- **Python 3.8+**: For region generation
- **Built project**: `npm run build` for module resolution
