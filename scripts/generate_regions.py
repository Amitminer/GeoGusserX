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
import time
import sys
from datetime import datetime
from typing import Dict, List, Optional, Set
from urllib.parse import quote

# API endpoints
ALL_COUNTRIES_URL = "https://restcountries.com/v3.1/all?fields=name,latlng,area,region,subregion,cca2"
# GeoNames API for administrative divisions (free, no API key required)
GEONAMES_SEARCH_URL = "http://api.geonames.org/searchJSON"
GEONAMES_ADMIN_URL = "http://api.geonames.org/childrenJSON"

# Constants
MAX_RETRIES = 3
RETRY_DELAY = 2  # seconds
REQUEST_TIMEOUT = 30
RATE_LIMIT_DELAY = 1  # seconds between GeoNames API calls


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
    if not region:
        return "Unknown"

    region_mapping = {
        "Africa": "Africa",
        "Americas": "North America" if subregion in ["Northern America", "Central America", "Caribbean"] else "South America",
        "Asia": "Asia",
        "Europe": "Europe",
        "Oceania": "Oceania"
    }
    return region_mapping.get(region, "Unknown")


def make_request_with_retry(url: str, max_retries: int = MAX_RETRIES, timeout: int = REQUEST_TIMEOUT) -> Optional[requests.Response]:
    """Make HTTP request with retry logic."""
    for attempt in range(max_retries):
        try:
            response = requests.get(url, timeout=timeout)
            response.raise_for_status()
            return response
        except requests.exceptions.Timeout:
            print(f"⏱️  Timeout on attempt {attempt + 1}/{max_retries}")
            if attempt < max_retries - 1:
                time.sleep(RETRY_DELAY * (attempt + 1))  # Exponential backoff
        except requests.exceptions.RequestException as e:
            if attempt < max_retries - 1:
                print(f"⚠️  Request failed on attempt {attempt + 1}/{max_retries}: {e}")
                time.sleep(RETRY_DELAY * (attempt + 1))
            else:
                print(f"❌ All retry attempts failed: {e}")
                return None
    return None


def fetch_countries_data(api_url: str = ALL_COUNTRIES_URL) -> List[Dict]:
    """Fetch countries data from REST Countries API."""
    print("🌐 Fetching countries data from REST Countries API...")

    response = make_request_with_retry(api_url)
    if not response:
        raise Exception("Failed to fetch data from REST Countries API after all retries")

    try:
        data = response.json()
        if not isinstance(data, list):
            raise ValueError("Expected list of countries from API")

        print(f"✅ Successfully fetched data for {len(data)} countries")
        return data
    except json.JSONDecodeError as e:
        raise Exception(f"Failed to parse API response as JSON: {e}")


def is_well_known_country(name: str, continent: str, area: float) -> bool:
    """Filter for well-known countries that players are likely to recognize."""
    if not name:
        return False

    # Always include major countries regardless of continent
    major_countries: Set[str] = {
        'United States', 'Canada', 'Mexico', 'Brazil', 'Argentina', 'Chile',
        'United Kingdom', 'France', 'Germany', 'Italy', 'Spain', 'Russia',
        'China', 'Japan', 'India', 'Australia', 'South Korea', 'Thailand',
        'Egypt', 'South Africa', 'Nigeria', 'Morocco', 'Kenya', 'Ghana'
    }

    if name in major_countries:
        return True

    # For Africa, be more selective (only include well-known countries)
    if continent == 'Africa':
        well_known_african: Set[str] = {
            'Egypt', 'South Africa', 'Nigeria', 'Morocco', 'Kenya', 'Ghana',
            'Ethiopia', 'Tanzania', 'Algeria', 'Libya', 'Tunisia', 'Zimbabwe',
            'Botswana', 'Namibia', 'Uganda', 'Rwanda', 'Senegal', 'Mali'
        }
        return name in well_known_african

    # For other continents, include countries with reasonable size or recognition
    if area and area > 10000:  # Countries larger than 10,000 km²
        return True

    # Include some smaller but well-known countries
    well_known_small: Set[str] = {
        'Singapore', 'Switzerland', 'Netherlands', 'Belgium', 'Denmark',
        'Norway', 'Sweden', 'Finland', 'Ireland', 'Portugal', 'Austria',
        'Israel', 'Lebanon', 'Jordan', 'Kuwait', 'Qatar', 'UAE',
        'New Zealand', 'Fiji', 'Jamaica', 'Costa Rica', 'Panama'
    }

    return name in well_known_small


