'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { PageLayout } from '@/components/ui/page-layout';
import { GameModeCard } from '@/components/config/game-mode-card';
import { SettingsCard } from '@/components/config/settings-card';
import { useGameStore } from '@/lib/storage/store';
import { GameMode } from '@/lib/types';
import { Settings, ArrowLeft, Play } from 'lucide-react';
import Link from 'next/link';

const gameModes = [
  {
    mode: '4-rounds' as GameMode,
    title: 'Quick Game',
    description: 'Perfect for a quick geography challenge during breaks',
    rounds: '4 Rounds',
    estimatedTime: '~10 min',
    color: 'from-green-500 to-emerald-600',
    icon: 'Play' as const
  },
  {
    mode: '5-rounds' as GameMode,
    title: 'Classic',
    description: 'The traditional GeoGuessr experience with balanced gameplay',
    rounds: '5 Rounds',
    estimatedTime: '~15 min',
    color: 'from-blue-500 to-cyan-600',
    icon: 'MapPin' as const
  },
  {
    mode: '8-rounds' as GameMode,
    title: 'Extended',
    description: 'For serious geography enthusiasts who want more challenge',
    rounds: '8 Rounds',
    estimatedTime: '~25 min',
    color: 'from-purple-500 to-violet-600',
    icon: 'Trophy' as const
  },
  {
    mode: 'infinite' as GameMode,
    title: 'Infinite',
    description: 'Keep playing until you want to stop - endless exploration',
    rounds: '∞ Rounds',
    estimatedTime: 'Unlimited',
    color: 'from-orange-500 to-red-600',
    icon: 'InfinityIcon' as const
  }
];

export default function ConfigPage() {
  const router = useRouter();
  const { 
    countrySettings, 
    gameSettings, 
    updateCountrySettings, 
    updateGameSettings,
    startNewGame 
  } = useGameStore();
  
  const [selectedMode, setSelectedMode] = useState<GameMode | null>(
    () => gameSettings.preferredGameMode
  );
  const [isStarting, setIsStarting] = useState(false);

  // Update selected mode when game settings change
  useEffect(() => {
    if (gameSettings.preferredGameMode && selectedMode !== gameSettings.preferredGameMode) {
      setSelectedMode(gameSettings.preferredGameMode);
    }
  }, [gameSettings.preferredGameMode, selectedMode]);

  const handleModeSelect = (mode: GameMode) => {
    setSelectedMode(mode);
    updateGameSettings({ ...gameSettings, preferredGameMode: mode });
  };

  const handleStartGame = async () => {
    if (!selectedMode) return;
    
    setIsStarting(true);
    try {
      await startNewGame(selectedMode);
      router.push('/play');
    } catch (error) {
      console.error('Failed to start game:', error);
      setIsStarting(false);
    }
  };

  return (
    <PageLayout>
      <div className="relative">
        {/* Background decorative elements */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-400/10 rounded-full blur-3xl"></div>
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-400/10 rounded-full blur-3xl"></div>
        </div>

        <div className="container mx-auto px-4 py-6 sm:py-8 relative z-10">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8 sm:mb-12"
          >
            <div className="flex items-center gap-3 sm:gap-4">
              <motion.div 
                className="w-12 h-12 sm:w-14 sm:h-14 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg"
                whileHover={{ rotate: 360, scale: 1.1 }}
                transition={{ duration: 0.6 }}
              >
                <Settings className="w-6 h-6 sm:w-7 sm:h-7 text-white" />
              </motion.div>
              <div>
                <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent dark:from-gray-200 dark:to-gray-400">
                  Game Configuration
                </h1>
                <p className="text-gray-600 dark:text-gray-400 text-sm sm:text-base lg:text-lg">
                  Customize your GeoGusserX experience
                </p>
              </div>
            </div>
            
            <Link href="/">
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Button
                  variant="outline"
                  size="sm"
                  className="flex items-center gap-2 border-2 border-gray-300 dark:border-gray-600 hover:border-blue-400 dark:hover:border-blue-500 bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm text-sm sm:text-base"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span className="hidden sm:inline">Back to Home</span>
                  <span className="sm:hidden">Back</span>
                </Button>
              </motion.div>
            </Link>
          </motion.div>

          <div className="max-w-6xl mx-auto space-y-8 sm:space-y-12">
            {/* Game Mode Selection */}
            <motion.section
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              <div className="mb-6 sm:mb-8 text-center">
                <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-800 dark:text-gray-200 mb-2 sm:mb-3">
                  Choose Your Game Mode
                </h2>
                <p className="text-gray-600 dark:text-gray-400 text-sm sm:text-base lg:text-lg max-w-2xl mx-auto px-4">
                  Select the perfect game mode that matches your available time and desired challenge level
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                {gameModes.map((mode, index) => (
                  <motion.div
                    key={mode.mode}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 + index * 0.1 }}
                  >
                    <GameModeCard
                      mode={mode}
                      isSelected={selectedMode === mode.mode}
                      onSelect={handleModeSelect}
                    />
                  </motion.div>
                ))}
              </div>
            </motion.section>

            {/* Settings Section */}
            <motion.section
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
            >
              <div className="mb-6 sm:mb-8 text-center">
                <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-800 dark:text-gray-200 mb-2 sm:mb-3">
                  Game Settings
                </h2>
                <p className="text-gray-600 dark:text-gray-400 text-sm sm:text-base lg:text-lg max-w-2xl mx-auto px-4">
                  Fine-tune your gameplay experience with these customization options
                </p>
              </div>

              <div className="max-w-2xl mx-auto px-2 sm:px-0">
                <SettingsCard
                  countrySettings={countrySettings}
                  gameSettings={gameSettings}
                  onCountrySettingsChange={updateCountrySettings}
                  onGameSettingsChange={updateGameSettings}
                />
              </div>
            </motion.section>

            {/* Start Game Section */}
            <motion.section
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8 }}
              className="text-center py-6 sm:py-8"
            >
              <div className="max-w-md mx-auto px-4">
                <motion.div
                  whileHover={{ scale: selectedMode ? 1.05 : 1 }}
                  whileTap={{ scale: selectedMode ? 0.95 : 1 }}
                >
                  <Button
                    onClick={handleStartGame}
                    disabled={!selectedMode || isStarting}
                    size="lg"
                    className={`w-full py-3 sm:py-4 text-base sm:text-lg font-semibold shadow-xl transition-all duration-300 ${
                      selectedMode && !isStarting
                        ? 'bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 hover:shadow-2xl text-white'
                        : 'bg-gray-300 dark:bg-gray-700 text-gray-500 dark:text-gray-400 cursor-not-allowed'
                    }`}
                  >
                    {isStarting ? (
                      <div className="flex items-center gap-2">
                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        Starting Game...
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <Play className="w-5 h-5" />
                        {selectedMode ? `Start ${gameModes.find(m => m.mode === selectedMode)?.title}` : 'Select a Game Mode'}
                      </div>
                    )}
                  </Button>
                </motion.div>
                
                {!selectedMode && (
                  <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 1 }}
                    className="text-sm text-gray-500 dark:text-gray-400 mt-3"
                  >
                    Please select a game mode above to continue
                  </motion.p>
                )}
              </div>
            </motion.section>
          </div>
        </div>
      </div>
    </PageLayout>
  );
}