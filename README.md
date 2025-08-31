# 🌍 GeoGusserX

A modern, production-ready GeoGuessr clone built with Next.js, TypeScript,
and Google Maps API. Test your geography knowledge by guessing locations from
Street View images around the world!

![GeoGusserX Screenshot](./public/screenshot.png)

## ✨ Features

### 🎮 Core Gameplay

- **Multiple Game Modes**: 4, 5, 8 rounds, and infinite mode
- **Street View Integration**: High-quality Google Street View panoramas
- **Interactive Guessing**: Click on the world map to place your guess
- **Smart Scoring System**: Distance-based scoring (0-5000 points per round)
- **Real-time Results**: Instant feedback with detailed round analysis

### 🎨 Modern UI/UX

- **Responsive Design**: Seamless experience across mobile, tablet, and desktop
- **Dark Theme Support**: Automatic dark/light theme switching
- **Smooth Animations**: Framer Motion powered transitions
- **Glass Morphism**: Modern design elements with backdrop blur effects
- **Accessible Components**: Built with Radix UI primitives

### 🚀 Technical Excellence

- **TypeScript**: Full type safety throughout the application
- **Next.js 15**: Latest App Router with server components
- **Tailwind CSS**: Utility-first styling with custom design system
- **IndexedDB Storage**: Persistent game state and statistics
- **Custom Logging**: Production-ready logging system
- **Performance Optimized**: Lazy loading and code splitting

### 📊 Advanced Features

- **Game Statistics**: Track your performance over time
- **Results Visualization**: Interactive maps showing guess vs actual location
- **Progressive Web App**: Install on mobile devices
- **Offline Support**: Basic functionality works without internet
- **Share Results**: Share your achievements on social media

## 🛠️ Tech Stack

- **Framework**: Next.js 15 with App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS with custom design system
- **UI Components**: Radix UI primitives
- **Animations**: Framer Motion
- **Maps**: Google Maps JavaScript API
- **State Management**: Zustand
- **Storage**: IndexedDB with idb wrapper
- **Package Manager**: pnpm
- **Build Tool**: Turbopack (development)

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- pnpm (recommended) or npm
- Google Maps API key

### Installation

1. **Clone the repository**

   ```bash
   git clone https://github.com/Amitminer/GeoGusserX.git
   cd GeoGusserX
   ```

2. **Install dependencies**

   ```bash
   pnpm install
   ```

3. **Set up environment variables**

   ```bash
   cp .env.local.example .env.local
   ```

   Edit `.env.local` and add your Google Maps API key:

   ```env
   NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your_api_key_here
   ```

4. **Run the development server**

   ```bash
   pnpm dev
   ```

5. **Open your browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

### Google Maps API Setup

1. Go to the [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable the following APIs:
   - Maps JavaScript API
   - Street View Static API
   - Places API (optional, for enhanced location search)
4. Create credentials (API key)
5. Restrict the API key to your domain for security

## 🎯 Game Modes

| Mode | Rounds | Description |
|------|--------|-------------|
| **Quick Game** | 4 | Perfect for a quick geography challenge |
| **Classic** | 5 | The traditional GeoGuessr experience |
| **Extended** | 8 | For serious geography enthusiasts |
| **Infinite** | ∞ | Keep playing until you want to stop |

## 🏆 Scoring System

The scoring system is based on the distance between your guess and the actual location:

- **5000 points**: Perfect guess (0km distance)
- **4000+ points**: Excellent (< 25km)
- **3000+ points**: Great (< 200km)
- **2000+ points**: Good (< 750km)
- **1000+ points**: Okay (< 2500km)
- **0 points**: Maximum distance (20000km+)

## 📱 Progressive Web App

GeoGusserX can be installed as a PWA on mobile devices:

1. Open the app in your mobile browser
2. Tap the "Add to Home Screen" option
3. Enjoy the native app experience!

## 🔧 Development

### Project Structure

```text
geogusserx/
├── app/                    # Next.js App Router
│   ├── globals.css        # Global styles and design system
│   ├── layout.tsx         # Root layout with metadata
│   └── page.tsx           # Home page
├── components/            # React components
│   ├── ui/               # Reusable UI components
│   ├── game.tsx          # Main game orchestrator
│   ├── street-view.tsx   # Street View component
│   ├── guess-map.tsx     # Interactive guessing map
│   └── ...               # Other game components
├── lib/                  # Utility libraries
│   ├── types.ts          # TypeScript type definitions
│   ├── utils.ts          # Utility functions
│   ├── maps.ts           # Google Maps integration
│   ├── storage.ts        # IndexedDB storage manager
│   ├── store.ts          # Zustand state management
│   └── logger.ts         # Custom logging system
└── public/               # Static assets
```

### Available Scripts

```bash
# Development
pnpm dev          # Start development server
pnpm build        # Build for production
pnpm start        # Start production server
pnpm lint         # Run ESLint
pnpm type-check   # Run TypeScript compiler

# Package management
pnpm install      # Install dependencies
pnpm update       # Update dependencies
```

### Code Quality

The project follows strict code quality standards:

- **TypeScript**: Full type safety with strict mode
- **ESLint**: Code linting with Next.js recommended rules
- **Prettier**: Code formatting (if configured)
- **Conventional Commits**: Standardized commit messages

## 🌐 Deployment

### Vercel (Recommended)

1. Push your code to GitHub
2. Connect your repository to Vercel
3. Add environment variables in Vercel dashboard
4. Deploy automatically on every push

### Other Platforms

The app can be deployed to any platform that supports Next.js:

- **Netlify**: Static export or server-side rendering
- **Railway**: Full-stack deployment
- **DigitalOcean**: App Platform or Droplets
- **AWS**: Amplify, EC2, or Lambda

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guide](CONTRIBUTING.md)
for details.

### Development Workflow

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Make your changes
4. Add tests if applicable
5. Commit your changes: `git commit -m 'Add amazing feature'`
6. Push to the branch: `git push origin feature/amazing-feature`
7. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE)
file for details.

## 🙏 Acknowledgments

- **Google Maps**: For providing the Street View and Maps APIs
- **GeoGuessr**: For inspiring this educational geography game
- **Next.js Team**: For the amazing React framework
- **Vercel**: For the excellent deployment platform
- **Open Source Community**: For the incredible tools and libraries

## 📞 Support

- **Documentation**: Check our [Wiki](https://github.com/Amitminer/GeoGusserX/wiki)
- **Issues**: Report bugs on [GitHub Issues](https://github.com/Amitminer/GeoGusserX/issues)
- **Discussions**: Join our [GitHub Discussions](https://github.com/Amitminer/GeoGusserX/discussions)

---

Made with ❤️ by the GeoGusserX Team

[⭐ Star us on GitHub](https://github.com/Amitminer/GeoGusserX) •
[🌍 Visit Website](https://geogusserx.com)