def validate_coordinates(lat: float, lng: float) -> bool:
    """Validate latitude and longitude values."""
    return (
        isinstance(lat, (int, float)) and
        isinstance(lng, (int, float)) and
        -90 <= lat <= 90 and
        -180 <= lng <= 180
    )


def validate_country_structure(country: Dict) -> bool:
    """Validate basic country data structure."""
    return isinstance(country, dict)


def extract_country_name(country: Dict) -> Optional[str]:
    """Extract and validate country name from API data."""
    name_data = country.get('name')
    if not isinstance(name_data, dict):
        return None

    name = name_data.get('common', '').strip()
    return name if name else None


def extract_coordinates(country: Dict) -> Optional[tuple]:
    """Extract and validate coordinates from country data."""
    latlng = country.get('latlng', [])
    if not isinstance(latlng, list) or len(latlng) != 2:
        return None

    try:
        lat, lng = float(latlng[0]), float(latlng[1])
        if validate_coordinates(lat, lng):
            return (lat, lng)
    except (ValueError, TypeError):
        pass

    return None


def extract_area(country: Dict) -> float:
    """Extract and validate area from country data."""
    area = country.get('area')
    if area is not None:
        try:
            area = float(area)
            return max(0, area)  # Ensure non-negative
        except (ValueError, TypeError):
            pass
    return 0


def process_single_country(country: Dict) -> Optional[Dict]:
    """Process a single country's data."""
    if not validate_country_structure(country):
        return None

    name = extract_country_name(country)
    if not name:
        return None

    coordinates = extract_coordinates(country)
    if not coordinates:
        return None

    lat, lng = coordinates
    area = extract_area(country)

    # Get region/continent
    region = country.get('region', '').strip()
    subregion = country.get('subregion', '').strip()
    continent = get_continent_name(region, subregion)

    # Get country code
    country_code = country.get('cca2', '').strip()

    # Calculate radius
    radius = calculate_radius(area)

    # Filter for well-known countries
    if not is_well_known_country(name, continent, area):
        return None

    return {
        "name": name,
        "lat": lat,
        "lng": lng,
        "area": area,
        "continent": continent,
        "radius": radius,
        "country_code": country_code
    }


def process_country_data(countries_data: List[Dict]) -> List[Dict]:
    """Process raw API data into our format."""
    if not countries_data:
        raise ValueError("No countries data provided")

    processed_countries = []
    skipped_count = 0
    filtered_count = 0

    for country in countries_data:
        try:
            processed_country = process_single_country(country)
            if processed_country:
                processed_countries.append(processed_country)
            else:
                # Check if it was filtered or skipped
                name = extract_country_name(country) if validate_country_structure(country) else None
                if name and extract_coordinates(country):
                    filtered_count += 1  # Valid country but filtered
                else:
                    skipped_count += 1   # Invalid data

        except Exception as e:
            country_name = "Unknown"
            try:
                country_name = country.get('name', {}).get('common', 'Unknown')
            except:
                pass
            print(f"⚠️  Error processing country {country_name}: {e}")
            skipped_count += 1
            continue

    if skipped_count > 0:
        print(f"⚠️  Skipped {skipped_count} countries due to missing/invalid data")

    if filtered_count > 0:
        print(f"🔍 Filtered out {filtered_count} less known countries for better gameplay")

    if not processed_countries:
        raise ValueError("No valid countries were processed")

    return processed_countries


