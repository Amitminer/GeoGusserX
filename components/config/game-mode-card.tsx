'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Play, MapPin, Trophy, Infinity as InfinityIcon } from 'lucide-react';
import { GameMode } from '@/lib/types';

interface GameModeCardProps {
  mode: {
    mode: GameMode;
    title: string;
    description: string;
    rounds: string;
    estimatedTime: string;
    color: string;
    icon: 'Play' | 'MapPin' | 'Trophy' | 'InfinityIcon';
  };
  isSelected: boolean;
  onSelect: (mode: GameMode) => void;
}

const iconMap = {
  Play,
  MapPin,
  Trophy,
  InfinityIcon,
} as const;

export function GameModeCard({ mode, isSelected, onSelect }: GameModeCardProps) {
  const IconComponent = iconMap[mode.icon];

  return (
    <motion.div
      whileHover={{ scale: 1.02, y: -4 }}
      whileTap={{ scale: 0.98 }}
      transition={{ type: "spring", stiffness: 300, damping: 20 }}
    >
      <Card
        className={`cursor-pointer transition-all duration-300 hover:shadow-xl border-2 ${
          isSelected
            ? 'ring-2 ring-blue-500 shadow-lg border-blue-300 bg-gradient-to-br from-blue-50/80 to-cyan-50/80 dark:from-blue-900/30 dark:to-cyan-900/30'
            : 'border-gray-200/50 dark:border-gray-700/50 hover:border-blue-200 dark:hover:border-blue-700 bg-gradient-to-br from-white/80 to-gray-50/80 dark:from-gray-800/80 dark:to-gray-900/80'
        } backdrop-blur-sm rounded-2xl overflow-hidden group hover:scale-[1.02] transform`}
        onClick={() => onSelect(mode.mode)}
      >
        <CardHeader className="pb-2 sm:pb-3">
          <CardTitle className="flex items-center gap-2 sm:gap-3 text-base sm:text-lg">
            <motion.div 
              className={`w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-r ${mode.color} rounded-xl flex items-center justify-center text-white shadow-lg group-hover:scale-110 transition-transform duration-300`}
              whileHover={{ rotate: 360 }}
              transition={{ duration: 0.6 }}
            >
              <IconComponent className="w-5 h-5 sm:w-6 sm:h-6" />
            </motion.div>
            <div className="min-w-0 flex-1">
              <div className="font-bold text-gray-800 dark:text-gray-200 text-sm sm:text-base">{mode.title}</div>
              <div className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 font-normal">
                {mode.rounds} • {mode.estimatedTime}
              </div>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-300 leading-relaxed">
            {mode.description}
          </p>
        </CardContent>
      </Card>
    </motion.div>
  );
}