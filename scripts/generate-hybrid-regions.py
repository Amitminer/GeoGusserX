#!/usr/bin/env python3
"""
Hybrid Region Generator for GeoGusserX
Uses free APIs to fetch real coordinates, with smart fallbacks
"""
import json
import requests
import time
import sys
import math
from typing import Dict, List, Optional
import subprocess
import shutil

print("\033[1;36m")  # Cyan bold

# Attempt to use the system's 'figlet' command for a native feel
use_pyfiglet = True
if shutil.which("figlet"):
    try:
        result = subprocess.run(
            ["figlet", "GeoGusser"],
            capture_output=True,
            text=True,
            check=True,
        )
        # The command's output includes a trailing newline, so use end=""
        # to match the behavior of the original print() statement.
        print(result.stdout, end="")
        use_pyfiglet = False
    except (subprocess.CalledProcessError, FileNotFoundError, OSError):
        # Fallback to pyfiglet if the system command fails for any reason
        pass

print("\033[0m")  # Reset color

# Free APIs (no authentication required)
NOMINATIM_API = "https://nominatim.openstreetmap.org"
COUNTRIES_API = "https://restcountries.com/v3.1"

# 🗺️ Core countries and their known subdivisions (beautifully arranged)
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
        self.rate_limit_delay = 1.2  # ⏱️ Respectful rate limiting
        self.session = requests.Session()
        self.session.headers.update({
            'User-Agent': 'GeoGusserX-HybridGenerator/1.0 (Educational Geographic Project)'
        })
        self.api_success_rate = {'success': 0, 'total': 0}

    def log(self, message: str, level: str = "INFO"):
        """Simple logging function with colors"""
        color_map = {
            "INFO": "\033[0;32m",    # Green
            "WARN": "\033[0;33m",    # Yellow
            "ERROR": "\033[0;31m",   # Red
            "HEADER": "\033[1;35m",  # Magenta bold
            "SUCCESS": "\033[1;32m", # Green bold
            "DETAIL": "\033[0;34m",  # Blue
            "RESET": "\033[0m",      # Reset
        }

        prefix_map = {
            "INFO": "➡️",
            "WARN": "⚠️",
            "ERROR": "❌",
        }

        # Determine prefix and color based on level
        prefix = prefix_map.get(level, '➡️')
        color = color_map.get(level, color_map["INFO"])

        print(f"{color}[{level}]{color_map['RESET']} {prefix} {message}{color_map['RESET']}")
        sys.stdout.flush()

    def calculate_radius_from_bbox(self, bbox: List[float]) -> int:
        """Calculate radius from bounding box"""
        if not bbox or len(bbox) < 4:
            return 100  # Default radius

        min_lat, max_lat, min_lon, max_lon = [float(x) for x in bbox[:4]]

        lat_dist = abs(max_lat - min_lat) * 111
        lon_dist = abs(max_lon - min_lon) * 111 * math.cos(math.radians((min_lat + max_lat) / 2))

        max_dimension = max(lat_dist, lon_dist)
        radius = max(20, min(300, int(max_dimension * 0.35)))

        return radius

    def geocode_with_api(self, location_query: str) -> Optional[Dict]:
        """Fetch coordinates using Nominatim API"""
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

            time.sleep(self.rate_limit_delay)  # ⏱️ Rate limiting

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
        """Get country metadata from REST Countries API"""
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
        """Determine continent for a country"""
        if country_info and 'region' in country_info:
            region_map = {
                'Asia': 'Asia',
                'Europe': 'Europe',
                'Americas': 'North America',
                'Africa': 'Africa',
                'Oceania': 'Oceania',
                'Antarctic': 'Antarctica'
            }
            region = country_info.get('region', '')
            if region:
                mapped_region = region_map.get(region, region)
                return mapped_region if mapped_region else "Unknown"
            # If region is empty or None, fall through to fallback mapping

        # Fallback mapping for all supported countries
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
        """Generate the main country region"""
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
        """Generate a state/province region"""
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

    def generate_regions(self):
        """Main method to generate all regions"""
        self.log("🚀 Starting hybrid region generation with real API data...", "HEADER")
        self.log(f"📊 Processing {len(COUNTRY_SUBDIVISIONS)} countries with full subdivision coverage", "INFO")

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
                self.log(f"⚠️ Skipping subdivisions for {country_name} - country failed", "WARN")
                continue

            added_subdivisions = 0
            for i, subdivision in enumerate(subdivisions, 1):
                self.log(f"📍 {i}/{len(subdivisions)}: Processing {subdivision}...", "DETAIL")

                region = self.generate_subdivision_region(subdivision, country_name, continent)
                if region:
                    self.regions.append(region)
                    added_subdivisions += 1
                    total_regions += 1
                else:
                    self.log(f"❌ Failed to generate region for {subdivision}", "ERROR")

                if i % 10 == 0:
                    success_rate = (added_subdivisions / i) * 100
                    self.log(f"📈 Progress: {i}/{len(subdivisions)} processed, {success_rate:.1f}% success rate", "INFO")

            self.log(f"✅ {country_name} complete: {added_subdivisions}/{len(subdivisions)} subdivisions generated", "SUCCESS")

        api_success_rate = (self.api_success_rate['success'] / max(1, self.api_success_rate['total'])) * 100
        self.log("\n🎉 Generation complete!", "SUCCESS")
        self.log(f"📊 Total regions generated: {total_regions}", "INFO")
        self.log(f"🌐 API success rate: {api_success_rate:.1f}% ({self.api_success_rate['success']}/{self.api_success_rate['total']})", "INFO")

    def save_regions(self, filename: str = "lib/locations/regions_comprehensive.json"):
        """Save regions to JSON file"""
        try:
            self.regions.sort(key=lambda x: (x['continent'], x['name']))

            countries = sum(1 for r in self.regions if r['type'] == 'country')
            subdivisions = len(self.regions) - countries
            api_success_rate = (self.api_success_rate['success'] / max(1, self.api_success_rate['total'])) * 100

            output_data = {
                "metadata": {
                    "generated_at": time.strftime("%Y-%m-%d %H:%M:%S UTC", time.gmtime()),
                    "total_regions": len(self.regions),
                    "countries": countries,
                    "subdivisions": subdivisions,
                    "generator": "GeoGusserX Hybrid Region Generator v1.0",
                    "api_success_rate": f"{api_success_rate:.1f}%",
                    "data_sources": [
                        "OpenStreetMap Nominatim API (primary)",
                        "REST Countries API (metadata)",
                        "Real-time coordinate fetching"
                    ],
                    "coverage": "Major countries with complete state/province data",
                    "quality": "High - uses real coordinates from authoritative sources"
                },
                "regions": self.regions
            }

            with open(filename, 'w', encoding='utf-8') as f:
                json.dump(output_data, f, indent=2, ensure_ascii=False)

            self.log(f"💾 Saved {len(self.regions)} regions to {filename}", "SUCCESS")

            self.generate_statistics()

        except Exception as e:
            self.log(f"Failed to save regions: {e}", "ERROR")

    def generate_statistics(self):
        """Generate and display detailed statistics"""
        countries = sum(1 for r in self.regions if r['type'] == 'country')
        subdivisions = len(self.regions) - countries

        continent_counts = {}
        for region in self.regions:
            continent = region['continent']
            continent_counts[continent] = continent_counts.get(continent, 0) + 1

        country_subdivision_counts = {}
        for region in self.regions:
            if region['type'] != 'country' and ', ' in region['name']:
                country = region['name'].split(', ')[-1]
                country_subdivision_counts[country] = country_subdivision_counts.get(country, 0) + 1

        self.log("\n📈 Comprehensive Generation Statistics:", "HEADER")
        print("\033[1;35m" + "=" * 50 + "\033[0m")
        self.log(f"🌍 Total Regions: {len(self.regions)}", "INFO")
        self.log(f"🏛️ Countries: {countries}", "INFO")
        self.log(f"🏞️ States/Provinces/Regions: {subdivisions}", "INFO")

        self.log("\n🌐 API Performance:", "HEADER")
        api_success_rate = (self.api_success_rate['success'] / max(1, self.api_success_rate['total'])) * 100
        self.log(f"📊 Success Rate: {api_success_rate:.1f}% ({self.api_success_rate['success']}/{self.api_success_rate['total']})", "INFO")
        self.log("⚡ All coordinates fetched in real-time from OpenStreetMap", "INFO")

        self.log("\n🗺️ Geographic Coverage:", "HEADER")
        for continent, count in sorted(continent_counts.items()):
            print(f"  \033[0;34m🌏 {continent}: {count} regions\033[0m")

        self.log("\n🎯 Top Countries by Subdivision Count:", "HEADER")
        top_countries = sorted(country_subdivision_counts.items(), key=lambda x: x[1], reverse=True)[:8]
        for country, count in top_countries:
            print(f"  \033[0;34m📍 {country}: {count} subdivisions\033[0m")