def get_geoname_id(country_name: str) -> Optional[str]:
    """Get GeoNames ID for a country."""
    if not country_name or not country_name.strip():
        return None

    try:
        # Try with different name variations
        search_names = [
            country_name.strip(),
            country_name.strip().title(),
            country_name.strip().lower(),
            country_name.strip().upper(),
        ]

        for search_name in search_names:
            params = {
                'q': search_name,
                'featureClass': 'A',
                'featureCode': 'PCLI',
                'maxRows': '1',
                'username': 'demo'
            }

            # Construct URL with proper encoding
            url = GEONAMES_SEARCH_URL + '?' + '&'.join([f"{k}={quote(str(v))}" for k, v in params.items()])

            time.sleep(RATE_LIMIT_DELAY)  # Rate limiting
            response = make_request_with_retry(url, timeout=20)

            if not response:
                continue

            try:
                data = response.json()
                geonames_list = data.get('geonames', [])
                if isinstance(geonames_list, list) and len(geonames_list) > 0:
                    geoname_id = geonames_list[0].get('geonameId')
                    if geoname_id:
                        print(f"✅ Found GeoNames ID for {country_name} using search term '{search_name}'")
                        return str(geoname_id)
            except json.JSONDecodeError:
                print(f"⚠️  Invalid JSON response for {search_name}")
                continue

        print(f"⚠️  No GeoNames ID found for {country_name} with any search variation")
        return None
    except Exception as e:
        print(f"⚠️  Failed to get GeoNames ID for {country_name}: {e}")
        return None


def get_fallback_regions(country_name: str, limit: int = 10) -> List[Dict]:
    """Fallback regions when GeoNames API fails."""
    if not country_name or limit <= 0:
        return []

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

    country_key = country_name.lower().strip()
    if country_key in fallback_data:
        regions_data = fallback_data[country_key][:limit]
        continent = get_continent_for_country(country_name, [])

        result = []
        for region in regions_data:
            if not validate_coordinates(region["lat"], region["lng"]):
                print(f"⚠️  Skipping region with invalid coordinates: {region['name']}")
                continue

            result.append({
                "lat": region["lat"],
                "lng": region["lng"],
                "radius": 3,
                "name": f"{region['name']}, {country_name.title()}",
                "continent": continent,
                "type": "region"
            })
        return result

    return []


def fetch_geonames_data(geoname_id: str) -> Optional[List[Dict]]:
    """Fetch administrative divisions from GeoNames API."""
    params = {
        'geonameId': geoname_id,
        'username': 'demo'
    }
    url = GEONAMES_ADMIN_URL + '?' + '&'.join([f"{k}={quote(str(v))}" for k, v in params.items()])

    time.sleep(RATE_LIMIT_DELAY)  # Rate limiting
    response = make_request_with_retry(url, timeout=20)

    if not response:
        return None

    try:
        data = response.json()
        geonames = data.get('geonames', [])
        return geonames if isinstance(geonames, list) else None
    except json.JSONDecodeError:
        return None


def filter_administrative_divisions(geonames: List[Dict]) -> List[Dict]:
    """Filter and validate administrative divisions from GeoNames data."""
    admin_divisions = []
    valid_codes = {'ADM1', 'ADM2', 'PPLA', 'PPLC', 'PPLA2', 'PPL'}

    for place in geonames:
        if not isinstance(place, dict):
            continue

        feature_code = place.get('fcode', '')
        name = place.get('name', '').strip()
        lat = place.get('lat')
        lng = place.get('lng')

        if not (feature_code in valid_codes and name and lat is not None and lng is not None):
            continue

        try:
            lat_float = float(lat)
            lng_float = float(lng)

            if not validate_coordinates(lat_float, lng_float):
                continue

            admin_divisions.append({
                'name': name,
                'lat': lat_float,
                'lng': lng_float,
                'type': 'administrative_division' if feature_code.startswith('ADM') else 'city',
                'feature_code': feature_code
            })
        except (ValueError, TypeError):
            continue

    return admin_divisions


