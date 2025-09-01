# Contributing to GeoGusserX

Thank you for your interest in contributing to GeoGusserX! We welcome
contributions from everyone.

## 🚀 Getting Started

### Prerequisites

- Node.js 18 or higher
- pnpm (recommended) or npm
- Git
- Google Maps API key (for testing)

### Development Setup

1. **Fork the repository**

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
   # Add your Google Maps API key to .env.local
   ```

4. **Start development server**

   ```bash
   pnpm dev
   ```

## 📝 Development Guidelines

### Code Style

- Use TypeScript for all new code
- Follow the existing code style and patterns
- Use meaningful variable and function names
- Add JSDoc comments for complex functions
- Keep components small and focused

### Commit Messages

We use [Conventional Commits](https://www.conventionalcommits.org/):

```text
type(scope): description

feat(maps): add new location algorithm
fix(ui): resolve mobile layout issue
docs(readme): update installation instructions
style(components): improve button styling
refactor(store): simplify state management
test(utils): add distance calculation tests
```

### Branch Naming

- `feature/description` - New features
- `fix/description` - Bug fixes
- `docs/description` - Documentation updates
- `refactor/description` - Code refactoring

## 🧪 Testing

### Running Tests

```bash
# Run all tests
pnpm test

# Run tests in watch mode
pnpm test:watch

# Run tests with coverage
pnpm test:coverage
```

### Writing Tests

- Write unit tests for utility functions
- Add integration tests for complex components
- Test error scenarios and edge cases
- Mock external dependencies (Google Maps API)

## 🐛 Bug Reports

When reporting bugs, please include:

1. **Description**: Clear description of the issue
2. **Steps to reproduce**: Detailed steps to reproduce the bug
3. **Expected behavior**: What should happen
4. **Actual behavior**: What actually happens
5. **Environment**: Browser, OS, device type
6. **Screenshots**: If applicable

Use our bug report template:

```markdown
**Bug Description**
A clear description of the bug.

**Steps to Reproduce**
1. Go to '...'
2. Click on '...'
3. See error

**Expected Behavior**
What you expected to happen.

**Screenshots**
Add screenshots if applicable.

**Environment**
- Browser: [e.g. Chrome 91]
- OS: [e.g. Windows 10]
- Device: [e.g. iPhone 12]
```

## 💡 Feature Requests

We welcome feature requests! Please:

1. Check if the feature already exists
2. Search existing issues for similar requests
3. Provide a clear use case
4. Explain the expected behavior
5. Consider the impact on existing users

## 🔧 Pull Request Process

1. **Create a feature branch**

   ```bash
   git checkout -b feature/amazing-feature
   ```

2. **Make your changes**
   - Follow the coding guidelines
   - Add tests if applicable
   - Update documentation

3. **Test your changes**

   ```bash
   pnpm test
   pnpm build
   ```

4. **Commit your changes**

   ```bash
   git commit -m "feat: add amazing feature"
   ```

5. **Push to your fork**

   ```bash
   git push origin feature/amazing-feature
   ```

6. **Create a Pull Request**
   - Use a clear title and description
   - Reference any related issues
   - Add screenshots for UI changes

### Pull Request Checklist

- [ ] Code follows the project's style guidelines
- [ ] Self-review of the code has been performed
- [ ] Code is commented, particularly in hard-to-understand areas
- [ ] Tests have been added for new functionality
- [ ] All tests pass locally
- [ ] Documentation has been updated if needed

## 🏗️ Project Structure

```text
geogusserx/
├── app/                    # Next.js App Router
├── components/            # React components
│   ├── ui/               # Reusable UI components
│   └── ...               # Feature components
├── lib/                  # Utility libraries
├── public/               # Static assets
├── docs/                 # Documentation
└── tests/                # Test files
```

## 🎯 Areas for Contribution

### High Priority

- [ ] Performance optimizations
- [ ] Mobile experience improvements
- [ ] Accessibility enhancements
- [ ] Test coverage improvements

### Medium Priority

- [ ] New game modes
- [ ] Statistics and analytics
- [ ] Social features
- [ ] Offline support

### Low Priority

- [ ] Themes and customization
- [ ] Advanced settings
- [ ] Export/import functionality
- [ ] Developer tools

## 📚 Resources

- [Next.js Documentation](https://nextjs.org/docs)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)
- [Google Maps API Documentation](https://developers.google.com/maps/documentation)
- [Framer Motion Documentation](https://www.framer.com/motion/)

## 🤝 Community

- **GitHub Discussions**: For questions and general discussion
- **GitHub Issues**: For bug reports and feature requests
- **Discord**: [Join our Discord server](https://discord.gg/geogusserx)
- **Twitter**: [@geogusserx](https://twitter.com/geogusserx)

## 📄 License

By contributing to GeoGusserX, you agree that your contributions will be
licensed under the MIT License.

## 🙏 Recognition

Contributors will be recognized in:

- README.md contributors section
- Release notes for significant contributions
- Special thanks in the app (for major features)

Thank you for contributing to GeoGusserX! 🌍
