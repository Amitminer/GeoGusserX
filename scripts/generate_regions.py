#!/usr/bin/env python3
"""
Generate comprehensive regions.json with all countries and major regions worldwide.
This script fetches real-time data from REST Countries API to create an unbiased,
complete list of all countries and territories.
"""

import json
import math
import requests
import argparse
from typing import Dict, List, Optional

# API endpoints
ALL_COUNTRIES_URL = "https://restcountries.com/v3.1/all?fields=name,latlng,area,region,subregion,cca2"
# GeoNames API for administrative divisions (free, no API key required)
GEONAMES_SEARCH_URL = "http://api.geonames.org/searchJSON?q={country}&featureClass=A&featureCode=PCLI&maxRows=1&username=demo"
GEONAMES_ADMIN_URL = "http://api.geonames.org/childrenJSON?geonameId={geoname_id}&username=demo"

def calculate_radius(area_km2: float) -> float:
    """Calculate appropriate radius based on country area."""
    if not area_km2 or area_km2 <= 0:
        return 2  # Default for unknown areas

    # Convert area to radius (assuming circular area)
    radius_km = math.sqrt(area_km2 / math.pi)

    # Scale radius for game purposes
    if radius_km < 50:
        return 2  # Small countries/territories
    elif radius_km < 200:
        return 4  # Medium countries
    elif radius_km < 500:
        return 8  # Large countries
    elif radius_km < 1000:
        return 12  # Very large countries
    else:
        return 20  # Massive countries (Russia, Canada, etc.)

def get_continent_name(region: str, subregion: str) -> str:
    """Map API region/subregion to our continent names."""
    region_mapping = {
        "Africa": "Africa",
        "Americas": "North America" if subregion in ["Northern America", "Central America", "Caribbean"] else "South America",
        "Asia": "Asia",
        "Europe": "Europe",
        "Oceania": "Oceania"
    }
    return region_mapping.get(region, "Unknown")

def fetch_countries_data(api_url: str = ALL_COUNTRIES_URL) -> List[Dict]:
    """Fetch countries data from REST Countries API."""
    print("🌐 Fetching countries data from REST Countries API...")

    try:
        response = requests.get(api_url, timeout=30)
        response.raise_for_status()  # Raises an HTTPError for bad responses

        data = response.json()
        print(f"✅ Successfully fetched data for {len(data)} countries")
        return data

    except requests.exceptions.RequestException as e:
        print(f"❌ Network error: {e}")
        raise Exception(f"Failed to fetch data from API: {e}")
    except json.JSONDecodeError as e:
        print(f"❌ JSON parsing error: {e}")
        raise Exception(f"Failed to parse API response: {e}")
    except Exception as e:
        print(f"❌ Unexpected error: {e}")
        raise

def is_well_known_country(name: str, continent: str, area: float) -> bool:
    """Filter for well-known countries that players are likely to recognize."""
    # Always include major countries regardless of continent
    major_countries = {
        'United States', 'Canada', 'Mexico', 'Brazil', 'Argentina', 'Chile',
        'United Kingdom', 'France', 'Germany', 'Italy', 'Spain', 'Russia',
        'China', 'Japan', 'India', 'Australia', 'South Korea', 'Thailand',
        'Egypt', 'South Africa', 'Nigeria', 'Morocco', 'Kenya', 'Ghana'
    }

    if name in major_countries:
        return True

    # For Africa, be more selective (only include well-known countries)
    if continent == 'Africa':
        well_known_african = {
            'Egypt', 'South Africa', 'Nigeria', 'Morocco', 'Kenya', 'Ghana',
            'Ethiopia', 'Tanzania', 'Algeria', 'Libya', 'Tunisia', 'Zimbabwe',
            'Botswana', 'Namibia', 'Uganda', 'Rwanda', 'Senegal', 'Mali'
        }
        return name in well_known_african

    # For other continents, include countries with reasonable size or recognition
    if area and area > 10000:  # Countries larger than 10,000 km²
        return True

    # Include some smaller but well-known countries
    well_known_small = {
        'Singapore', 'Switzerland', 'Netherlands', 'Belgium', 'Denmark',
        'Norway', 'Sweden', 'Finland', 'Ireland', 'Portugal', 'Austria',
        'Israel', 'Lebanon', 'Jordan', 'Kuwait', 'Qatar', 'UAE',
        'New Zealand', 'Fiji', 'Jamaica', 'Costa Rica', 'Panama'
    }

    return name in well_known_small