def convert_divisions_to_regions(divisions: List[Dict], country_name: str, countries_data: Optional[List[Dict]]) -> List[Dict]:
    """Convert administrative divisions to our region format."""
    regions = []
    continent = get_continent_for_country(country_name, countries_data or [])

    for division in divisions:
        regions.append({
            "lat": division["lat"],
            "lng": division["lng"],
            "radius": 3,  # Smaller radius for states/regions
            "name": f"{division['name']}, {country_name.title()}",
            "continent": continent,
            "type": "region"
        })

    return regions


def get_country_states(country_name: str, limit: int = 10, countries_data: Optional[List[Dict]] = None) -> List[Dict]:
    """Get states/regions for a specific country using GeoNames API with fallback."""
    if not country_name or not country_name.strip() or limit <= 0:
        return []

    country_name = country_name.strip()
    print(f"🏦  Fetching {limit} states/regions for {country_name} from GeoNames API...")

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
            return get_fallback_regions(country_name, limit)

        # Get administrative divisions from API
        geonames = fetch_geonames_data(geoname_id)
        if not geonames:
            print(f"⚠️  Failed to get administrative divisions for {country_name}")
            return get_fallback_regions(country_name, limit)

        print(f"🔍 Found {len(geonames)} total places for {country_name}")

        if not geonames:
            print(f"⚠️  No places found for {country_name}")
            return get_fallback_regions(country_name, limit)

        # Debug: Show what we got
        if geonames:
            sample = geonames[0]
            print(f"🔍 Sample place: {sample.get('name', 'N/A')} (fcode: {sample.get('fcode', 'N/A')})")

        # Filter for administrative divisions and populated places
        admin_divisions = filter_administrative_divisions(geonames)
        print(f"🔍 Found {len(admin_divisions)} valid administrative divisions/cities")

        # If we don't have enough admin divisions, fall back to curated data
        if len(admin_divisions) < limit // 2:  # If we have less than half of what we want
            print(f"🔄 Only found {len(admin_divisions)} divisions, supplementing with fallback data")
            return get_fallback_regions(country_name, limit)

        # Sort by feature code priority (ADM1 first, then PPLA, etc.) and take the limit
        priority_order = {'ADM1': 1, 'PPLA': 2, 'PPLC': 2, 'ADM2': 3, 'PPLA2': 4, 'PPL': 5}
        admin_divisions.sort(key=lambda x: (priority_order.get(x['feature_code'], 6), x['name']))
        selected_divisions = admin_divisions[:limit]

        # Convert to our format
        regions = convert_divisions_to_regions(selected_divisions, country_name, countries_data)
        print(f"✅ Found {len(regions)} administrative divisions for {country_name}")
        return regions

    except Exception as e:
        print(f"⚠️  Failed to fetch states for {country_name}: {e}")
        print(f"🔄 Using fallback data for {country_name}")
        return get_fallback_regions(country_name, limit)


def get_continent_for_country(country_name: str, countries_data: List[Dict]) -> str:
    """Get continent for a country from the actual countries data."""
    if not country_name or not isinstance(countries_data, list):
        return 'Unknown'

    country_name_lower = country_name.lower().strip()

    for country in countries_data:
        if not isinstance(country, dict):
            continue

        name_data = country.get('name')
        if not isinstance(name_data, dict):
            continue

        country_common_name = name_data.get('common', '').lower().strip()
        if country_common_name == country_name_lower:
            region = country.get('region', '').strip()
            subregion = country.get('subregion', '').strip()
            return get_continent_name(region, subregion)

    # Fallback continent mapping
    continent_fallbacks = {
        'japan': 'Asia',
        'united states': 'North America',
        'canada': 'North America',
        'australia': 'Oceania',
        'brazil': 'South America',
        'germany': 'Europe'
    }

    return continent_fallbacks.get(country_name_lower, 'Unknown')


