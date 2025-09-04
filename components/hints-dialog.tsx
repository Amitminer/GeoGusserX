'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { geminiService, type SingleHintResponse } from '@/lib/ai';
import { useGameStore } from '@/lib/storage/store';
import { Location } from '@/lib/types';
import { logger } from '@/lib/logger';
import type { GeocodeResult } from '@/lib/maps/geocoding';
import { 
  Lightbulb, 
  Loader2, 
  Sparkles, 
  MapPin, 
  Globe, 
  Building, 
  Trees, 
  AlertCircle,
  Coins,
  Zap,
  TrendingDown,
  Eye,
  Target
} from 'lucide-react';

interface HintsDialogProps {
  location: Location;
  countryInfo?: GeocodeResult | null;
  disabled?: boolean;
}

interface HintWithCost {
  hint: SingleHintResponse;
  cost: number;
  timestamp: number;
}

const categoryIcons = {
  geographical: Globe,
  cultural: MapPin,
  architectural: Building,
  environmental: Trees,
  general: Lightbulb
};

const categoryColors = {
  geographical: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
  cultural: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300',
  architectural: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300',
  environmental: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
  general: 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300'
};

const difficultyColors = {
  easy: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
  medium: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300',
  hard: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300'
};

const HINT_COST = 300;

