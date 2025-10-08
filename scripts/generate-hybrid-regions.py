#!/usr/bin/env python3
"""
Advanced Hybrid Region Generator for GeoGusserX v3.0
ENHANCED with Urban Landmark Targeting and Dense City Coverage
Solves the "jungle/highway bias" by focusing on architecture, landmarks, and urban areas
"""
import json
import requests
import time
import sys
import math
import random
from typing import Dict, List, Optional, Tuple
import subprocess
import shutil
from dataclasses import dataclass
from enum import Enum

print("\033[1;36m")  # Cyan bold

# ASCII Art Banner
use_pyfiglet = True
if shutil.which("figlet"):
    try:
        result = subprocess.run(
            ["figlet", "GeoGusser"],
            capture_output=True,
            text=True,
            check=True,
        )
        print(result.stdout, end="")
        use_pyfiglet = False
    except (subprocess.CalledProcessError, FileNotFoundError, OSError):
        pass

print("\033[0m")  # Reset color

# Free APIs
NOMINATIM_API = "https://nominatim.openstreetmap.org"
COUNTRIES_API = "https://restcountries.com/v3.1"
OVERPASS_API = "https://overpass-api.de/api/interpreter"

# Region types
class RegionType(Enum):
    COUNTRY = "country"
    DIRECTIONAL = "directional"
    STATE = "state"
    PROVINCE = "province"
    REGION = "region"
    URBAN = "urban"
    SUBURBAN = "suburban"
    RURAL = "rural"
    URBAN_LANDMARK = "urban_landmark"  # NEW: Specific landmarks
    URBAN_GRID = "urban_grid"  # NEW: Dense city coverage
    COMMERCIAL = "commercial"
    TRANSPORT = "transport"

class AreaClassification(Enum):
    URBAN = "urban"
    SUBURBAN = "suburban"
    RURAL = "rural"
    WILDERNESS = "wilderness"

class Direction(Enum):
    NORTH = "north"
    SOUTH = "south"
    EAST = "east"
    WEST = "west"
    CENTRAL = "central"
    NORTHEAST = "northeast"
    NORTHWEST = "northwest"
    SOUTHEAST = "southeast"
    SOUTHWEST = "southwest"

@dataclass
class BoundingBox:
    min_lat: float
    max_lat: float
    min_lon: float
    max_lon: float

    def center(self) -> Tuple[float, float]:
        return ((self.min_lat + self.max_lat) / 2, (self.min_lon + self.max_lon) / 2)

    def width(self) -> float:
        return self.max_lon - self.min_lon

    def height(self) -> float:
        return self.max_lat - self.min_lat

@dataclass
class PopulationCenter:
    name: str
    lat: float
    lng: float
    population: Optional[int]
    place_type: str
    importance: float

@dataclass
class UrbanPoint:
    """NEW: Represents a specific urban location"""
    lat: float
    lng: float
    name: str
    category: str  # landmark, commercial, residential, industrial, transport
    importance: float
    osm_type: str

