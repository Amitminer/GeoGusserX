import type { Metadata } from "next";
import { Analytics } from '@vercel/analytics/next';
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ToastSystem } from "@/components/toast-provider";
import { OrientationLock } from "@/components/orientation-lock";

/**
 * Initializes the Geist Sans font, which is used as the primary font for the application.
 * The `variable` option exposes it as a CSS variable for easy use throughout the app.
 */
const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

/**
 * Initializes the Geist Mono font, used for monospaced text elements.
 */
const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

/**
 * The metadata object for the application, which is used by Next.js to generate
 * the appropriate meta tags for SEO and social media sharing.
 */
export const metadata: Metadata = {
  title: "GeoGusserX - Geography Game | Guess Locations from Street View",
  description: "Test your geography skills with GeoGusserX! Guess locations from Street View images across 32 countries and 858+ regions. Play now!",
  keywords: ["geography game", "geoguessr", "street view game", "location guessing", "world map game", "geography quiz", "travel game", "educational game", "32 countries", "geography challenge"],
  authors: [{ name: "Amit" }],
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'),
  alternates: {
    canonical: '/',
  },
  openGraph: {
    title: "GeoGusserX - Geography Game | Guess Locations from Street View",
    description: "Test your geography skills with GeoGusserX! Guess locations from Street View images across 32 countries and 858+ regions. Play now!",
    url: "/",
    siteName: "GeoGusserX",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "GeoGusserX - Geography Guessing Game",
      },
    ],
    locale: "en_US",
    type: "website",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  verification: {
    google: process.env.NEXT_PUBLIC_GOOGLE_VERIFICATION,
  },
  category: 'games',
};

/**
 * The root layout for the entire application. It sets up the basic HTML structure,
 * including the `head` and `body` tags, and wraps the content in necessary providers.
 *
 * @param children The child components to be rendered within the layout.
 */
export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* Basic meta tags and links for the application. */}
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <link rel="icon" href="/icon.svg" type="image/svg+xml" />
        {/*<link rel="apple-touch-icon" href="/apple-touch-icon.png" />*/}
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#3b82f6" />
        <meta name="color-scheme" content="light dark" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        
        {/* Preconnecting to these domains can speed up the loading of Google Maps and Street View. */}
        <link rel="preconnect" href="https://maps.googleapis.com" />
        <link rel="preconnect" href="https://streetviewpixels-pa.googleapis.com" />
        <link rel="dns-prefetch" href="https://maps.gstatic.com" />
        
        {/* Schema.org structured data for SEO */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'WebApplication',
              name: 'GeoGusserX',
              description: 'Test your geography skills with GeoGusserX! Guess locations from Street View images across 32 countries and 858+ regions.',
              url: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
              applicationCategory: 'GameApplication',
              author: {
                '@type': 'Person',
                name: 'AmitxD',
              },
            }),
          }}
        />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
        suppressHydrationWarning
      >
        {/* The `OrientationLock` component encourages users on mobile devices to use landscape mode for a better experience. */}
        <OrientationLock>
          {children}
        </OrientationLock>
        {/* The `ToastSystem` is a global provider for displaying toast notifications. */}
        <ToastSystem />
        <Analytics />
      </body>
    </html>
  );
}
