'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CountrySelection } from '@/components/country-selection';
import { CountrySettings, UserGameSettings } from '@/lib/types';
import { Eye, EyeOff, MapPin, Settings, Compass, Plane } from 'lucide-react';

interface SettingsCardProps {
  countrySettings: CountrySettings;
  gameSettings: UserGameSettings;
  onCountrySettingsChange: (settings: CountrySettings) => void;
  onGameSettingsChange: (settings: UserGameSettings) => void;
}

export function SettingsCard({
  countrySettings,
  gameSettings,
  onCountrySettingsChange,
  onGameSettingsChange
}: SettingsCardProps) {
  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Country Settings */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <Card className="border-2 border-blue-200/50 dark:border-blue-700/50 bg-gradient-to-br from-blue-50/80 to-cyan-50/80 dark:from-blue-900/40 dark:to-cyan-900/40 backdrop-blur-sm shadow-xl rounded-2xl overflow-hidden">
          <CardHeader className="pb-3 sm:pb-6">
            <CardTitle className="flex items-center gap-2 sm:gap-3">
              <motion.div 
                className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-r from-blue-500 via-cyan-500 to-teal-500 rounded-xl flex items-center justify-center text-white shadow-lg"
                whileHover={{ 
                  rotate: [0, -10, 10, -10, 0],
                  scale: [1, 1.1, 1]
                }}
                transition={{ duration: 0.8 }}
              >
                <Compass className="w-4 h-4 sm:w-5 sm:h-5" />
              </motion.div>
              <div className="min-w-0 flex-1">
                <div className="text-base sm:text-lg font-semibold bg-gradient-to-r from-blue-600 to-cyan-600 dark:from-blue-400 dark:to-cyan-400 bg-clip-text text-transparent">
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

      {/* Game Settings */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <Card className="border-2 border-purple-200/50 dark:border-purple-700/50 bg-gradient-to-br from-purple-50/80 to-pink-50/80 dark:from-purple-900/40 dark:to-pink-900/40 backdrop-blur-sm shadow-xl rounded-2xl overflow-hidden">
          <CardHeader className="pb-3 sm:pb-6">
            <CardTitle className="flex items-center gap-2 sm:gap-3">
              <motion.div 
                className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-r from-purple-500 via-pink-500 to-rose-500 rounded-xl flex items-center justify-center text-white shadow-lg"
                whileHover={{ 
                  rotate: [0, 180, 360],
                  scale: [1, 1.2, 1]
                }}
                transition={{ duration: 0.8 }}
              >
                <Settings className="w-4 h-4 sm:w-5 sm:h-5" />
              </motion.div>
              <div className="min-w-0 flex-1">
                <div className="text-base sm:text-lg font-semibold bg-gradient-to-r from-purple-600 to-pink-600 dark:from-purple-400 dark:to-pink-400 bg-clip-text text-transparent">
                  🎮 Explorer Settings
                </div>
                <div className="text-xs sm:text-sm text-purple-600/70 dark:text-purple-400/70">
                  🎆 Customize your adventure experience
                </div>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {/* Country Name Visibility Toggle */}
            <motion.div
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="cursor-pointer p-3 sm:p-4 rounded-xl bg-gray-50/50 dark:bg-gray-700/50 border border-gray-200/50 dark:border-gray-600/50 hover:border-blue-300 dark:hover:border-blue-600 transition-all duration-300"
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
                
                {/* Custom Toggle Switch */}
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