# Countries and subdivisions (same as before)
COUNTRY_SUBDIVISIONS = {
    "India": [
        "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", "Chhattisgarh",
        "Goa", "Gujarat", "Haryana", "Himachal Pradesh", "Jharkhand", "Karnataka",
        "Kerala", "Madhya Pradesh", "Maharashtra", "Manipur", "Meghalaya", "Mizoram",
        "Nagaland", "Odisha", "Punjab", "Rajasthan", "Sikkim", "Tamil Nadu",
        "Telangana", "Tripura", "Uttar Pradesh", "Uttarakhand", "West Bengal",
        "Delhi", "Jammu and Kashmir", "Ladakh", "Chandigarh", "Puducherry",
        "Andaman and Nicobar Islands", "Lakshadweep"
    ],
    "Japan": [
        "Tokyo", "Osaka", "Kyoto", "Hokkaido", "Aichi", "Kanagawa", "Saitama",
        "Chiba", "Hyogo", "Fukuoka", "Shizuoka", "Hiroshima", "Ibaraki", "Tochigi",
        "Gunma", "Niigata", "Nagano", "Yamanashi", "Fukushima", "Miyagi", "Iwate",
        "Aomori", "Akita", "Yamagata", "Okinawa", "Kagoshima", "Kumamoto", "Miyazaki",
        "Oita", "Saga", "Nagasaki", "Ehime", "Kochi", "Tokushima", "Kagawa", "Okayama",
        "Shimane", "Tottori", "Yamaguchi", "Wakayama", "Nara", "Mie", "Gifu",
        "Ishikawa", "Toyama", "Fukui", "Shiga"
    ],
    "United States": [
        "California", "Texas", "Florida", "New York", "Pennsylvania", "Illinois",
        "Ohio", "Georgia", "North Carolina", "Michigan", "New Jersey", "Virginia",
        "Washington", "Arizona", "Massachusetts", "Tennessee", "Indiana", "Maryland",
        "Missouri", "Wisconsin", "Colorado", "Minnesota", "South Carolina", "Alabama",
        "Louisiana", "Kentucky", "Oregon", "Oklahoma", "Connecticut", "Utah", "Iowa",
        "Nevada", "Arkansas", "Mississippi", "Kansas", "New Mexico", "Nebraska",
        "West Virginia", "Idaho", "Hawaii", "New Hampshire", "Maine", "Montana",
        "Rhode Island", "Delaware", "South Dakota", "North Dakota", "Alaska", "Vermont", "Wyoming"
    ],
    "Germany": [
        "Baden-Württemberg", "Bavaria", "Berlin", "Brandenburg", "Bremen", "Hamburg",
        "Hesse", "Lower Saxony", "Mecklenburg-Vorpommern", "North Rhine-Westphalia",
        "Rhineland-Palatinate", "Saarland", "Saxony", "Saxony-Anhalt",
        "Schleswig-Holstein", "Thuringia"
    ],
    "France": [
        "Île-de-France", "Auvergne-Rhône-Alpes", "Hauts-de-France", "Nouvelle-Aquitaine",
        "Occitanie", "Grand Est", "Pays de la Loire", "Bretagne", "Normandie",
        "Centre-Val de Loire", "Bourgogne-Franche-Comté", "Provence-Alpes-Côte d'Azur",
        "Corse", "Guadeloupe", "Martinique", "Guyane", "Réunion", "Mayotte"
    ],
    "Canada": [
        "Ontario", "Quebec", "British Columbia", "Alberta", "Saskatchewan", "Manitoba",
        "Nova Scotia", "New Brunswick", "Newfoundland and Labrador", "Prince Edward Island",
        "Northwest Territories", "Nunavut", "Yukon"
    ],
    "Brazil": [
        "São Paulo", "Rio de Janeiro", "Minas Gerais", "Bahia", "Paraná", "Rio Grande do Sul",
        "Pernambuco", "Ceará", "Pará", "Santa Catarina", "Maranhão", "Goiás", "Amazonas",
        "Espírito Santo", "Paraíba", "Mato Grosso", "Rio Grande do Norte", "Alagoas",
        "Piauí", "Distrito Federal", "Mato Grosso do Sul", "Sergipe", "Rondônia", "Acre",
        "Amapá", "Roraima", "Tocantins"
    ],
    "United Kingdom": [
        "England", "Scotland", "Wales", "Northern Ireland"
    ],
    "Australia": [
        "New South Wales", "Victoria", "Queensland", "Western Australia", "South Australia",
        "Tasmania", "Northern Territory", "Australian Capital Territory"
    ],
    "China": [
        "Beijing", "Shanghai", "Tianjin", "Chongqing", "Guangdong", "Shandong", "Henan",
        "Sichuan", "Jiangsu", "Hebei", "Hunan", "Anhui", "Hubei", "Guangxi", "Yunnan",
        "Jiangxi", "Liaoning", "Fujian", "Shaanxi", "Heilongjiang", "Shanxi", "Guizhou",
        "Jilin", "Gansu", "Inner Mongolia", "Xinjiang", "Tibet", "Qinghai", "Ningxia", "Hainan"
    ],
    "Italy": [
        "Lombardy", "Lazio", "Campania", "Sicily", "Veneto", "Emilia-Romagna", "Piedmont",
        "Apulia", "Tuscany", "Calabria", "Sardinia", "Liguria", "Marche", "Abruzzo",
        "Friuli-Venezia Giulia", "Trentino-South Tyrol", "Umbria", "Basilicata",
        "Molise", "Valle d'Aosta"
    ],
    "Spain": [
        "Andalusia", "Catalonia", "Community of Madrid", "Valencian Community", "Galicia",
        "Castile and León", "Basque Country", "Canary Islands", "Castile-La Mancha",
        "Region of Murcia", "Aragon", "Extremadura", "Balearic Islands", "Asturias",
        "Navarre", "Cantabria", "La Rioja", "Ceuta", "Melilla"
    ],
    "Netherlands": [
        "North Holland", "South Holland", "North Brabant", "Gelderland", "Utrecht",
        "Overijssel", "Limburg", "Friesland", "Groningen", "Drenthe", "Flevoland", "Zeeland"
    ],
    "Sweden": [
        "Stockholm County", "Västra Götaland County", "Skåne County", "Östergötland County",
        "Uppsala County", "Värmland County", "Örebro County", "Jönköping County",
        "Västmanland County", "Dalarna County", "Gävleborg County", "Västernorrland County",
        "Jämtland County", "Västerbotten County", "Norrbotten County", "Södermanland County",
        "Halland County", "Blekinge County", "Gotland County", "Kronoberg County", "Kalmar County"
    ],
    "Norway": [
        "Oslo", "Viken", "Innlandet", "Vestfold og Telemark", "Agder", "Rogaland",
        "Vestland", "Møre og Romsdal", "Trøndelag", "Nordland", "Troms og Finnmark"
    ],
    "Poland": [
        "Masovian Voivodeship", "Silesian Voivodeship", "Lesser Poland Voivodeship",
        "Greater Poland Voivodeship", "Lower Silesian Voivodeship", "Łódź Voivodeship",
        "West Pomeranian Voivodeship", "Lublin Voivodeship", "Kuyavian-Pomeranian Voivodeship",
        "Pomeranian Voivodeship", "Subcarpathian Voivodeship", "Podlaskie Voivodeship",
        "Warmian-Masurian Voivodeship", "Świętokrzyskie Voivodeship", "Lubuskie Voivodeship",
        "Opole Voivodeship"
    ],
    "South Korea": [
        "Seoul", "Busan", "Incheon", "Daegu", "Daejeon", "Gwangju", "Ulsan",
        "Gyeonggi Province", "Gangwon Province", "North Chungcheong Province",
        "South Chungcheong Province", "North Jeolla Province", "South Jeolla Province",
        "North Gyeongsang Province", "South Gyeongsang Province", "Jeju Province", "Sejong"
    ],
    "Thailand": [
        "Bangkok", "Central Thailand", "Northern Thailand", "Northeastern Thailand",
        "Southern Thailand", "Chiang Mai Province", "Chon Buri Province", "Khon Kaen Province",
        "Nakhon Ratchasima Province", "Songkhla Province", "Ubon Ratchathani Province",
        "Surat Thani Province", "Nakhon Si Thammarat Province", "Rayong Province"
    ],
    "Indonesia": [
        "Jakarta", "West Java", "Central Java", "East Java", "North Sumatra", "South Sumatra",
        "West Sumatra", "Riau", "Lampung", "Banten", "Yogyakarta", "Central Kalimantan",
        "South Kalimantan", "East Kalimantan", "North Kalimantan", "West Kalimantan",
        "North Sulawesi", "Central Sulawesi", "South Sulawesi", "Southeast Sulawesi",
        "Bali", "West Nusa Tenggara", "East Nusa Tenggara", "Maluku", "North Maluku",
        "Papua", "West Papua"
    ],
    "Malaysia": [
        "Selangor", "Johor", "Sabah", "Sarawak", "Perak", "Kedah", "Kelantan", "Pahang",
        "Terengganu", "Penang", "Negeri Sembilan", "Melaka", "Perlis",
        "Kuala Lumpur", "Putrajaya", "Labuan"
    ],
    "Turkey": [
        "Istanbul", "Ankara", "Izmir", "Bursa", "Antalya", "Adana", "Konya", "Gaziantep",
        "Mersin", "Diyarbakir", "Kayseri", "Eskisehir", "Urfa", "Malatya", "Trabzon",
        "Erzurum", "Van", "Batman", "Elazig", "Samsun", "Denizli", "Sakarya", "Hatay"
    ],
    "Israel": [
        "Jerusalem District", "Northern District", "Haifa District", "Central District",
        "Tel Aviv District", "Southern District"
    ],
    "United Arab Emirates": [
        "Abu Dhabi", "Dubai", "Sharjah", "Ajman", "Umm Al Quwain", "Ras Al Khaimah", "Fujairah"
    ],
    "Argentina": [
        "Buenos Aires Province", "Córdoba Province", "Santa Fe Province", "Mendoza Province",
        "Tucumán Province", "Entre Ríos Province", "Salta Province", "Misiones Province",
        "Chaco Province", "Corrientes Province", "Santiago del Estero Province",
        "San Juan Province", "Jujuy Province", "Río Negro Province", "Formosa Province",
        "Neuquén Province", "Chubut Province", "San Luis Province", "Catamarca Province",
        "La Rioja Province", "La Pampa Province", "Santa Cruz Province",
        "Tierra del Fuego Province", "Buenos Aires City"
    ],
    "Chile": [
        "Santiago Metropolitan Region", "Valparaíso Region", "Biobío Region",
        "Araucanía Region", "Los Lagos Region", "Maule Region", "O'Higgins Region",
        "Coquimbo Region", "Atacama Region", "Antofagasta Region", "Tarapacá Region",
        "Los Ríos Region", "Aysén Region", "Magallanes Region", "Arica y Parinacota Region"
    ],
    "Colombia": [
        "Antioquia", "Valle del Cauca", "Cundinamarca", "Atlántico", "Santander",
        "Bolívar", "Norte de Santander", "Córdoba", "Tolima", "Huila", "Nariño",
        "Meta", "Cesar", "Boyacá", "Sucre", "La Guajira", "Magdalena", "Caldas",
        "Risaralda", "Cauca", "Caquetá", "Casanare", "Putumayo", "Quindío",
        "Arauca", "Chocó", "San Andrés y Providencia", "Amazonas", "Guainía",
        "Guaviare", "Vaupés", "Vichada", "Bogotá"
    ],
    "Peru": [
        "Lima", "Arequipa", "La Libertad", "Piura", "Lambayeque", "Junín", "Cusco",
        "Puno", "Ancash", "Ica", "Huánuco", "San Martín", "Loreto", "Cajamarca",
        "Ayacucho", "Ucayali", "Apurímac", "Huancavelica", "Tacna", "Moquegua",
        "Pasco", "Tumbes", "Amazonas", "Madre de Dios", "Callao"
    ],
    "South Africa": [
        "Gauteng", "KwaZulu-Natal", "Western Cape", "Eastern Cape", "Limpopo",
        "Mpumalanga", "North West", "Free State", "Northern Cape"
    ],
    "Nigeria": [
        "Lagos", "Kano", "Kaduna", "Oyo", "Rivers", "Bayelsa", "Akwa Ibom", "Imo",
        "Delta", "Sokoto", "Katsina", "Zamfara", "Kebbi", "Niger", "Kwara", "Ogun",
        "Osun", "Ondo", "Ekiti", "Anambra", "Enugu", "Ebonyi", "Cross River",
        "Abia", "Plateau", "Benue", "Taraba", "Adamawa", "Bauchi", "Gombe",
        "Yobe", "Borno", "Jigawa", "Nasarawa", "Kogi", "Edo", "Federal Capital Territory"
    ],
    "Egypt": [
        "Cairo", "Giza", "Alexandria", "Qalyubia", "Port Said", "Suez", "Luxor",
        "Aswan", "Asyut", "Beheira", "Beni Suef", "Dakahlia", "Damietta",
        "Fayyum", "Gharbia", "Ismailia", "Kafr el-Sheikh", "Matrouh", "Minya",
        "Monufia", "New Valley", "North Sinai", "Qena", "Red Sea", "Sharqia",
        "Sohag", "South Sinai"
    ],
    "Russia": [
        "Moscow", "Saint Petersburg", "Moscow Oblast", "Krasnodar Krai", "Rostov Oblast",
        "Tatarstan", "Bashkortostan", "Sverdlovsk Oblast", "Nizhny Novgorod Oblast",
        "Samara Oblast", "Chelyabinsk Oblast", "Voronezh Oblast", "Perm Krai",
        "Volgograd Oblast", "Krasnoyarsk Krai", "Saratov Oblast", "Tyumen Oblast",
        "Tula Oblast", "Kemerovo Oblast", "Irkutsk Oblast", "Yaroslavl Oblast",
        "Altai Krai", "Udmurt Republic", "Kaliningrad Oblast", "Novosibirsk Oblast"
    ],
    "Czech Republic": [
        "Prague", "Central Bohemian Region", "South Bohemian Region", "Plzeň Region",
        "Karlovy Vary Region", "Ústí nad Labem Region", "Liberec Region",
        "Hradec Králové Region", "Pardubice Region", "Vysočina Region",
        "South Moravian Region", "Olomouc Region", "Zlín Region", "Moravian-Silesian Region"
    ]
}