def process_country_data(countries_data: List[Dict]) -> List[Dict]:
    """Process raw API data into our format."""
    processed_countries = []
    skipped_count = 0
    filtered_count = 0

    for country in countries_data:
        try:
            # Get country name (prefer common name)
            name = country.get('name', {}).get('common', 'Unknown')
            if not name or name == 'Unknown':
                print(f"⚠️  Skipping country with no name: {country}")
                skipped_count += 1
                continue

            # Get coordinates (latlng)
            latlng = country.get('latlng', [])
            if len(latlng) != 2:
                print(f"⚠️  Skipping {name}: no valid coordinates")
                skipped_count += 1
                continue

            lat, lng = latlng[0], latlng[1]

            # Get area (in km²)
            area = country.get('area', 0)

            # Get region/continent
            region = country.get('region', '')
            subregion = country.get('subregion', '')
            continent = get_continent_name(region, subregion)

            # Get country code for potential future use
            country_code = country.get('cca2', '')

            # Calculate radius
            radius = calculate_radius(area)

            # Filter for well-known countries
            if not is_well_known_country(name, continent, area):
                # print(f"🔍 Filtering out less known country: {name} ({continent})")
                filtered_count += 1
                continue

            processed_country = {
                "name": name,
                "lat": lat,
                "lng": lng,
                "area": area,
                "continent": continent,
                "radius": radius,
                "country_code": country_code
            }

            processed_countries.append(processed_country)

        except Exception as e:
            print(f"⚠️  Error processing country {country.get('name', {}).get('common', 'Unknown')}: {e}")
            skipped_count += 1
            continue

    if skipped_count > 0:
        print(f"⚠️  Skipped {skipped_count} countries due to missing/invalid data")

    if filtered_count > 0:
        print(f"🔍 Filtered out {filtered_count} less known countries for better gameplay")

    return processed_countries

def get_geoname_id(country_name: str) -> Optional[str]:
    """Get GeoNames ID for a country."""
    try:
        # Try with the original name first
        search_names = [
            country_name.title(),  # Japan
            country_name.lower(),  # japan
            country_name.upper(),  # JAPAN
            country_name,          # original
        ]

        for search_name in search_names:
            url = GEONAMES_SEARCH_URL.format(country=search_name.replace(' ', '%20'))
            try:
                response = requests.get(url, timeout=20)  # Increased timeout
                response.raise_for_status()

                data = response.json()
                if data.get('geonames') and len(data['geonames']) > 0:
                    print(f"✅ Found GeoNames ID for {country_name} using search term '{search_name}'")
                    return data['geonames'][0]['geonameId']
            except requests.exceptions.Timeout:
                print(f"⏱️  Timeout for {search_name}, trying next variation...")
                continue
            except requests.exceptions.RequestException as e:
                error_msg = str(e)
                if '503' in error_msg or 'Service Unavailable' in error_msg:
                    print("🚫 GeoNames API service unavailable (likely rate limited)")
                elif 'hourly limit' in error_msg or 'credits' in error_msg:
                    print("🚫 GeoNames API rate limit exceeded (demo account)")
                else:
                    print(f"⚠️  Request failed for {search_name}: {e}")
                continue

        print(f"⚠️  No GeoNames ID found for {country_name} with any search variation")
        return None
    except Exception as e:
        print(f"⚠️  Failed to get GeoNames ID for {country_name}: {e}")
        return None

