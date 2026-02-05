'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Globe, MapPin, Trophy, Zap } from 'lucide-react';

/**
 * An array of objects that define the features to be displayed on the homepage.
 * Each object contains the feature's title, description, icon, and color.
 */
const features = [
  {
    title: 'Explore the World',
    description: 'Journey to random locations across the globe, from bustling cities to remote landscapes.',
    icon: Globe,
    color: 'from-blue-500 to-cyan-500'
  },
  {
    title: 'Pinpoint Your Guess',
    description: 'Use the interactive map to place your guess as close as possible to the actual location.',
    icon: MapPin,
    color: 'from-green-500 to-emerald-500'
  },
  {
    title: 'Score Big',
    description: 'The closer your guess, the more points you earn. Compete for the highest score!',
    icon: Trophy,
    color: 'from-yellow-500 to-amber-500'
  },
  {
    title: 'Use Strategic Hints',
    description: 'Stuck? Use AI-powered hints to get clues about your surroundings and improve your score.',
    icon: Zap,
    color: 'from-purple-500 to-violet-500'
  }
];

/**
 * A component that displays a section of key features on the homepage.
 * It uses a grid of cards to present the features in a visually appealing way.
 */
export function FeaturesSection() {
  return (
    <section className="container mx-auto px-4 py-16 relative z-10">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-100px" }}
        transition={{ duration: 0.4, ease: "easeOut" }}
      >
        <div className="text-center mb-12">
          <h2 className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-gray-800 via-gray-700 to-gray-800 dark:from-gray-100 dark:via-gray-200 dark:to-gray-100 bg-clip-text text-transparent">
            How to Play the Geography Guessing Game
          </h2>
          <p className="mt-4 text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
            Test your world geography knowledge with this location guessing challenge.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((feature, index) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ duration: 0.3, delay: index * 0.1, ease: "easeOut" }}
            >
              <Card className="h-full bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-2 border-gray-200/50 dark:border-gray-700/50 hover:border-blue-300 dark:hover:border-blue-600 transition-all duration-300 shadow-lg hover:shadow-xl rounded-2xl overflow-hidden group">
                <CardHeader className="pb-4">
                  <CardTitle className="flex items-center gap-3">
                    <div className={`w-12 h-12 bg-gradient-to-r ${feature.color} rounded-xl flex items-center justify-center text-white shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                      <feature.icon className="w-6 h-6" />
                    </div>
                    <span className="text-lg font-semibold text-gray-800 dark:text-gray-200">{feature.title}</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed">
                    {feature.description}
                  </p>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </motion.div>
    </section>
  );
}