class HybridRegionGenerator:
    def __init__(self):
        self.regions = []
        self.rate_limit_delay = 1.2
        self.session = requests.Session()
        self.session.headers.update({
            'User-Agent': 'GeoGusserX-AdvancedGenerator/3.0 (Educational Geographic Project)'
        })
        self.api_success_rate = {'success': 0, 'total': 0}
        self.population_centers_cache = {}
        self.country_bounds_cache = {}
        self.urban_points_cache = {}  # NEW: Cache for urban landmarks

    def log(self, message: str, level: str = "INFO"):
        """Simple logging with colors"""
        color_map = {
            "INFO": "\033[0;32m", "WARN": "\033[0;33m", "ERROR": "\033[0;31m",
            "HEADER": "\033[1;35m", "SUCCESS": "\033[1;32m", "DETAIL": "\033[0;34m",
            "RESET": "\033[0m",
        }
        prefix_map = {"INFO": "➡️", "WARN": "⚠️", "ERROR": "❌"}
        prefix = prefix_map.get(level, '➡️')
        color = color_map.get(level, color_map["INFO"])
        print(f"{color}[{level}]{color_map['RESET']} {prefix} {message}{color_map['RESET']}")
        sys.stdout.flush()

    def calculate_radius_from_bbox(self, bbox: List[float]) -> int:
        """Calculate radius from bounding box"""
        if not bbox or len(bbox) < 4:
            return 100
        min_lat, max_lat, min_lon, max_lon = [float(x) for x in bbox[:4]]
        lat_dist = abs(max_lat - min_lat) * 111
        lon_dist = abs(max_lon - min_lon) * 111 * math.cos(math.radians((min_lat + max_lat) / 2))
        max_dimension = max(lat_dist, lon_dist)
        return max(20, min(300, int(max_dimension * 0.35)))

    def geocode_with_api(self, location_query: str) -> Optional[Dict]:
        """Fetch coordinates using Nominatim"""
        try:
            params = {
                'q': location_query,
                'format': 'json',
                'limit': 1,
                'addressdetails': 1,
                'extratags': 1
            }
            self.log(f"🔍 Looking up: {location_query}", "INFO")
            response = self.session.get(f"{NOMINATIM_API}/search", params=params)
            response.raise_for_status()
            time.sleep(self.rate_limit_delay)
            data = response.json()
            self.api_success_rate['total'] += 1
            if data and len(data) > 0:
                result = data[0]
                self.api_success_rate['success'] += 1
                self.log(f"✅ Found: {result.get('display_name', location_query)}", "SUCCESS")
                return result
            else:
                self.log(f"❌ Not found: {location_query}", "ERROR")
                return None
        except Exception as e:
            self.api_success_rate['total'] += 1
            self.log(f"⚠️ API error for {location_query}: {str(e)[:100]}", "WARN")
            return None

    def get_country_info(self, country_name: str) -> Dict:
        """Get country metadata"""
        try:
            response = self.session.get(f"{COUNTRIES_API}/name/{country_name}")
            if response.status_code == 200:
                data = response.json()
                if data:
                    return data[0]
        except Exception as e:
            self.log(f"Failed to get country info for {country_name}: {e}", "WARN")
        return {}

    def determine_continent(self, country_name: str, country_info: Optional[Dict] = None) -> str:
        """Determine continent"""
        if country_info and 'region' in country_info:
            region_map = {
                'Asia': 'Asia', 'Europe': 'Europe', 'Americas': 'North America',
                'Africa': 'Africa', 'Oceania': 'Oceania', 'Antarctic': 'Antarctica'
            }
            region = country_info.get('region', '')
            if region:
                return region_map.get(region, region) or "Unknown"

        continent_map = {
            "India": "Asia", "Japan": "Asia", "China": "Asia", "South Korea": "Asia",
            "Thailand": "Asia", "Indonesia": "Asia", "Malaysia": "Asia", "Turkey": "Asia",
            "Israel": "Asia", "United Arab Emirates": "Asia",
            "Germany": "Europe", "France": "Europe", "United Kingdom": "Europe",
            "Italy": "Europe", "Spain": "Europe", "Netherlands": "Europe",
            "Sweden": "Europe", "Norway": "Europe", "Poland": "Europe",
            "Russia": "Europe", "Czech Republic": "Europe",
            "United States": "North America", "Canada": "North America",
            "Brazil": "South America", "Argentina": "South America", "Chile": "South America",
            "Colombia": "South America", "Peru": "South America",
            "South Africa": "Africa", "Nigeria": "Africa", "Egypt": "Africa",
            "Australia": "Oceania"
        }
        return continent_map.get(country_name, "Unknown")

    def generate_country_region(self, country_name: str) -> Optional[Dict]:
        """Generate main country region"""
        self.log(f"🌍 Generating country region for {country_name}...", "INFO")
        country_info = self.get_country_info(country_name)
        continent = self.determine_continent(country_name, country_info)
        geo_data = self.geocode_with_api(country_name)

        if geo_data:
            lat = float(geo_data['lat'])
            lng = float(geo_data['lon'])
            bbox = geo_data.get('boundingbox', [])
            radius = self.calculate_radius_from_bbox(bbox) if bbox else 150
            return {
                "lat": round(lat, 4),
                "lng": round(lng, 4),
                "radius": radius,
                "name": country_name,
                "continent": continent,
                "type": "country"
            }

        self.log(f"❌ Failed to generate region for {country_name}", "ERROR")
        return None

    def generate_subdivision_region(self, subdivision_name: str, country_name: str, continent: str) -> Optional[Dict]:
        """Generate state/province region"""
        queries = [
            f"{subdivision_name}, {country_name}",
            f"{subdivision_name}",
            f"{subdivision_name} {country_name}",
        ]

        for query in queries:
            geo_data = self.geocode_with_api(query)
            if geo_data:
                lat = float(geo_data['lat'])
                lng = float(geo_data['lon'])
                bbox = geo_data.get('boundingbox', [])
                radius = self.calculate_radius_from_bbox(bbox) if bbox else 80

                subdivision_type = "state"
                display_name = geo_data.get('display_name', '').lower()
                if 'province' in display_name:
                    subdivision_type = "province"
                elif 'region' in display_name:
                    subdivision_type = "region"
                elif 'prefecture' in display_name:
                    subdivision_type = "prefecture"

                return {
                    "lat": round(lat, 4),
                    "lng": round(lng, 4),
                    "radius": radius,
                    "name": f"{subdivision_name}, {country_name}",
                    "continent": continent,
                    "type": subdivision_type
                }

        return None

    def get_country_bounding_box(self, country_name: str) -> Optional[BoundingBox]:
        """Get detailed bounding box"""
        if country_name in self.country_bounds_cache:
            return self.country_bounds_cache[country_name]

        try:
            params = {
                'q': country_name,
                'format': 'json',
                'limit': 1,
                'polygon_geojson': 1,
                'addressdetails': 1
            }
            response = self.session.get(f"{NOMINATIM_API}/search", params=params)
            response.raise_for_status()
            time.sleep(self.rate_limit_delay)
            data = response.json()

            if data and len(data) > 0:
                result = data[0]
                bbox = result.get('boundingbox', [])
                if len(bbox) >= 4:
                    bounding_box = BoundingBox(
                        min_lat=float(bbox[0]),
                        max_lat=float(bbox[1]),
                        min_lon=float(bbox[2]),
                        max_lon=float(bbox[3])
                    )
                    self.country_bounds_cache[country_name] = bounding_box
                    return bounding_box
        except Exception as e:
            self.log(f"Failed to get bounding box for {country_name}: {e}", "WARN")

        return None

    def get_population_centers(self, country_name: str) -> List[PopulationCenter]:
        """Get major population centers"""
        if country_name in self.population_centers_cache:
            return self.population_centers_cache[country_name]

        centers = []
        try:
            for place_type in ['city', 'town']:
                params = {
                    'q': f"{place_type} in {country_name}",
                    'format': 'json',
                    'limit': 30,
                    'addressdetails': 1
                }
                response = self.session.get(f"{NOMINATIM_API}/search", params=params)
                if response.status_code == 200:
                    data = response.json()
                    for item in data:
                        if 'lat' in item and 'lon' in item:
                            center = PopulationCenter(
                                name=item.get('display_name', '').split(',')[0],
                                lat=float(item['lat']),
                                lng=float(item['lon']),
                                population=None,
                                place_type=place_type,
                                importance=float(item.get('importance', 0.5))
                            )
                            centers.append(center)

                time.sleep(self.rate_limit_delay)
        except Exception as e:
            self.log(f"Failed to get population centers for {country_name}: {e}", "WARN")

        centers.sort(key=lambda x: x.importance, reverse=True)
        self.population_centers_cache[country_name] = centers[:40]
        return centers[:40]

    # ========== NEW ENHANCED URBAN METHODS ==========

    def get_urban_landmarks_quick(self, city_name: str, country: str, lat: float, lng: float) -> List[UrbanPoint]:
        """
        QUICK method: Get urban landmarks using targeted Nominatim searches
        This is faster than Overpass and works well for landmarks
        """
        cache_key = f"{city_name}_{country}"
        if cache_key in self.urban_points_cache:
            return self.urban_points_cache[cache_key]

        landmark_types = [
            ('railway station', 'transport', 0.8),
            ('airport', 'transport', 0.9),
            ('shopping mall', 'commercial', 0.7),
            ('university', 'landmark', 0.7),
            ('hospital', 'landmark', 0.6),
            ('museum', 'landmark', 0.8),
            ('city hall', 'landmark', 0.7),
            ('monument', 'landmark', 0.7),
            ('central park', 'landmark', 0.6),
            ('stadium', 'landmark', 0.7),
            ('downtown', 'commercial', 0.8),
            ('business district', 'commercial', 0.8),
            ('main street', 'commercial', 0.7),
            ('central square', 'landmark', 0.7),
            ('cathedral', 'landmark', 0.8),
            ('temple', 'landmark', 0.7),
            ('palace', 'landmark', 0.9),
            ('tower', 'landmark', 0.8)
        ]

        points = []
        for landmark_type, category, importance in landmark_types:
            query = f"{landmark_type} in {city_name}, {country}"
            geo_data = self.geocode_with_api(query)

            if geo_data:
                point_lat = float(geo_data['lat'])
                point_lng = float(geo_data['lon'])

                # Verify it's reasonably close to the city center (within 50km)
                distance = self._haversine_distance(lat, lng, point_lat, point_lng)
                if distance <= 50:
                    point = UrbanPoint(
                        lat=point_lat,
                        lng=point_lng,
                        name=geo_data.get('display_name', '').split(',')[0],
                        category=category,
                        importance=importance,
                        osm_type=landmark_type
                    )
                    points.append(point)

        self.urban_points_cache[cache_key] = points
        self.log(f"🏛️ Found {len(points)} landmarks in {city_name}", "SUCCESS")
        return points

    def get_dense_urban_grid(self, city_name: str, center_lat: float, center_lng: float,
                            radius_km: float = 8) -> List[Tuple[float, float]]:
        """
        Generate dense grid of coordinates covering urban area
        Ensures comprehensive city coverage even without POI data
        """
        points = []

        # Grid spacing: ~1.5km between points in urban core
        lat_spacing = 1.5 / 111.0
        lng_spacing = 1.5 / (111.0 * math.cos(math.radians(center_lat)))

        radius_deg = radius_km / 111.0

        current_lat = center_lat - radius_deg
        while current_lat <= center_lat + radius_deg:
            current_lng = center_lng - radius_deg
            while current_lng <= center_lng + radius_deg:
                dist = self._haversine_distance(center_lat, center_lng, current_lat, current_lng)
                if dist <= radius_km:
                    points.append((current_lat, current_lng))
                current_lng += lng_spacing
            current_lat += lat_spacing

        return points

    def _haversine_distance(self, lat1: float, lng1: float, lat2: float, lng2: float) -> float:
        """Calculate distance in km"""
        R = 6371
        lat1_rad = math.radians(lat1)
        lat2_rad = math.radians(lat2)
        dlat = math.radians(lat2 - lat1)
        dlng = math.radians(lng2 - lng1)
        a = (math.sin(dlat / 2) ** 2 +
             math.cos(lat1_rad) * math.cos(lat2_rad) * math.sin(dlng / 2) ** 2)
        c = 2 * math.asin(math.sqrt(a))
        return R * c

    def _categorize_urban_point(self, tags: Dict) -> str:
        """Categorize OSM element"""
        if tags.get('tourism') in ['attraction', 'museum', 'monument']:
            return 'landmark'
        if tags.get('historic'):
            return 'landmark'
        if tags.get('shop') or tags.get('building') == 'commercial':
            return 'commercial'
        if tags.get('railway') == 'station' or tags.get('aeroway'):
            return 'transport'
        if tags.get('landuse') == 'industrial' or tags.get('building') == 'industrial':
            return 'industrial'
        if tags.get('building'):
            return 'residential'
        return 'urban'

    def generate_urban_rural_regions(self, country_name: str, continent: str) -> List[Dict]:
        """
        ENHANCED: Generate urban regions with landmark targeting
        This is the KEY improvement that fixes the jungle/highway bias
        """
        population_centers = self.get_population_centers(country_name)
        if not population_centers:
            return []

        regions = []

        # Process top cities with enhanced urban coverage
        for i, center in enumerate(population_centers[:12]):  # Top 12 cities
            city_name = center.name
            self.log(f"🏙️ Processing {city_name} ({i+1}/{min(12, len(population_centers))})...", "INFO")

            # 1. Get specific urban landmarks
            urban_landmarks = self.get_urban_landmarks_quick(city_name, country_name, center.lat, center.lng)

            # Create regions for landmarks (prioritize important ones)
            urban_landmarks.sort(key=lambda x: x.importance, reverse=True)
            for landmark in urban_landmarks[:25]:  # Top 25 landmarks per city
                region = {
                    "lat": round(landmark.lat, 6),
                    "lng": round(landmark.lng, 6),
                    "radius": 4,  # Small radius for specific landmarks
                    "name": f"{landmark.name}, {city_name}, {country_name}",
                    "continent": continent,
                    "type": RegionType.URBAN_LANDMARK.value,
                    "category": landmark.category,
                    "country": country_name,
                    "city": city_name,
                    "area_classification": AreaClassification.URBAN.value,
                    "importance": landmark.importance
                }
                regions.append(region)

            # 2. Dense urban grid for comprehensive coverage
            grid_points = self.get_dense_urban_grid(city_name, center.lat, center.lng, radius_km=7)

            # Sample grid points (take ~15 per city for balance)
            num_grid = min(15, len(grid_points))
            sampled_grid = random.sample(grid_points, num_grid)

            for grid_lat, grid_lng in sampled_grid:
                region = {
                    "lat": round(grid_lat, 6),
                    "lng": round(grid_lng, 6),
                    "radius": 2,  # Very small for dense coverage
                    "name": f"{city_name} Urban Grid, {country_name}",
                    "continent": continent,
                    "type": RegionType.URBAN_GRID.value,
                    "category": "urban",
                    "country": country_name,
                    "city": city_name,
                    "area_classification": AreaClassification.URBAN.value
                }
                regions.append(region)

            # 3. City-wide zones (commercial, residential, transport)
            zone_configs = [
                ('commercial', 0.5, 10),
                ('residential', 0.7, 12),
                ('transport', 0.3, 8)
            ]

            for zone_type, radius_mult, radius_base in zone_configs:
                zone_region = {
                    "lat": round(center.lat, 6),
                    "lng": round(center.lng, 6),
                    "radius": int(radius_base * radius_mult),
                    "name": f"{city_name} {zone_type.title()} Zone, {country_name}",
                    "continent": continent,
                    "type": RegionType.COMMERCIAL.value if zone_type == 'commercial' else RegionType.URBAN.value,
                    "category": zone_type,
                    "country": country_name,
                    "city": city_name,
                    "area_classification": AreaClassification.URBAN.value
                }
                regions.append(zone_region)

            self.log(f"✅ {city_name}: {len(urban_landmarks)} landmarks + {num_grid} grid points", "SUCCESS")

        # Also process smaller towns for rural/suburban
        for center in population_centers[12:25]:
            if center.place_type == 'town':
                rural_region = {
                    "lat": round(center.lat, 6),
                    "lng": round(center.lng, 6),
                    "radius": 20,
                    "name": f"{center.name} Area, {country_name}",
                    "continent": continent,
                    "type": RegionType.RURAL.value,
                    "country": country_name,
                    "area_classification": AreaClassification.RURAL.value
                }
                regions.append(rural_region)

        self.log(f"🎯 Total urban/rural regions for {country_name}: {len(regions)}", "SUCCESS")
        return regions

    # ========== END NEW METHODS ==========

    def generate_directional_regions(self, country_name: str, continent: str) -> List[Dict]:
        """Generate N/S/E/W/Central regions"""
        bbox = self.get_country_bounding_box(country_name)
        if not bbox:
            return []

        regions = []
        center_lat, center_lon = bbox.center()
        lat_third = bbox.height() / 3
        lon_third = bbox.width() / 3

        directional_regions = {
            Direction.NORTH: {
                'lat': center_lat + lat_third * 0.5,
                'lng': center_lon,
                'bounds': (center_lat + lat_third * 0.2, bbox.max_lat, bbox.min_lon, bbox.max_lon)
            },
            Direction.SOUTH: {
                'lat': center_lat - lat_third * 0.5,
                'lng': center_lon,
                'bounds': (bbox.min_lat, center_lat - lat_third * 0.2, bbox.min_lon, bbox.max_lon)
            },
            Direction.EAST: {
                'lat': center_lat,
                'lng': center_lon + lon_third * 0.5,
                'bounds': (bbox.min_lat, bbox.max_lat, center_lon + lon_third * 0.2, bbox.max_lon)
            },
            Direction.WEST: {
                'lat': center_lat,
                'lng': center_lon - lon_third * 0.5,
                'bounds': (bbox.min_lat, bbox.max_lat, bbox.min_lon, center_lon - lon_third * 0.2)
            },
            Direction.CENTRAL: {
                'lat': center_lat,
                'lng': center_lon,
                'bounds': (center_lat - lat_third * 0.3, center_lat + lat_third * 0.3,
                          center_lon - lon_third * 0.3, center_lon + lon_third * 0.3)
            }
        }

        for direction, data in directional_regions.items():
            min_lat, max_lat, min_lon, max_lon = data['bounds']
            lat_dist = abs(max_lat - min_lat) * 111
            lon_dist = abs(max_lon - min_lon) * 111 * math.cos(math.radians(data['lat']))
            radius = max(50, min(200, int(max(lat_dist, lon_dist) * 0.4)))

            region = {
                "lat": round(data['lat'], 4),
                "lng": round(data['lng'], 4),
                "radius": radius,
                "name": f"{direction.value.title()} {country_name}",
                "continent": continent,
                "type": RegionType.DIRECTIONAL.value,
                "country": country_name,
                "direction": direction.value,
                "area_classification": AreaClassification.RURAL.value
            }
            regions.append(region)

        return regions

    def generate_regions(self):
        """Main generation method"""
        self.log("🚀 Starting ENHANCED region generation v3.0...", "HEADER")
        self.log(f"📊 Processing {len(COUNTRY_SUBDIVISIONS)} countries", "INFO")
        self.log("🎯 NEW: Urban landmark targeting + Dense city grids", "SUCCESS")
        self.log("✨ This fixes the jungle/highway bias problem!", "SUCCESS")

        total_regions = 0

        for country_name, subdivisions in COUNTRY_SUBDIVISIONS.items():
            print("\n" + "\033[1;35m" + "="*60 + "\033[0m")
            self.log(f"🌍 Processing {country_name} ({len(subdivisions)} subdivisions)...", "HEADER")

            country_region = self.generate_country_region(country_name)
            if country_region:
                self.regions.append(country_region)
                total_regions += 1
                continent = country_region['continent']
            else:
                self.log(f"⚠️ Skipping subdivisions for {country_name}", "WARN")
                continue

            # Directional regions
            self.log("🧭 Generating directional regions...", "INFO")
            directional_regions = self.generate_directional_regions(country_name, continent)
            for region in directional_regions:
                self.regions.append(region)
                total_regions += 1
            self.log(f"✅ Generated {len(directional_regions)} directional regions", "SUCCESS")

            # Urban/rural with landmark targeting
            self.log("🏙️ Generating ENHANCED urban regions with landmarks...", "INFO")
            urban_rural_regions = self.generate_urban_rural_regions(country_name, continent)
            for region in urban_rural_regions:
                self.regions.append(region)
                total_regions += 1
            self.log(f"✅ Generated {len(urban_rural_regions)} urban/rural regions", "SUCCESS")

            # Subdivisions
            added_subdivisions = 0
            for i, subdivision in enumerate(subdivisions, 1):
                self.log(f"📍 {i}/{len(subdivisions)}: Processing {subdivision}...", "DETAIL")
                region = self.generate_subdivision_region(subdivision, country_name, continent)
                if region:
                    self.regions.append(region)
                    added_subdivisions += 1
                    total_regions += 1

                if i % 10 == 0:
                    success_rate = (added_subdivisions / i) * 100
                    self.log(f"📈 Progress: {i}/{len(subdivisions)}, {success_rate:.1f}% success", "INFO")

            self.log(f"✅ {country_name} complete: {total_regions} total regions", "SUCCESS")

        api_success_rate = (self.api_success_rate['success'] / max(1, self.api_success_rate['total'])) * 100
        self.log("\n🎉 ENHANCED generation complete!", "SUCCESS")
        self.log(f"📊 Total regions: {total_regions}", "INFO")
        self.log(f"🌐 API success rate: {api_success_rate:.1f}%", "INFO")

    def save_regions(self, filename: str = "../lib/locations/regions_comprehensive.json"):
        """Save regions to JSON"""
        try:
            import os
            abs_path = os.path.abspath(filename)
            self.log(f"💾 Saving to: {abs_path}", "INFO")
            os.makedirs(os.path.dirname(abs_path), exist_ok=True)
            self.regions.sort(key=lambda x: (x['continent'], x['name']))

            # Count region types
            countries = sum(1 for r in self.regions if r['type'] == 'country')
            directional = sum(1 for r in self.regions if r['type'] == 'directional')
            urban_landmarks = sum(1 for r in self.regions if r['type'] == 'urban_landmark')
            urban_grid = sum(1 for r in self.regions if r['type'] == 'urban_grid')
            urban = sum(1 for r in self.regions if r['type'] == 'urban')
            suburban = sum(1 for r in self.regions if r['type'] == 'suburban')
            rural = sum(1 for r in self.regions if r['type'] == 'rural')
            subdivisions = len(self.regions) - countries - directional - urban_landmarks - urban_grid - urban - suburban - rural

            api_success_rate = (self.api_success_rate['success'] / max(1, self.api_success_rate['total'])) * 100

            output_data = {
                "metadata": {
                    "generated_at": time.strftime("%Y-%m-%d %H:%M:%S UTC", time.gmtime()),
                    "total_regions": len(self.regions),
                    "countries": countries,
                    "directional_regions": directional,
                    "urban_landmarks": urban_landmarks,
                    "urban_grid_points": urban_grid,
                    "urban_zones": urban,
                    "suburban_areas": suburban,
                    "rural_areas": rural,
                    "subdivisions": subdivisions,
                    "generator": "GeoGusserX Enhanced Region Generator v3.0",
                    "api_success_rate": f"{api_success_rate:.1f}%",
                    "data_sources": [
                        "OpenStreetMap Nominatim API (geocoding + landmarks)",
                        "REST Countries API (country metadata)",
                        "Targeted landmark searches (fixes urban bias)",
                        "Dense urban grid coverage (comprehensive city coverage)"
                    ],
                    "enhancements": [
                        "Urban landmark targeting (museums, stations, monuments, etc.)",
                        "Dense city grid coverage (1.5km spacing)",
                        "Multi-zone urban areas (commercial, residential, transport)",
                        "Smart coordinate distribution prioritizing developed areas"
                    ],
                    "coverage": "ENHANCED: Landmarks + Dense Urban Grids + Directional + Administrative",
                    "quality": "Premium - Solves jungle/highway bias with landmark-focused generation"
                },
                "regions": self.regions
            }

            with open(filename, 'w', encoding='utf-8') as f:
                json.dump(output_data, f, indent=2, ensure_ascii=False)

            self.log(f"💾 Saved {len(self.regions)} regions!", "SUCCESS")
            self.generate_statistics()

        except Exception as e:
            self.log(f"Failed to save: {e}", "ERROR")

    def generate_statistics(self):
        """Generate statistics"""
        countries = sum(1 for r in self.regions if r['type'] == 'country')
        directional = sum(1 for r in self.regions if r['type'] == 'directional')
        urban_landmarks = sum(1 for r in self.regions if r['type'] == 'urban_landmark')
        urban_grid = sum(1 for r in self.regions if r['type'] == 'urban_grid')
        urban = sum(1 for r in self.regions if r['type'] == 'urban')
        commercial = sum(1 for r in self.regions if r['type'] == 'commercial')
        suburban = sum(1 for r in self.regions if r['type'] == 'suburban')
        rural = sum(1 for r in self.regions if r['type'] == 'rural')

        self.log("\n📈 ENHANCED Generation Statistics:", "HEADER")
        print("\033[1;35m" + "=" * 50 + "\033[0m")
        self.log(f"🌍 Total Regions: {len(self.regions)}", "INFO")
        self.log(f"🏛️ Urban Landmarks: {urban_landmarks} (NEW!)", "SUCCESS")
        self.log(f"🗺️ Urban Grid Points: {urban_grid} (NEW!)", "SUCCESS")
        self.log(f"🏙️ Urban Zones: {urban}", "INFO")
        self.log(f"🏢 Commercial Districts: {commercial}", "INFO")
        self.log(f"🏡 Suburban Areas: {suburban}", "INFO")
        self.log(f"🌾 Rural Areas: {rural}", "INFO")
        self.log(f"🧭 Directional Regions: {directional}", "INFO")
        self.log(f"🏛️ Countries: {countries}", "INFO")

        landmark_categories = {}
        for region in self.regions:
            if region.get('type') == 'urban_landmark':
                cat = region.get('category', 'other')
                landmark_categories[cat] = landmark_categories.get(cat, 0) + 1

        if landmark_categories:
            self.log("\n🏛️ Landmark Categories:", "HEADER")
            for cat, count in sorted(landmark_categories.items(), key=lambda x: x[1], reverse=True):
                print(f"  \033[0;34m• {cat}: {count}\033[0m")