def validate_region_data(regions: List[Dict]) -> List[Dict]:
    """Validate and clean region data."""

    valid_regions = []
    for region in regions:
        if not isinstance(region, dict):
            continue

        # Required fields
        required_fields = ['lat', 'lng', 'name', 'continent', 'type']
        if not all(field in region for field in required_fields):
            continue

        # Validate data types and values
        try:
            lat = float(region['lat'])
            lng = float(region['lng'])
            name = str(region['name']).strip()
            continent = str(region['continent']).strip()
            region_type = str(region['type']).strip()
            radius = float(region.get('radius', 3))

            if not validate_coordinates(lat, lng) or not name or not continent or not region_type:
                continue

            valid_region = {
                'lat': lat,
                'lng': lng,
                'name': name,
                'continent': continent,
                'type': region_type,
                'radius': max(1, radius)  # Ensure minimum radius
            }

            valid_regions.append(valid_region)

        except (ValueError, TypeError):
            continue

    return valid_regions


def generate_regions(prioritize_country: Optional[str] = None, state_limit: int = 10, include_metadata: bool = True) -> Dict:
    """Generate the complete regions.json structure, optionally including metadata."""
    if state_limit < 1:
        state_limit = 10

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
    if prioritize_country and prioritize_country.strip():
        prioritize_country = prioritize_country.strip()
        print(f"\n🎯 Adding states/regions for prioritized country: {prioritize_country}")
        states = get_country_states(prioritize_country, state_limit, countries_data)
        regions.extend(states)
        print(f"✅ Added {len(states)} states/regions for {prioritize_country}")

    # Validate all region data
    regions = validate_region_data(regions)

    if not regions:
        raise ValueError("No valid regions were generated")

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
            "generated_at": datetime.now().isoformat(),
            "api_source": "REST Countries API",
            "fallback_regions_used": prioritize_country is not None
        }

    return result


def write_temp_file(data: Dict, temp_dir: str) -> str:
    """Write data to a temporary file and return the path."""
    import tempfile

    with tempfile.NamedTemporaryFile(mode='w', dir=temp_dir, delete=False, suffix='.tmp') as temp_file:
        json.dump(data, temp_file, indent=2, ensure_ascii=False)
        return temp_file.name


def safe_write_json(filepath: str, data: Dict) -> None:
    """Safely write JSON data to file with backup."""
    import os
    import shutil

    # Create backup if file exists
    if os.path.exists(filepath):
        backup_path = f"{filepath}.backup"
        try:
            shutil.copy2(filepath, backup_path)
            print(f"📁 Created backup: {backup_path}")
        except Exception as e:
            print(f"⚠️  Could not create backup: {e}")

    # Write to temporary file first
    temp_dir = os.path.dirname(filepath) or '.'
    temp_path = None  # Initialize to avoid unbound variable

    try:
        temp_path = write_temp_file(data, temp_dir)
        # Move temporary file to final location
        shutil.move(temp_path, filepath)
        print(f"✅ Successfully wrote to: {filepath}")

    except Exception as e:
        # Clean up temp file if it exists
        if temp_path and os.path.exists(temp_path):
            try:
                os.unlink(temp_path)
            except:
                pass
        raise Exception(f"Failed to write file: {e}")