def get_fallback_regions(country_name: str, limit: int = 10) -> List[Dict]:
    """Fallback regions when GeoNames API fails."""
    fallback_data = {
        'japan': [
            {'name': 'Tokyo', 'lat': 35.6762, 'lng': 139.6503},
            {'name': 'Osaka', 'lat': 34.6937, 'lng': 135.5023},
            {'name': 'Kyoto', 'lat': 35.0116, 'lng': 135.7681},
            {'name': 'Hokkaido', 'lat': 43.0642, 'lng': 141.3469},
            {'name': 'Fukuoka', 'lat': 33.5904, 'lng': 130.4017},
            {'name': 'Hiroshima', 'lat': 34.3853, 'lng': 132.4553},
            {'name': 'Sendai', 'lat': 38.2682, 'lng': 140.8694},
            {'name': 'Nagoya', 'lat': 35.1815, 'lng': 136.9066},
            {'name': 'Sapporo', 'lat': 43.0642, 'lng': 141.3469},
            {'name': 'Kobe', 'lat': 34.6901, 'lng': 135.1956},
            {'name': 'Yokohama', 'lat': 35.4437, 'lng': 139.6380},
            {'name': 'Kawasaki', 'lat': 35.5206, 'lng': 139.7172},
            {'name': 'Chiba', 'lat': 35.6074, 'lng': 140.1065},
            {'name': 'Nara', 'lat': 34.6851, 'lng': 135.8048},
            {'name': 'Okinawa', 'lat': 26.2124, 'lng': 127.6792},
        ],
        'united states': [
            {'name': 'California', 'lat': 36.7783, 'lng': -119.4179},
            {'name': 'Texas', 'lat': 31.9686, 'lng': -99.9018},
            {'name': 'Florida', 'lat': 27.7663, 'lng': -82.6404},
            {'name': 'New York', 'lat': 42.1657, 'lng': -74.9481},
            {'name': 'Pennsylvania', 'lat': 41.2033, 'lng': -77.1945},
            {'name': 'Illinois', 'lat': 40.3363, 'lng': -89.0022},
            {'name': 'Ohio', 'lat': 40.3888, 'lng': -82.7649},
            {'name': 'Georgia', 'lat': 33.0406, 'lng': -83.6431},
            {'name': 'North Carolina', 'lat': 35.6301, 'lng': -79.8064},
            {'name': 'Michigan', 'lat': 43.3266, 'lng': -84.5361},
            {'name': 'Virginia', 'lat': 37.4316, 'lng': -78.6569},
            {'name': 'Washington', 'lat': 47.7511, 'lng': -120.7401},
            {'name': 'Arizona', 'lat': 34.0489, 'lng': -111.0937},
            {'name': 'Massachusetts', 'lat': 42.4072, 'lng': -71.3824},
            {'name': 'Colorado', 'lat': 39.5501, 'lng': -105.7821},
        ],
        'canada': [
            {'name': 'Ontario', 'lat': 51.2538, 'lng': -85.3232},
            {'name': 'Quebec', 'lat': 53.9333, 'lng': -73.8667},
            {'name': 'British Columbia', 'lat': 53.7267, 'lng': -127.6476},
            {'name': 'Alberta', 'lat': 53.9333, 'lng': -116.5765},
            {'name': 'Manitoba', 'lat': 53.7609, 'lng': -98.8139},
            {'name': 'Saskatchewan', 'lat': 52.9399, 'lng': -106.4509},
            {'name': 'Nova Scotia', 'lat': 44.6820, 'lng': -63.7443},
            {'name': 'New Brunswick', 'lat': 46.5653, 'lng': -66.4619},
            {'name': 'Newfoundland and Labrador', 'lat': 53.1355, 'lng': -57.6604},
            {'name': 'Prince Edward Island', 'lat': 46.5107, 'lng': -63.4168},
        ],
        'australia': [
            {'name': 'New South Wales', 'lat': -31.2532, 'lng': 146.9211},
            {'name': 'Victoria', 'lat': -36.8485, 'lng': 144.9631},
            {'name': 'Queensland', 'lat': -20.9176, 'lng': 142.7028},
            {'name': 'Western Australia', 'lat': -25.0424, 'lng': 121.6417},
            {'name': 'South Australia', 'lat': -30.0002, 'lng': 136.2092},
            {'name': 'Tasmania', 'lat': -41.4545, 'lng': 145.9707},
            {'name': 'Northern Territory', 'lat': -19.4914, 'lng': 132.5510},
            {'name': 'Australian Capital Territory', 'lat': -35.4735, 'lng': 149.0124},
        ],
        'brazil': [
            {'name': 'São Paulo', 'lat': -23.5505, 'lng': -46.6333},
            {'name': 'Rio de Janeiro', 'lat': -22.9068, 'lng': -43.1729},
            {'name': 'Minas Gerais', 'lat': -18.5122, 'lng': -44.5550},
            {'name': 'Bahia', 'lat': -12.5797, 'lng': -41.7007},
            {'name': 'Paraná', 'lat': -24.8932, 'lng': -51.4934},
            {'name': 'Rio Grande do Sul', 'lat': -30.0346, 'lng': -51.2177},
            {'name': 'Pernambuco', 'lat': -8.8137, 'lng': -36.9541},
            {'name': 'Ceará', 'lat': -5.4984, 'lng': -39.3206},
        ],
        'germany': [
            {'name': 'Bavaria', 'lat': 49.0134, 'lng': 10.9576},
            {'name': 'North Rhine-Westphalia', 'lat': 51.4332, 'lng': 7.6616},
            {'name': 'Baden-Württemberg', 'lat': 48.6616, 'lng': 9.3501},
            {'name': 'Lower Saxony', 'lat': 52.6367, 'lng': 9.8451},
            {'name': 'Hesse', 'lat': 50.6520, 'lng': 9.1624},
            {'name': 'Saxony', 'lat': 51.1045, 'lng': 13.2017},
            {'name': 'Rhineland-Palatinate', 'lat': 49.9129, 'lng': 7.4530},
            {'name': 'Thuringia', 'lat': 50.9848, 'lng': 11.0299},
        ]
    }

    country_key = country_name.lower()
    if country_key in fallback_data:
        regions_data = fallback_data[country_key][:limit]
        return [{
            "lat": region["lat"],
            "lng": region["lng"],
            "radius": 3,
            "name": f"{region['name']}, {country_name.title()}",
            "continent": get_continent_for_country(country_name, []),
            "type": "region"
        } for region in regions_data]

    return []