export function HintsDialog({ location, countryInfo, disabled = false }: HintsDialogProps) {
  const { currentGame, purchaseHint } = useGameStore();
  const [isOpen, setIsOpen] = useState(false);
  const [hints, setHints] = useState<HintWithCost[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const [totalCost, setTotalCost] = useState(0);

  // Initialize Gemini service
  useEffect(() => {
    const initializeService = async () => {
      try {
        if (!geminiService.isReady()) {
          await geminiService.initialize();
        }
        setIsInitialized(true);
        setError(null); // Clear any previous errors
      } catch (error) {
        logger.error('Failed to initialize Gemini service', error, 'HintsDialog');
        setError('AI hints service is not available. Please check your API configuration.');
        setIsInitialized(false);
      }
    };

    initializeService();
  }, []);

  // Reset hints when location changes
  useEffect(() => {
    setHints([]);
    setTotalCost(0);
    setError(null);
  }, [location]);

  const canAffordHint = () => {
    return currentGame && currentGame.totalScore >= HINT_COST;
  };

  const getNextHintNumber = () => {
    return hints.length + 1;
  };

  const generateHint = async () => {
    if (!currentGame || !isInitialized || !canAffordHint()) return;
    
    // Ensure we have country info before generating hint
    if (!countryInfo) {
      setError('Location information not available. Please wait for the map to load completely.');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const hintNumber = getNextHintNumber();
      logger.info('Requesting AI hint', { 
        location, 
        roundNumber: currentGame.currentRoundIndex + 1,
        hintNumber,
        cost: HINT_COST,
        country: countryInfo.country
      }, 'HintsDialog');

      const response = await geminiService.generateSingleHint({
        location,
        roundNumber: currentGame.currentRoundIndex + 1,
        gameMode: currentGame.mode,
        hintNumber,
        previousHints: hints.map(h => h.hint.hint),
        countryInfo: countryInfo
      });

      // Purchase the hint (this will deduct points and save the game)
      const purchaseSuccessful = await purchaseHint(HINT_COST);
      
      if (!purchaseSuccessful) {
        throw new Error('Failed to purchase hint - insufficient points or game error');
      }

      const newHint: HintWithCost = {
        hint: response,
        cost: HINT_COST,
        timestamp: Date.now()
      };

      setHints(prev => [...prev, newHint]);
      setTotalCost(prev => prev + HINT_COST);
      
      logger.info('Hint purchased', { 
        hintNumber,
        cost: HINT_COST,
        category: response.category,
        difficulty: response.difficulty,
        confidence: response.confidence,
        remainingScore: currentGame?.totalScore || 0
      }, 'HintsDialog');

    } catch (error: unknown) {
      logger.error('Failed to generate hint', error, 'HintsDialog');
      
      // Provide more specific error messages
      const errorMessage = getErrorMessage(error);
      
      setError(errorMessage);
    } finally {
      // Always ensure loading state is cleared
      setIsLoading(false);
    }
  };

  const getErrorMessage = (error: unknown): string => {
    const errorMessage = error instanceof Error ? error.message : String(error);
    
    if (errorMessage.includes('insufficient points')) {
      return 'Insufficient points to purchase this hint.';
    } else if (errorMessage.includes('UNKNOWN_ERROR') || errorMessage.includes('server error')) {
      return 'Service temporarily unavailable. Please wait a moment and try again.';
    } else if (errorMessage.includes('OVER_QUERY_LIMIT')) {
      return 'Too many requests. Please wait a moment before requesting another hint.';
    } else if (errorMessage.includes('API key')) {
      return 'AI service configuration error. Please check your API settings.';
    } else if (errorMessage.includes('network') || errorMessage.includes('fetch')) {
      return 'Network error. Please check your connection and try again.';
    }
    
    return 'Failed to generate hint. Please try again.';
  };

  const clearErrorAndRetry = () => {
    setError(null);
    generateHint();
  };

  const handleGenerateHint = () => {
    if (!currentGame || !isInitialized || !canAffordHint() || !countryInfo) return;
    generateHint();
  };

  const getDifficultyIcon = (difficulty: string) => {
    switch (difficulty) {
      case 'easy': return <Target className="w-3 h-3" />;
      case 'medium': return <Eye className="w-3 h-3" />;
      case 'hard': return <Zap className="w-3 h-3" />;
      default: return <Lightbulb className="w-3 h-3" />;
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <motion.div
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          <Button
            variant="outline"
            size="sm"
            disabled={disabled || !isInitialized}
            className={`
              flex items-center gap-2 bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm 
              border-gray-300/50 dark:border-gray-600/50 transition-all duration-200
              ${hints.length > 0
                ? 'hover:bg-amber-50 dark:hover:bg-amber-900/20 hover:border-amber-300 dark:hover:border-amber-600' 
                : 'hover:bg-blue-50 dark:hover:bg-blue-900/20 hover:border-blue-300 dark:hover:border-blue-600'
              }
            `}
          >
            <motion.div
              animate={hints.length > 0 ? { rotate: [0, 10, -10, 0] } : {}}
              transition={{ duration: 0.5 }}
            >
              {hints.length > 0 ? (
                <Sparkles className="w-4 h-4 text-amber-500" />
              ) : (
                <Lightbulb className="w-4 h-4" />
              )}
            </motion.div>
            <span className="hidden sm:inline font-medium">
              {hints.length > 0 ? `Hints (${hints.length})` : 'Get Hint'}
            </span>
            {hints.length > 0 && (
              <Badge variant="secondary" className="text-xs">
                -{totalCost}
              </Badge>
            )}
          </Button>
        </motion.div>
      </DialogTrigger>

      <DialogContent className="sm:max-w-md max-h-[80vh] flex flex-col bg-white/95 dark:bg-gray-900/95 backdrop-blur-md border border-gray-200/50 dark:border-gray-700/50">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <motion.div
              animate={{ rotate: [0, 360] }}
              transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
              className="w-6 h-6 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center"
            >
              <Zap className="w-3 h-3 text-white" />
            </motion.div>
            Strategic AI Hints
            <Badge variant="secondary" className="ml-auto bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300">
              <Coins className="w-3 h-3 mr-1" />
              300 pts each
            </Badge>
          </DialogTitle>
          <DialogDescription>
            Get AI-powered hints to help you identify the location. Each hint costs 300 points and provides specific, observable clues about what you can see in Street View.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 flex-1 overflow-hidden flex flex-col">
          {/* Score Warning */}
          {currentGame && !canAffordHint() && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-3 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800"
            >
              <div className="flex items-center gap-2 mb-1">
                <TrendingDown className="w-4 h-4 text-red-600 dark:text-red-400" />
                <span className="text-sm font-medium text-red-700 dark:text-red-300">
                  Insufficient Score
                </span>
              </div>
              <p className="text-xs text-red-600 dark:text-red-400">
                You need at least 300 points to purchase a hint. Current score: {currentGame.totalScore}
              </p>
            </motion.div>
          )}

          {/* Current Score Display */}
          {currentGame && (
            <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
              <div className="flex items-center gap-2">
                <Coins className="w-4 h-4 text-amber-500" />
                <span className="text-sm font-medium">Current Score</span>
              </div>
              <span className="text-lg font-bold text-amber-600 dark:text-amber-400">
                {currentGame.totalScore.toLocaleString()}
              </span>
            </div>
          )}

          {/* Hints Display */}
          {hints.length > 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex-1 overflow-hidden flex flex-col"
            >
              <div className="flex items-center justify-between mb-3 flex-shrink-0">
                <span className="text-sm font-medium">Your Hints ({hints.length})</span>
                <span className="text-xs text-gray-500">
                  Total Cost: -{totalCost} pts
                </span>
              </div>

              <div className="flex-1 overflow-y-auto space-y-3 pr-2">
                <AnimatePresence>
                  {hints.map((hintWithCost, index) => {
                    const CategoryIcon = categoryIcons[hintWithCost.hint.category];
                    return (
                      <motion.div
                        key={index}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className="p-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm flex-shrink-0"
                      >
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <div className="w-6 h-6 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center">
                              <span className="text-xs font-bold text-blue-600 dark:text-blue-400">
                                {index + 1}
                              </span>
                            </div>
                            <Badge 
                              variant="secondary" 
                              className={`${categoryColors[hintWithCost.hint.category]} text-xs`}
                            >
                              <CategoryIcon className="w-3 h-3 mr-1" />
                              {hintWithCost.hint.category}
                            </Badge>
                            <Badge 
                              variant="secondary" 
                              className={`${difficultyColors[hintWithCost.hint.difficulty]} text-xs`}
                            >
                              {getDifficultyIcon(hintWithCost.hint.difficulty)}
                              {hintWithCost.hint.difficulty}
                            </Badge>
                          </div>
                          <span className="text-xs text-red-500 font-medium">-{hintWithCost.cost}</span>
                        </div>
                        
                        <p className="text-sm leading-relaxed text-gray-700 dark:text-gray-300 mb-2">
                          {hintWithCost.hint.hint}
                        </p>
                        
                        <div className="flex items-center justify-between text-xs text-gray-500">
                          <span>Confidence: {Math.round(hintWithCost.hint.confidence * 100)}%</span>
                          <span>{new Date(hintWithCost.timestamp).toLocaleTimeString()}</span>
                        </div>
                      </motion.div>
                    );
                  })}
                </AnimatePresence>
              </div>
            </motion.div>
          )}

          {/* Loading State */}
          {isLoading && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.2 }}
              className="flex flex-col items-center justify-center py-8 text-center bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-lg border border-blue-200/50 dark:border-blue-700/50"
            >
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
              >
                <Loader2 className="w-8 h-8 text-blue-500 mb-3" />
              </motion.div>
              <h3 className="font-medium mb-2 text-blue-900 dark:text-blue-100">Analyzing Location...</h3>
              <p className="text-sm text-blue-700 dark:text-blue-300">
                AI is examining Street View details and location data to craft a strategic hint worth 300 points
              </p>
            </motion.div>
          )}

          {/* Error State */}
          {error && !isLoading && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="flex flex-col items-center justify-center py-6 text-center bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200/50 dark:border-red-700/50"
            >
              <AlertCircle className="w-8 h-8 text-red-500 mb-3" />
              <h3 className="font-medium mb-2 text-red-600 dark:text-red-400">
                Unable to Generate Hint
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                {error}
              </p>
              <Button
                onClick={clearErrorAndRetry}
                variant="outline"
                size="sm"
                className="flex items-center gap-2"
                disabled={!canAffordHint() || !countryInfo || isLoading}
              >
                <Sparkles className="w-4 h-4" />
                Try Again
              </Button>
            </motion.div>
          )}

          {/* Get Hint Button */}
          {!isLoading && !error && isInitialized && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.1 }}
              className="space-y-3 flex-shrink-0"
            >
              <Button
                onClick={handleGenerateHint}
                disabled={!canAffordHint() || !countryInfo}
                className={`w-full ${
                  canAffordHint() && countryInfo
                    ? 'bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white' 
                    : 'bg-gray-300 dark:bg-gray-700 text-gray-500 cursor-not-allowed'
                }`}
              >
                <Sparkles className="w-4 h-4 mr-2" />
                Get Hint #{getNextHintNumber()} (-300 pts)
              </Button>
              
              {!countryInfo && (
                <p className="text-xs text-amber-600 dark:text-amber-400 text-center">
                  Waiting for location information to load...
                </p>
              )}
              
              <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                <div className="flex items-center gap-2 mb-2">
                  <Lightbulb className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                  <span className="text-sm font-medium text-blue-700 dark:text-blue-300">
                    Strategic Hints
                  </span>
                </div>
                <p className="text-xs text-blue-600 dark:text-blue-400">
                  Each hint costs 300 points and focuses on observable details in Street View. Hints become more specific with each purchase!
                </p>
              </div>
            </motion.div>
          )}

          {/* Service Not Available */}
          {!isInitialized && !isLoading && !error && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-6 flex-shrink-0 bg-gray-50 dark:bg-gray-800/50 rounded-lg border border-gray-200/50 dark:border-gray-700/50"
            >
              <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-3" />
              <h3 className="font-medium mb-2 text-gray-600 dark:text-gray-400">
                AI Hints Unavailable
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-500">
                The AI hints service is not configured. Please check your API settings.
              </p>
            </motion.div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}