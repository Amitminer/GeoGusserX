import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ToastSystem } from "@/components/toast-provider";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "GeoGusserX - Explore the World, One Guess at a Time",
  description: "A modern, production-ready GeoGuessr clone built with Next.js, TypeScript, and Google Maps. Test your geography knowledge by guessing locations from Street View images.",
  keywords: ["geography", "game", "geoguessr", "maps", "world", "travel", "education"],
  authors: [{ name: "GeoGusserX Team" }],
  creator: "GeoGusserX",
  publisher: "GeoGusserX",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'),
  openGraph: {
    title: "GeoGusserX - Explore the World, One Guess at a Time",
    description: "Test your geography knowledge with this modern GeoGuessr clone. Guess locations from Street View images and compete for the highest score!",
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
  twitter: {
    card: "summary_large_image",
    title: "GeoGusserX - Explore the World, One Guess at a Time",
    description: "Test your geography knowledge with this modern GeoGuessr clone. Guess locations from Street View images and compete for the highest score!",
    images: ["/og-image.png"],
    creator: "@geogusserx",
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

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <link rel="icon" href="/icon.svg" type="image/svg+xml" />
        {/*<link rel="apple-touch-icon" href="/apple-touch-icon.png" />*/}
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#3b82f6" />
        <meta name="color-scheme" content="light dark" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
        suppressHydrationWarning
      >
        {children}
        <ToastSystem />
      </body>
    </html>
  );
}