def create_argument_parser():
    """Create and configure argument parser."""
    parser = argparse.ArgumentParser(
        description='Generate comprehensive regions.json with all countries worldwide',
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  %(prog)s --prioritize japan --limit 15
  %(prog)s --prioritize "united states" --limit 20
  %(prog)s --no-metadata
  %(prog)s --output custom_regions.json
        """
    )
    parser.add_argument('--prioritize', type=str, help='Country to prioritize (adds states/regions)')
    parser.add_argument('--limit', type=int, default=10,
                       help='Number of states/regions to add for prioritized country (default: 10)')
    parser.add_argument('--no-metadata', action='store_true',
                       help='Exclude metadata from output')
    parser.add_argument('--output', type=str, default='regions_generated.json',
                       help='Output filename (default: regions_generated.json)')
    parser.add_argument('--verbose', '-v', action='store_true',
                       help='Enable verbose output')
    return parser


def validate_arguments(args):
    """Validate command line arguments."""
    if args.limit < 1:
        print("❌ Error: --limit must be at least 1")
        sys.exit(1)

    if not args.output or not args.output.strip():
        print("❌ Error: --output cannot be empty")
        sys.exit(1)


def print_generation_info(args):
    """Print information about the generation process."""
    print("🌍 Generating comprehensive regions.json from live API data...")
    if args.prioritize:
        print(f"🎯 Prioritizing {args.prioritize} with {args.limit} states/regions")
    if args.no_metadata:
        print("📄 Excluding metadata from output")
    if args.verbose:
        print("🔍 Verbose mode enabled")


def print_statistics(regions_data):
    """Print generation statistics."""
    regions = regions_data['regions']
    total_regions = len(regions)
    countries_count = len([r for r in regions if r.get('type') == 'country'])
    states_count = total_regions - countries_count

    print(f"✅ Generated {countries_count} countries")
    if states_count > 0:
        print(f"✅ Generated {states_count} states/regions")
    print(f"✅ Total regions: {total_regions}")

    # Print coverage by continent
    continents = {}
    for region in regions:
        continent = region.get('continent', 'Unknown')
        continents[continent] = continents.get(continent, 0) + 1

    print("\n📊 Coverage by continent:")
    for continent, count in sorted(continents.items()):
        print(f"   {continent}: {count} regions")

    print(f"\n🎯 Total coverage: {total_regions} regions worldwide")
    print("🚀 Ready for unbiased global gameplay!")
    print("\n💡 Data fetched live from REST Countries API - always up to date!")


def print_next_steps(args):
    """Print next steps and usage information."""
    print("\n📋 Next steps:")
    print(f"   1. Review {args.output}")
    print("   2. Compare with current ../lib/locations/regions.json")
    print("   3. Copy to ../lib/locations/regions.json when ready")

    print("\n💡 Usage examples:")
    print(f"   {sys.argv[0]} --prioritize japan --limit 15")
    print(f"   {sys.argv[0]} --no-metadata")
    print(f"   {sys.argv[0]} --prioritize 'united states' --limit 20 --no-metadata")

    print("\n🔧 GeoNames API Note:")
    print("   The demo account has limited requests (1000/hour).")
    print("   If you see rate limit errors, the script uses fallback data.")
    print("   For production use, get a free GeoNames account at geonames.org")


def handle_error(args):
    """Handle and print error information."""
    print("\n❌ Failed to generate regions.json: {e}")
    print("\n🔧 Troubleshooting:")
    print("   - Check your internet connection")
    print("   - Verify REST Countries API is accessible")
    print("   - Try running the script again")
    print("   - Use --verbose flag for more detailed output")
    if args.verbose:
        import traceback
        print("\n🔍 Detailed error:")
        traceback.print_exc()


def main():
    """Main function to generate and save regions.json."""
    parser = create_argument_parser()
    args = parser.parse_args()

    validate_arguments(args)
    print_generation_info(args)

    try:
        # Generate the regions data
        regions_data = generate_regions(
            prioritize_country=args.prioritize,
            state_limit=args.limit,
            include_metadata=not args.no_metadata
        )

        # Validate output structure
        if not isinstance(regions_data, dict) or 'regions' not in regions_data:
            raise ValueError("Invalid regions data structure generated")

        regions = regions_data['regions']
        if not isinstance(regions, list) or len(regions) == 0:
            raise ValueError("No regions generated")

        # Save to file
        safe_write_json(args.output, regions_data)

        # Print statistics and next steps
        print_statistics(regions_data)
        print_next_steps(args)

    except KeyboardInterrupt:
        print("\n⚠️  Operation cancelled by user")
        sys.exit(1)
    except Exception as e:
        handle_error(e)
        sys.exit(1)


if __name__ == "__main__":
    main()