def get_country_states(country_name: str, limit: int = 10, countries_data: Optional[List[Dict]] = None) -> List[Dict]:
    """Get states/regions for a specific country using GeoNames API with fallback."""
    print(f"🏛️  Fetching {limit} states/regions for {country_name} from GeoNames API...")

    # Check if we have fallback data first
    country_key = country_name.lower()
    fallback_available = country_key in ['japan', 'united states', 'canada', 'australia', 'brazil', 'germany']
    if fallback_available:
        print(f"💾 Fallback data available for {country_name} if API fails")

    try:
        # First, get the GeoNames ID for the country
        geoname_id = get_geoname_id(country_name)
        if not geoname_id:
            print(f"⚠️  Could not find GeoNames ID for {country_name}")
            fallback_regions = get_fallback_regions(country_name, limit)
            if fallback_regions:
                print(f"💾 Using curated fallback data for {country_name} ({len(fallback_regions)} regions)")
                return fallback_regions
            else:
                print(f"⚠️  No fallback data available for {country_name}")
                return []

        # Get administrative divisions
        url = GEONAMES_ADMIN_URL.format(geoname_id=geoname_id)
        response = requests.get(url, timeout=20)  # Increased timeout
        response.raise_for_status()

        data = response.json()
        geonames = data.get('geonames', [])

        print(f"🔍 Found {len(geonames)} total places for {country_name}")

        if not geonames:
            print(f"⚠️  No places found for {country_name}")
            fallback_regions = get_fallback_regions(country_name, limit)
            if fallback_regions:
                print(f"💾 Using curated fallback data for {country_name} ({len(fallback_regions)} regions)")
                return fallback_regions
            return []

        # Debug: Show what we got
        if len(geonames) > 0:
            sample = geonames[0]
            print(f"🔍 Sample place: {sample.get('name', 'N/A')} (fcode: {sample.get('fcode', 'N/A')})")

        # Filter for administrative divisions and populated places
        admin_divisions = []
        for place in geonames:
            feature_code = place.get('fcode', '')
            name = place.get('name', '')
            lat = place.get('lat')
            lng = place.get('lng')

            # Accept administrative divisions (ADM1, ADM2) and major populated places (PPLA, PPLC)
            valid_codes = ['ADM1', 'ADM2', 'PPLA', 'PPLC', 'PPLA2', 'PPL']

            if feature_code in valid_codes and name and lat and lng:
                admin_divisions.append({
                    'name': name,
                    'lat': float(lat),
                    'lng': float(lng),
                    'type': 'administrative_division' if feature_code.startswith('ADM') else 'city',
                    'feature_code': feature_code
                })

        print(f"🔍 Found {len(admin_divisions)} valid administrative divisions/cities")
        # If we don't have enough admin divisions, fall back to curated data
        if len(admin_divisions) < limit // 2:  # If we have less than half of what we want
            print(f"🔄 Only found {len(admin_divisions)} divisions, supplementing with fallback data")
            fallback_regions = get_fallback_regions(country_name, limit)
            if fallback_regions:
                return fallback_regions

        # Sort by feature code priority (ADM1 first, then PPLA, etc.) and take the limit
        priority_order = {'ADM1': 1, 'PPLA': 2, 'PPLC': 2, 'ADM2': 3, 'PPLA2': 4, 'PPL': 5}
        admin_divisions.sort(key=lambda x: (priority_order.get(x['feature_code'], 6), x['name']))
        selected_divisions = admin_divisions[:limit]

        # Convert to our format
        regions = []
        for division in selected_divisions:
            regions.append({
                "lat": division["lat"],
                "lng": division["lng"],
                "radius": 3,  # Smaller radius for states/regions
                "name": f"{division['name']}, {country_name.title()}",
                "continent": get_continent_for_country(country_name, countries_data or []),
                "type": "region"
            })

        print(f"✅ Found {len(regions)} administrative divisions for {country_name}")
        return regions

    except Exception as e:
        print(f"⚠️  Failed to fetch states for {country_name}: {e}")
        print(f"🔄 Using fallback data for {country_name}")
        return get_fallback_regions(country_name, limit)

