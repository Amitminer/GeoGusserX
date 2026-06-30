"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Heart } from "lucide-react";
import { SiGithub } from "react-icons/si";

/**
 * A presentational component that displays the footer for the homepage.
 * It includes a link to the project's GitHub repository and a copyright notice.
 */
export function Footer() {
  const [currentYear, setCurrentYear] = useState<number | null>(null);

  /**
   * This effect ensures that the current year is up-to-date.
   */
  useEffect(() => {
    queueMicrotask(() => {
      setCurrentYear(new Date().getFullYear());
    });
  }, []);

  return (
    <footer className="relative py-8 sm:py-12 px-4 sm:px-6 border-t border-white/10 overflow-hidden">
      {/* Decorative background elements that add a subtle glow effect. */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute bottom-0 left-1/4 w-64 h-32 bg-purple-600/5 rounded-full blur-2xl"></div>
        <div className="absolute bottom-0 right-1/4 w-48 h-24 bg-cyan-600/5 rounded-full blur-2xl"></div>
      </div>

      <div className="absolute top-0 left-0 w-full h-0.5 bg-gradient-to-r from-purple-500 via-cyan-500 to-pink-500 opacity-60"></div>

      <div className="container mx-auto relative z-10">
        {/* Internal navigation links for SEO */}
        <div className="mb-8 flex flex-wrap justify-center gap-6 text-sm">
          <Link 
            href="/" 
            className="text-gray-400 hover:text-cyan-400 transition-colors duration-300 font-medium"
          >
            Home
          </Link>
          <Link 
            href="/config" 
            className="text-gray-400 hover:text-cyan-400 transition-colors duration-300 font-medium"
          >
            Play Game
          </Link>
          <Link 
            href="https://github.com/Amitminer/GeoGusserX#readme" 
            target="_blank"
            rel="noopener noreferrer"
            className="text-gray-400 hover:text-cyan-400 transition-colors duration-300 font-medium"
          >
            About
          </Link>
          <Link 
            href="https://github.com/Amitminer/GeoGusserX/blob/main/CONTRIBUTING.md" 
            target="_blank"
            rel="noopener noreferrer"
            className="text-gray-400 hover:text-cyan-400 transition-colors duration-300 font-medium"
          >
            Contribute
          </Link>
        </div>

        <div className="text-center text-sm text-gray-400 space-y-4">
          {/* A link to the project's source code on GitHub. */}
          <div className="flex justify-center items-center">
            <a
              href="https://github.com/Amitminer/GeoGusserX"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center space-x-1 hover:text-cyan-400 transition-colors duration-300 group"
            >
              <SiGithub className="w-4 h-4 group-hover:rotate-12 transition-transform" />
              <span>View on GitHub</span>
            </a>
          </div>

          <div className="flex justify-center space-x-2">
            <div className="w-1 h-1 bg-purple-400 rounded-full animate-pulse"></div>
            <div className="w-1 h-1 bg-cyan-400 rounded-full animate-pulse" style={{ animationDelay: "0.5s" }}></div>
            <div className="w-1 h-1 bg-pink-400 rounded-full animate-pulse" style={{ animationDelay: "1s" }}></div>
          </div>

          <div className="flex justify-center items-center flex-wrap gap-2 text-gray-400">
            <span>Made with</span>
            <Heart className="w-4 h-4 text-[#FF1493] animate-pulse" />
            <span>and</span>
            <span className="text-blue-400 font-semibold">Next.js</span>
          </div>

          {/* The copyright notice, which automatically updates to the current year. */}
          <div className="pt-2 text-gray-500 font-semibold text-sm sm:text-base">
            © {currentYear || 2026} GeoGusserX · A fun geography game 🌍
          </div>
        </div>
      </div>
    </footer>
  );
}