# GeoGusserX Developer Scripts

This directory contains utilities for benchmarking the location algorithm and generating geographic regions.

## 🧪 Algorithm Benchmarking

We use a consolidated benchmark script designed for execution with the **Bun** runtime.

### Running Benchmarks

```bash
# Run standard benchmark suite (random + country)
bun scripts/algorithm-benchmark.mjs

# Custom iterations (e.g., 50,000)
bun scripts/algorithm-benchmark.mjs --iter 50000

# Benchmark a specific generator type ('random', 'country', 'all')
bun scripts/algorithm-benchmark.mjs --type random

# Show help
bun scripts/algorithm-benchmark.mjs --help
```

---

## 🗺️ Region Data Generation

Scripts used to generate and update the geographic region database (`lib/locations/regions.json`).

### Requirements
- Python 3.8+
- Dependencies listed in `requirements.txt`

### Usage
```bash
cd scripts
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt

# Fetch fresh country boundaries & metadata
python generate_regions.py

# Inject urban grid coordinate points and landmarks
python generate-hybrid-regions.py
```