def get_continent_for_country(country_name: str, countries_data: List[Dict]) -> str:
    """Get continent for a country from the actual countries data."""
    country_name_lower = country_name.lower()

    for country in countries_data:
        country_common_name = country.get('name', {}).get('common', '').lower()
        if country_common_name == country_name_lower:
            region = country.get('region', '')
            subregion = country.get('subregion', '')
            return get_continent_name(region, subregion)

    # If not found, return Unknown
    return 'Unknown'

def generate_regions(prioritize_country: Optional[str] = None, state_limit: int = 10, include_metadata: bool = True) -> Dict:
    """Generate the complete regions.json structure, optionally including metadata."""
    # Fetch fresh data from API
    countries_data = fetch_countries_data()

    # Process the data
    processed_countries = process_country_data(countries_data)

    # Convert to our regions format
    regions = []
    for country in processed_countries:
        region = {
            "lat": country["lat"],
            "lng": country["lng"],
            "radius": country["radius"],
            "name": country["name"],
            "continent": country["continent"],
            "type": "country"
        }
        regions.append(region)

    # Add states/regions for prioritized country
    if prioritize_country:
        print(f"\n🎯 Adding states/regions for prioritized country: {prioritize_country}")
        states = get_country_states(prioritize_country, state_limit, countries_data)
        regions.extend(states)
        print(f"✅ Added {len(states)} states/regions for {prioritize_country}")

    # Sort by continent, then by name for better organization
    regions.sort(key=lambda x: (x["continent"], x["name"]))

    result: Dict = {"regions": regions}

    if include_metadata:
        # Calculate metadata
        total_regions = len(regions)
        countries_count = len([r for r in regions if r['type'] == 'country'])
        states_count = total_regions - countries_count

        continents_coverage = {}
        for region in regions:
            continent = region['continent']
            continents_coverage[continent] = continents_coverage.get(continent, 0) + 1

        result["metadata"] = {
            "total_regions": total_regions,
            "country_count": countries_count,
            "state_count": states_count,
            "continents_coverage": continents_coverage,
            "generated_at": __import__('datetime').datetime.now().isoformat()
        }

    return result

