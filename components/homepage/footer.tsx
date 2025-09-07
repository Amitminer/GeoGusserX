"use client";

import { useEffect, useState } from "react";
import { Heart } from "lucide-react";
import { SiGithub } from "react-icons/si";

export function Footer() {
  const [currentYear, setCurrentYear] = useState<number>(new Date().getFullYear());

  useEffect(() => {
    setCurrentYear(new Date().getFullYear());
  }, []);

  return (
    <footer className="relative py-8 sm:py-12 px-4 sm:px-6 border-t border-white/10 overflow-hidden">
      {/* Background glow */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute bottom-0 left-1/4 w-64 h-32 bg-purple-600/5 rounded-full blur-2xl"></div>
        <div className="absolute bottom-0 right-1/4 w-48 h-24 bg-cyan-600/5 rounded-full blur-2xl"></div>
      </div>

      {/* Top gradient line */}
      <div className="absolute top-0 left-0 w-full h-0.5 bg-gradient-to-r from-purple-500 via-cyan-500 to-pink-500 opacity-60"></div>

      <div className="container mx-auto relative z-10">
        <div className="text-center text-sm text-gray-400 space-y-4">
          {/* GitHub Link */}
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

          {/* Decorative dots */}
          <div className="flex justify-center space-x-2">
            <div className="w-1 h-1 bg-purple-400 rounded-full animate-pulse"></div>
            <div className="w-1 h-1 bg-cyan-400 rounded-full animate-pulse" style={{ animationDelay: "0.5s" }}></div>
            <div className="w-1 h-1 bg-pink-400 rounded-full animate-pulse" style={{ animationDelay: "1s" }}></div>
          </div>

          {/* Made with ❤️ + Next.js */}
          <div className="flex justify-center items-center flex-wrap gap-2 text-gray-400">
            <span>Made with</span>
            <Heart className="w-4 h-4 text-[#FF1493] animate-pulse" />
            <span>and</span>
            <span className="text-blue-400 font-semibold">Next.js</span>
          </div>

          {/* Final line */}
          <div className="pt-2 text-gray-500 font-semibold text-sm sm:text-base">
            © {currentYear} GeoGusserX · A fun geography game 🌍
          </div>
        </div>
      </div>
    </footer>
  );
}