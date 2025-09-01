# Google Maps Setup Guide

This guide will help you set up Google Maps API with Advanced Markers support for GeoGusserX-lite.

## Prerequisites

1. A Google Cloud Platform account
2. A project with billing enabled
3. Google Maps JavaScript API enabled

## Step 1: Get Your Google Maps API Key

1. Go to the [Google Cloud Console](https://console.cloud.google.com/)
2. Select your project or create a new one
3. Navigate to **APIs & Services** > **Credentials**
4. Click **Create Credentials** > **API Key**
5. Copy your API key

## Step 2: Create a Map ID (Required)

This application uses Advanced Markers exclusively, which require a Map ID to function. Here's how to create one:

1. Go to the [Google Cloud Console](https://console.cloud.google.com/)
2. Navigate to **Google Maps Platform** > **Map Management**
3. Click **Create Map ID**
4. Fill in the details:
   - **Map ID**: Choose a descriptive name (e.g., `geoguesser-map`)
   - **Description**: Brief description of your map
   - **Map type**: Select **JavaScript**
5. Click **Create**
6. Copy your Map ID

## Step 3: Configure Environment Variables

1. Copy `.env.local.example` to `.env.local`:
   ```bash
   cp .env.local.example .env.local
   ```

2. Edit `.env.local` and add your credentials:
   ```env
   NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your_actual_api_key_here
   NEXT_PUBLIC_GOOGLE_MAPS_MAP_ID=your_actual_map_id_here
   ```

## Step 4: Enable Required APIs

Make sure the following APIs are enabled in your Google Cloud project:

1. **Maps JavaScript API**
2. **Street View Static API** (if using static street view)
3. **Geocoding API** (if using geocoding features)

To enable APIs:
1. Go to **APIs & Services** > **Library**
2. Search for each API and click **Enable**

## Step 5: Configure API Key Restrictions (Recommended)

For security, restrict your API key:

1. Go to **APIs & Services** > **Credentials**
2. Click on your API key
3. Under **Application restrictions**:
   - Select **HTTP referrers (web sites)**
   - Add your domain(s): `localhost:3000/*`, `yourdomain.com/*`
4. Under **API restrictions**:
   - Select **Restrict key**
   - Choose the APIs you enabled above

## Troubleshooting

### Advanced Markers Not Working

If you see warnings about Advanced Markers not working:

1. **Check Map ID**: Ensure `NEXT_PUBLIC_GOOGLE_MAPS_MAP_ID` is set correctly
2. **Verify Map ID**: Make sure the Map ID exists in your Google Cloud project
3. **Check Console**: Look for JavaScript errors in the browser console

### Map ID Requirement

The application requires a Map ID to function:
- Advanced Markers are used exclusively throughout the application
- Without a Map ID, the application will not start and will show an error
- This ensures the best user experience with modern marker functionality

### Common Issues

1. **API Key Not Working**: 
   - Check if the API key is correct
   - Verify the Maps JavaScript API is enabled
   - Check API key restrictions

2. **Map Not Loading**:
   - Check browser console for errors
   - Verify billing is enabled on your Google Cloud project
   - Ensure your domain is allowed in API key restrictions

3. **Street View Not Working**:
   - Enable Street View Static API
   - Check if Street View is available in your test locations

## Environment Variables Reference

| Variable | Required | Description |
|----------|----------|-------------|
| `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` | Yes | Your Google Maps API key |
| `NEXT_PUBLIC_GOOGLE_MAPS_MAP_ID` | Yes | Map ID required for Advanced Markers |

## Additional Resources

- [Google Maps JavaScript API Documentation](https://developers.google.com/maps/documentation/javascript)
- [Advanced Markers Documentation](https://developers.google.com/maps/documentation/javascript/advanced-markers)
- [Google Cloud Console](https://console.cloud.google.com/)