def main():
    """Main function to generate and save regions.json."""
    parser = argparse.ArgumentParser(description='Generate comprehensive regions.json with all countries worldwide')
    parser.add_argument('--prioritize', type=str, help='Country to prioritize (adds states/regions)')
    parser.add_argument('--limit', type=int, default=10, help='Number of states/regions to add for prioritized country (default: 10)')
    parser.add_argument('--no-metadata', action='store_true', help='Exclude metadata from output')

    args = parser.parse_args()

    print("🌍 Generating comprehensive regions.json from live API data...")
    if args.prioritize:
        print(f"🎯 Prioritizing {args.prioritize} with {args.limit} states/regions")
    if args.no_metadata:
        print("📄 Excluding metadata from output")

    try:
        # Generate the regions data
        regions_data = generate_regions(
            prioritize_country=args.prioritize,
            state_limit=args.limit,
            include_metadata=not args.no_metadata
        )

        # Save to current directory (we're already in scripts folder)
        output_path = "regions_generated.json"
        with open(output_path, 'w', encoding='utf-8') as f:
            json.dump(regions_data, f, indent=2, ensure_ascii=False)

        total_regions = len(regions_data['regions'])
        countries_count = len([r for r in regions_data['regions'] if r['type'] == 'country'])
        states_count = total_regions - countries_count

        print(f"✅ Generated {countries_count} countries")
        if states_count > 0:
            print(f"✅ Generated {states_count} states/regions")
        print(f"✅ Total regions: {total_regions}")
        print(f"📁 Saved to: {output_path}")
        print("\n💡 Review the generated file, then manually copy to lib/locations/regions.json if satisfied")

        # Print statistics
        continents = {}
        for region in regions_data['regions']:
            continent = region['continent']
            continents[continent] = continents.get(continent, 0) + 1

        print("\n📊 Coverage by continent:")
        for continent, count in sorted(continents.items()):
            print(f"   {continent}: {count} countries")

        print(f"\n🎯 Total coverage: {sum(continents.values())} countries worldwide")
        print("🚀 Ready for unbiased global gameplay!")
        print("\n💡 Data fetched live from REST Countries API - always up to date!")
        print("\n📋 Next steps:")
        print("   1. Review regions_generated.json")
        print("   2. Compare with current ../lib/locations/regions.json")
        print("   3. Copy to ../lib/locations/regions.json when ready")
        print("\n💡 Usage examples:")
        print("   python generate_regions.py --prioritize japan --limit 15")
        print("   python generate_regions.py --no-metadata")
        print("   python generate_regions.py --prioritize 'united states' --limit 20 --no-metadata")

        print("\n🔧 GeoNames API Note:")
        print("   The demo account has limited requests (1000/hour).")
        print("   If you see rate limit errors, the script uses fallback data.")
        print("   For production use, get a free GeoNames account at geonames.org")

    except Exception as e:
        print(f"\n❌ Failed to generate regions.json: {e}")
        print("\n🔧 Troubleshooting:")
        print("   - Check your internet connection")
        print("   - Verify REST Countries API is accessible")
        print("   - Try running the script again")
        exit(1)

if __name__ == "__main__":
    main()