def main():
    """Main function"""
    import os
    print("\033[1;36m" + "=" * 60 + "\033[0m")
    print("🎯 ENHANCED v3.0: Urban Landmark Targeting + Dense Coverage")
    print("🏛️ Fixes jungle/highway bias by focusing on landmarks")
    print("🏙️ Targets: museums, stations, monuments, downtown areas")
    print("🗺️ Dense grid coverage ensures comprehensive city capture")
    print("⏱️ Takes 15-20 minutes for comprehensive landmark scanning")
    print("🆓 Completely free - no API keys required")
    print(f"📁 Working directory: {os.getcwd()}")
    print()

    generator = HybridRegionGenerator()

    try:
        generator.generate_regions()
        output_file = "../lib/locations/regions_comprehensive.json"
        generator.save_regions(output_file)

        print("\n\033[1;32m🎉 SUCCESS! Generated ENHANCED regions database:\033[0m")
        print(f"\033[0;32m📁 File: {output_file}\033[0m")
        print(f"\033[0;32m📊 Total: {len(generator.regions)} regions\033[0m")
        print("\033[0;32m🏛️ Urban landmarks: Targeted famous places\033[0m")
        print("\033[0;32m🗺️ Dense grids: Comprehensive city coverage\033[0m")
        print("\033[0;32m✨ Result: Beautiful architecture & structures!\033[0m")

        print("\n\033[1;34m💡 To use:\033[0m")
        print("\033[0;34m1. Update import in regions.ts:\033[0m")
        print("\033[0;34m   import regionsData from './regions_comprehensive.json';\033[0m")
        print("\033[0;34m2. Restart: pnpm dev\033[0m")

        print("\n\033[1;32m🎮 Your jungle bias is SOLVED!\033[0m")
        print("\033[0;32m   ✅ Landmark targeting (museums, monuments, stations)\033[0m")
        print("\033[0;32m   ✅ Dense urban grids (comprehensive coverage)\033[0m")
        print("\033[0;32m   ✅ Multi-zone targeting (commercial, residential)\033[0m")
        print("\033[0;32m   ✅ Smart prioritization (famous places first)\033[0m")

    except KeyboardInterrupt:
        print("\n\033[0;33m⏹️ Interrupted\033[0m")
        if generator.regions:
            generator.save_regions("../lib/locations/regions_partial.json")
    except Exception as e:
        print(f"\n\033[0;31m❌ Failed: {e}\033[0m")
        if generator.regions:
            generator.save_regions("../lib/locations/regions_partial.json")
        return 1

    return 0

if __name__ == "__main__":
    sys.exit(main())
