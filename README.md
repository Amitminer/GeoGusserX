# 🌍 **GeoGusserX**

GeoGusserX is a modern, single-player geography guessing game built with Next.js and Google Maps Street View. Explore random global locations, analyze your surroundings, and make guesses on an interactive map.

---

## 🔗 **Live Demo**

> [!WARNING]
> **Demo Offline**: The live version is currently disabled because Google Maps API keys have been deactivated (billing limits). If you want to play, please set up and run the project locally using your own keys.

---

## 📸 **Screenshots**

<div align="center">

### 🏠 Homepage

![Homepage](./public/screenshots/homepage.png)
*Modern homepage with game modes and features*

### ⚙️ Configuration

![Config Page](./public/screenshots/config-page.png)
*Customize your game settings and preferences*

### 🗺️ Gameplay

![Gameplay](./public/screenshots/gameplay.png)
*Explore Street View & guess the location*

### 📊 Round Results

![Round Complete](./public/screenshots/round-complete.png)
*Score breakdown after each round*

### 🏆 Final Results

![Final Results](./public/screenshots/final-results.png)
*Complete game statistics and performance*

</div>



## ✅ **Features**

|  |  |
|:--|:--|
| 🕹️ **Multiple Game Modes** | Quick (4 rounds), Classic (5), Extended (8), Endless |
| 🌐 **Google Street View** | Real, immersive exploration anywhere on Earth |
| 📏 **Distance-based Scoring** | Up to 5000 points for perfect guesses |
| 🗺️ **Country Mode** | Focus your challenge within a single country |
| 🤖 **AI-Powered Hints** | Get strategic hints using Google Gemini AI (300 points) |
| 👁️ **Country Name Toggle** | Show/hide country names for difficulty control |
| 📱 **Responsive UI** | Looks great on desktop & mobile |
| 💾 **PWA Support** | Install & play as a standalone app |
| ⚡ **Fast Gameplay** | Minimal load times, smooth transitions |

## ⚙️ **Setup and Installation**

### Prerequisites
* **Bun** runtime installed (refer to the [Bun installation guide](https://bun.sh)).
* A Google Cloud Project with the **Maps JavaScript API** and **Street View Static API** enabled.
* A Gemini API key from [Google AI Studio](https://aistudio.google.com/app/apikey).

### Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/Amitminer/GeoGusserX.git
   cd GeoGusserX
   ```

2. **Install dependencies:**
   ```bash
   bun install
   ```

3. **Configure environment variables:**
   Copy the example environment file and fill in your API credentials:
   ```bash
   cp .env.local.example .env.local
   ```

4. **Start the development server:**
   ```bash
   bun run dev
   ```

Open **[http://localhost:3000](http://localhost:3000)** in your browser.

---

## 🎮 **How to Play**

1. **Look around** with Street View
2. **Use AI hints** if you're stuck (costs 300 points)
3. **Guess on the map** where you think you are
4. **Score points** based on distance
5. **Repeat for all rounds** & see your final score

### 🤖 **AI Hints System**

- **Cost:** 300 points per hint
- **Powered by:** Google Gemini AI
- **Strategic hints** about geography, culture, architecture, and more
- **Smart analysis** of your current Street View location
- **Strategic utilization:** Hints subtract from the overall round score but assist in identifying hard-to-locate areas.

---

## 📏 **Scoring**

* **Perfect (0 km)** → 5000 pts
* **Very Close (<25 km)** → 4000+ pts
* **Close (<200 km)** → 3000+ pts
* **Decent (<750 km)** → 2000+ pts
* **Far (<2500 km)** → 1000+ pts
* **Way Off (20,000+ km)** → 0 pts

---

## 🐳 **Docker Support**

Run with Docker:

```bash
docker-compose up --build
# OR
docker build -t geogusserx .
docker run -p 3000:3000 -e NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your_key geogusserx
```

---

## 🛠 **Tech Stack**

* **Frontend:** Next.js (App Router), TypeScript, TailwindCSS
* **Maps:** Google Maps JavaScript API + Street View
* **State:** React hooks + Context API

---

## 📚 **Documentation**

* **[Algorithm.md](Algorithm.md)** - Detailed documentation of our location generation algorithm, including cryptographic randomness, distribution strategies, and geographic calculations

---

## 📜 **License**

MIT – Free to use, modify, and share.

---
