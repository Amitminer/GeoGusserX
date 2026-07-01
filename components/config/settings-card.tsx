'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CountrySelection } from '@/components/country-selection';
import { CountrySettings, UserGameSettings } from '@/lib/types';
import { Eye, EyeOff, Settings, Compass } from 'lucide-react';

/**
 * Props for the `SettingsCard` component.
 */
interface SettingsCardProps {
  /** The current settings for country selection. */
  countrySettings: CountrySettings;
  /** The current settings for the game. */
  gameSettings: UserGameSettings;
  /** A callback function that is triggered when the country settings are changed. */
  onCountrySettingsChange: (settings: CountrySettings) => void;
  /** A callback function that is triggered when the game settings are changed. */
  onGameSettingsChange: (settings: UserGameSettings) => void;
}

/**
 * A component that displays cards for configuring game and country settings.
 * It allows the player to customize their game experience before starting.
 */
export function SettingsCard({
  countrySettings,
  gameSettings,
  onCountrySettingsChange,
  onGameSettingsChange
}: SettingsCardProps) {
  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Card for configuring country-specific settings. */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <Card className="border-2 border-blue-200/60 dark:border-blue-800/40 bg-blue-50/40 dark:bg-blue-950/15 backdrop-blur-sm shadow-xl rounded-2xl overflow-hidden">
          <CardHeader className="pb-3 sm:pb-6">
            <CardTitle className="flex items-center gap-2 sm:gap-3">
              <motion.div 
                className="w-8 h-8 sm:w-10 sm:h-10 bg-blue-600 rounded-xl flex items-center justify-center text-white shadow-lg"
                whileHover={{ 
                  rotate: [0, -10, 10, -10, 0],
                  scale: [1, 1.1, 1]
                }}
                transition={{ duration: 0.8 }}
              >
                <Compass className="w-4 h-4 sm:w-5 sm:h-5" />
              </motion.div>
              <div className="min-w-0 flex-1">
                <div className="text-base sm:text-lg font-semibold text-blue-700 dark:text-blue-400">
                  🌍 Adventure Destinations
                </div>
                <div className="text-xs sm:text-sm text-blue-600/70 dark:text-blue-400/70">
                  ✈️ Pick your next exploration journey
                </div>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <CountrySelection
              countrySettings={countrySettings}
              onSettingsChange={onCountrySettingsChange}
            />
          </CardContent>
        </Card>
      </motion.div>

      {/* Card for configuring general game settings. */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <Card className="border-2 border-purple-200/60 dark:border-purple-800/40 bg-purple-50/40 dark:bg-purple-950/15 backdrop-blur-sm shadow-xl rounded-2xl overflow-hidden">
          <CardHeader className="pb-3 sm:pb-6">
            <CardTitle className="flex items-center gap-2 sm:gap-3">
              <motion.div 
                className="w-8 h-8 sm:w-10 sm:h-10 bg-purple-600 rounded-xl flex items-center justify-center text-white shadow-lg"
                whileHover={{ 
                  rotate: [0, 180, 360],
                  scale: [1, 1.2, 1]
                }}
                transition={{ duration: 0.8 }}
              >
                <Settings className="w-4 h-4 sm:w-5 sm:h-5" />
              </motion.div>
              <div className="min-w-0 flex-1">
                <div className="text-base sm:text-lg font-semibold text-purple-700 dark:text-purple-400">
                  🎮 Explorer Settings
                </div>
                <div className="text-xs sm:text-sm text-purple-600/70 dark:text-purple-400/70">
                  🎆 Customize your adventure experience
                </div>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {/* A toggle switch for showing or hiding country names during gameplay. */}
            <motion.div
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="cursor-pointer p-3 sm:p-4 rounded-xl bg-gray-50/50 dark:bg-gray-700/50 border border-gray-200/50 dark:border-gray-600/50 hover:border-emerald-500 dark:hover:border-emerald-600 transition-all duration-300"
              onClick={() => onGameSettingsChange({ ...gameSettings, showCountryName: !gameSettings.showCountryName })}
            >
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
                  <motion.div
                    animate={{ rotate: gameSettings.showCountryName ? 0 : 180 }}
                    transition={{ duration: 0.3 }}
                    className="flex-shrink-0"
                  >
                    {gameSettings.showCountryName ? (
                      <Eye className="w-4 h-4 sm:w-5 sm:h-5 text-green-500" />
                    ) : (
                      <EyeOff className="w-4 h-4 sm:w-5 sm:h-5 text-gray-500" />
                    )}
                  </motion.div>
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-gray-900 dark:text-gray-100 text-sm sm:text-base">
                      {gameSettings.showCountryName ? "Country Names Visible" : "Country Names Hidden"}
                    </p>
                    <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">
                      {gameSettings.showCountryName
                        ? "Easier mode - country names shown during gameplay"
                        : "Challenge mode - no country hints for extra difficulty"
                      }
                    </p>
                  </div>
                </div>
                
                {/* A custom-styled toggle switch for a more engaging user experience. */}
                <div
                  className={`relative inline-flex h-6 w-11 sm:h-8 sm:w-14 items-center rounded-full transition-colors duration-300 flex-shrink-0 ${
                    gameSettings.showCountryName
                      ? 'bg-green-500 shadow-lg'
                      : 'bg-gray-300 dark:bg-gray-600'
                  }`}
                >
                  <div
                    className={`h-4 w-4 sm:h-6 sm:w-6 transform rounded-full bg-white shadow-lg transition-transform duration-300 ease-in-out flex items-center justify-center ${
                      gameSettings.showCountryName 
                        ? 'translate-x-6 sm:translate-x-7' 
                        : 'translate-x-1'
                    }`}
                  >
                    {gameSettings.showCountryName ? (
                      <Eye className="w-2 h-2 sm:w-3 sm:h-3 text-green-600" />
                    ) : (
                      <EyeOff className="w-2 h-2 sm:w-3 sm:h-3 text-gray-500" />
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}