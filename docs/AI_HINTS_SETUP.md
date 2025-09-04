# AI Hints Feature Setup Guide

The AI Hints feature uses Google's Gemini AI to provide intelligent, contextual hints to players during the game. This guide will help you set up and configure the feature.

## 🚀 Features

- **Intelligent Hint Generation**: AI analyzes the current location and provides helpful geographical, cultural, architectural, and environmental clues
- **Progressive Difficulty**: Hints start broad and get more specific to help players learn
- **Multiple Categories**: Hints cover geography, culture, architecture, environment, and general observations
- **Responsive UI**: Beautiful, animated dialog with loading states and error handling
- **Confidence Scoring**: AI provides confidence levels for its analysis
- **Refresh Capability**: Players can request new hints if needed

## 🔧 Setup Instructions

### 1. Get a Gemini API Key

1. Go to [Google AI Studio](https://aistudio.google.com/)
2. Sign in with your Google account
3. Click "Get API Key" in the left sidebar
4. Create a new API key or use an existing one
5. Copy the API key

### 2. Configure Environment Variables

Add your Gemini API key to your `.env.local` file:

```bash
# AI Features
NEXT_PUBLIC_GEMINI_API_KEY=your_actual_gemini_api_key_here
```

**Important**: Make sure to replace `your_actual_gemini_api_key_here` with your real API key.

### 3. Verify Installation

The required dependencies are already installed:
- `@google/generative-ai` - Official Gemini AI library

## 🎮 How to Use

1. **Start a Game**: Begin any game mode (4-rounds, 5-rounds, 8-rounds, or infinite)
2. **Click Hints Button**: Look for the lightbulb icon in the game header
3. **Get AI Analysis**: The AI will analyze the current Street View location
4. **Read Hints**: Review the generated hints to help identify the location
5. **Refresh if Needed**: Click the refresh button to get different hints

## 🧠 How It Works

### Hint Categories

The AI generates hints in several categories:

- **🌍 Geographical**: Climate, terrain, hemisphere, latitude clues
- **🏛️ Cultural**: Language, customs, cultural practices visible in the area
- **🏗️ Architectural**: Building styles, urban planning, infrastructure
- **🌿 Environmental**: Vegetation, weather patterns, natural features
- **💡 General**: Mixed observations and deductive clues

### AI Prompt Engineering

The system uses carefully crafted prompts that:
- Analyze coordinates without revealing exact location
- Provide educational and actionable hints
- Encourage observation and deduction
- Avoid giving away the answer directly
- Consider what's typically visible in Street View

### Error Handling

The system includes robust error handling:
- **Fallback Hints**: If AI fails, geographical hints based on coordinates are provided
- **Retry Mechanism**: Users can retry if hint generation fails
- **Graceful Degradation**: Game continues normally even if AI hints are unavailable

## 🔒 Privacy & Security

- **Client-Side Processing**: API calls are made from the browser
- **No Location Storage**: Coordinates are only sent to Gemini for analysis
- **Rate Limiting**: Gemini API has built-in rate limiting
- **Error Logging**: Errors are logged locally for debugging

## 🎨 UI Components

### HintsDialog Component

The main UI component includes:
- **Animated Loading States**: Smooth transitions and loading indicators
- **Category Badges**: Visual indicators for hint categories
- **Confidence Display**: Shows AI confidence in the analysis
- **Responsive Design**: Works on desktop and mobile
- **Accessibility**: Proper ARIA labels and keyboard navigation

### Integration Points

- **Game Header**: Hints button appears during active gameplay
- **Game State**: Integrates with existing game store and state management
- **Logging**: Uses existing logger for performance tracking and debugging

## 🛠️ Customization

### Modifying Hint Generation

To customize hint behavior, edit `lib/ai/gemini-service.ts`:

```typescript
// Adjust AI model parameters
generationConfig: {
  temperature: 0.7,    // Creativity (0.0-1.0)
  topP: 0.8,          // Nucleus sampling
  topK: 40,           // Top-k sampling
  maxOutputTokens: 1024, // Response length
}
```

### Adding New Hint Categories

1. Update the `HintResponse` interface in `lib/ai/gemini-service.ts`
2. Add new category to `categoryIcons` and `categoryColors` in `components/hints-dialog.tsx`
3. Update the AI prompt to include new category instructions

### Styling Customization

The hints dialog uses Tailwind CSS classes and can be customized by modifying:
- `components/hints-dialog.tsx` - Main dialog styling
- `components/ui/dialog.tsx` - Base dialog component
- `components/ui/badge.tsx` - Category badge styling

## 📊 Performance Considerations

- **Caching**: Consider implementing hint caching for repeated locations
- **Rate Limiting**: Gemini API has usage limits - monitor your usage
- **Loading States**: Hints generation typically takes 2-5 seconds
- **Error Recovery**: Fallback hints ensure feature always works

## 🐛 Troubleshooting

### Common Issues

1. **\"AI hints service is not available\"**
   - Check that `NEXT_PUBLIC_GEMINI_API_KEY` is set correctly
   - Verify the API key is valid and has proper permissions

2. **\"Failed to generate hints\"**
   - Check your internet connection
   - Verify you haven't exceeded API rate limits
   - Check browser console for detailed error messages

3. **Hints seem irrelevant**
   - This can happen with very remote or unusual locations
   - Try refreshing hints for alternative analysis
   - Fallback hints will be more generic but still helpful

### Debug Mode

Enable detailed logging by checking the browser console. The system logs:
- Hint generation timing
- API response details
- Error messages with context
- Performance metrics

## 🚀 Future Enhancements

Potential improvements for the AI hints feature:

- **Hint History**: Track and avoid repeating hints across rounds
- **Difficulty Scaling**: Adjust hint specificity based on game difficulty
- **Multi-Language Support**: Generate hints in different languages
- **Image Analysis**: Use AI to analyze Street View images directly
- **Collaborative Hints**: Allow players to rate hint quality
- **Offline Mode**: Cache common geographical hints for offline play

## 📝 API Usage Guidelines

- **Responsible Usage**: Don't abuse the API with excessive requests
- **Cost Monitoring**: Monitor your Gemini API usage and costs
- **Content Policy**: Ensure generated content follows Google's AI policies
- **Rate Limiting**: Implement client-side rate limiting if needed

---

The AI Hints feature enhances the educational value of GeoGusserX by helping players learn about geography, culture, and world landmarks through intelligent, contextual clues. Enjoy exploring the world with AI assistance! 🌍✨