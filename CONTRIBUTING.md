# Contributing to GeoGusserX

Thanks for wanting to contribute! This is a fun side project, so let's keep it simple.

## 🚀 Getting Started

### What you need
- Node.js 18+
- Bun (recommended) or Node.js
- Google Maps API key for testing

### Setup

1. **Fork and clone**
   ```bash
   git clone https://github.com/Amitminer/GeoGusserX.git
   cd GeoGusserX
   ```

2. **Install stuff**
   ```bash
   bun install
   ```

3. **Environment setup**
   ```bash
   cp .env.local.example .env.local
   # Add your Google Maps API key to .env.local
   ```

4. **Start developing**
   ```bash
   bun dev
   ```

## 📝 Code Guidelines

Keep it simple:
- Use TypeScript
- Follow the existing patterns
- Don't overcomplicate things
- Add comments for tricky parts

## 🔧 Available Commands

```bash
bun dev          # Start development server
bun run build    # Build for production
bun start        # Start production server
bun run lint     # Check code style
bun run lint:fix # Fix code style issues
```

## 🐛 Found a Bug?

Just create an issue with:
- What happened
- What you expected
- Steps to reproduce
- Your browser/OS

## 💡 Want to Add Something?

1. Fork the repo
2. Create a branch: `git checkout -b cool-feature`
3. Make your changes
4. Test it works: `bun run build`
5. Push and create a PR

## 📁 Project Structure

```
GeoGusserX/
├── app/           # Next.js pages
├── components/    # React components
├── lib/           # Utilities and logic
├── public/        # Static files
└── ...
```

## 🎯 What Needs Help

- Bug fixes
- Mobile improvements
- Performance optimizations
- Better error handling
- Code cleanup

## ⚠️ What This Project Is

This is a fun side project I made when bored. Don't expect:
- Regular updates
- Multiplayer features
- Enterprise-level architecture
- 24/7 support

But do expect:
- Help if you're stuck
- Friendly code reviews
- Appreciation for contributions

## 🤝 Getting Help

Stuck? Create a PR anyway and mention what's not working. I'll help you figure it out!

## 📄 License

MIT - do whatever you want with it.

---

Thanks for contributing! 🌍
