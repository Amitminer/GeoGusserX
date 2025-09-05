# Scripts Directory

This directory contains utility scripts for various development and maintenance tasks.

## Setup
```bash
cd scripts
uv venv
source .venv/bin/activate
uv pip install -r requirements.txt
```

## Scripts
- `generate_regions.py` - Generates regions_generated.json with all countries worldwide

## Usage
```bash
uv run generate_regions.py --help
```
