'use client';

import React from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Globe, Play } from 'lucide-react';

export function CTASection() {
  return (
    <section className="container mx-auto px-4 py-16 relative z-10">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-100px" }}
        transition={{ duration: 0.4, ease: "easeOut" }}
        className="max-w-5xl mx-auto"
      >
        {/* Modern Card Design */}
        <div className="relative group">
          {/* Background with optimized effects */}
          <div className="absolute inset-0 bg-gradient-to-br from-white/90 via-white/80 to-white/70 dark:from-gray-800/90 dark:via-gray-800/80 dark:to-gray-800/70 rounded-3xl border border-white/30 dark:border-gray-700/40 shadow-xl"></div>
          
          {/* Simplified decorative elements */}
          <div className="absolute -top-4 -right-4 w-24 h-24 bg-gradient-to-br from-blue-400/15 to-purple-400/15 rounded-full blur-xl opacity-60"></div>
          <div className="absolute -bottom-4 -left-4 w-20 h-20 bg-gradient-to-br from-purple-400/15 to-pink-400/15 rounded-full blur-xl opacity-60"></div>
          
          {/* Content */}
          <div className="relative p-8 sm:p-12 text-center">
            {/* Icon */}
            <div className="inline-flex items-center justify-center w-16 h-16 mb-6 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl shadow-lg">
              <Globe className="w-8 h-8 text-white" />
            </div>
            
            {/* Title */}
            <h2 className="mb-4 text-3xl sm:text-4xl font-bold bg-gradient-to-r from-gray-800 via-gray-700 to-gray-800 dark:from-gray-100 dark:via-gray-200 dark:to-gray-100 bg-clip-text text-transparent">
              Ready to Explore the World?
            </h2>
            
            {/* Description */}
            <p className="mb-8 text-lg text-gray-600 dark:text-gray-300 font-light max-w-2xl mx-auto leading-relaxed">
              Embark on an epic geography adventure! Test your knowledge, discover new places, and compete for the highest score.
            </p>
            
            {/* Action Button */}
            <div className="flex justify-center">
              <Link href="/config">
                <Button 
                  size="lg" 
                  className="group bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white px-8 py-4 text-lg font-semibold shadow-lg hover:shadow-xl transition-all duration-200 rounded-xl"
                >
                  <Play className="w-5 h-5 mr-3 transition-transform group-hover:scale-110" />
                  Start Your Adventure
                </Button>
              </Link>
            </div>
            
            {/* Feature highlights */}
            <div className="mt-8 flex flex-wrap justify-center gap-6 text-sm text-gray-500 dark:text-gray-400">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span>Free to Play</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                <span>Multiple Difficulty Levels</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                <span>Real Street View</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                <span>Instant Play</span>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </section>
  );
}