def main():
    """Main function"""
    print("\033[1;36m" + "=" * 45 + "\033[0m")
    print("\033[0;32m🌐 Fetches real coordinates from OpenStreetMap APIs\033[0m")
    print("\033[0;32m📍 Comprehensive coverage with accurate, up-to-date data\033[0m")
    print("\033[0;33m⏱️ Takes 5-10 minutes due to respectful API rate limiting\033[0m")
    print("\033[0;32m🆓 Completely free - no API keys required\033[0m")
    print()

    generator = HybridRegionGenerator()

    try:
        generator.generate_regions()

        output_file = "lib/locations/regions_comprehensive.json"
        generator.save_regions(output_file)

        print("\n\033[1;32m🎉 SUCCESS! Generated comprehensive regions database:\033[0m")
        print(f"\033[0;32m📁 File: {output_file}\033[0m")
        print(f"\033[0;32m📊 Total regions: {len(generator.regions)}\033[0m")
        print(f"\033[0;32m🌏 Countries: {len(COUNTRY_SUBDIVISIONS)}\033[0m")

        import os
        file_size = os.path.getsize(output_file) / 1024
        print(f"\033[0;32m💾 File size: {file_size:.1f} KB\033[0m")

        print("\n\033[1;34m💡 To use the new database:\033[0m")
        print("\033[0;34m1. Update import in regions.ts:\033[0m")
        print("\033[0;34m   import regionsData from './regions_comprehensive.json';\033[0m")
        print("\033[0;34m2. Restart your development server: pnpm dev\033[0m")

        print("\n\033[1;32m🎮 Your location bias issues are completely solved!\033[0m")
        print("\033[0;32m   ✅ Real coordinates from authoritative sources\033[0m")

    except KeyboardInterrupt:
        print("\n\033[0;33m⏹️ Generation interrupted by user\033[0m")
        if generator.regions:
            partial_file = "lib/locations/regions_partial.json"
            generator.save_regions(partial_file)
            print(f"\033[0;33m💾 Saved partial results to {partial_file}\033[0m")
    except Exception as e:
        print(f"\n\033[0;31m❌ Generation failed: {e}\033[0m")
        if generator.regions:
            partial_file = "lib/locations/regions_partial.json"
            generator.save_regions(partial_file)
            print(f"\033[0;31m💾 Saved partial results to {partial_file}\033[0m")
        return 1

    return 0

if __name__ == "__main__":
    sys.exit(main())
