'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ResultsMap } from '@/components/results-map';
import { GuessResult } from '@/lib/types';
import { formatDistance, formatScore } from '@/lib/utils';
import { Trophy, MapPin, Target, ArrowRight } from 'lucide-react';

interface RoundResultsProps {
  result: GuessResult;
  roundNumber: number;
  onNextRound: () => void;
  isLastRound: boolean;
}

export function RoundResults({ result, roundNumber, onNextRound, isLastRound }: RoundResultsProps) {
  const getScoreColor = (score: number) => {
    if (score >= 4000) return 'text-green-500';
    if (score >= 2500) return 'text-yellow-500';
    if (score >= 1000) return 'text-orange-500';
    return 'text-red-500';
  };

  const getScoreMessage = (score: number) => {
    if (score >= 4500) return 'Incredible! 🎯';
    if (score >= 3500) return 'Excellent! 🌟';
    if (score >= 2500) return 'Great job! 👏';
    if (score >= 1500) return 'Good guess! 👍';
    if (score >= 500) return 'Not bad! 🤔';
    return 'Better luck next time! 💪';
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50"
    >
      <motion.div
        initial={{ y: 50 }}
        animate={{ y: 0 }}
        className="bg-white dark:bg-gray-900 rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden"
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-500 to-purple-600 text-white p-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold">Round {roundNumber} Results</h2>
              <p className="text-blue-100 mt-1">{getScoreMessage(result.score)}</p>
            </div>
            <div className="text-right">
              <div className={`text-3xl font-bold ${getScoreColor(result.score)} text-white`}>
                {formatScore(result.score)}
              </div>
              <div className="text-blue-100 text-sm">points</div>
            </div>
          </div>
        </div>

        <div className="p-6 space-y-6">
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Target className="w-4 h-4" />
                  Distance
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatDistance(result.distance)}</div>
                <div className="text-xs text-gray-500 mt-1">from actual location</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Trophy className="w-4 h-4" />
                  Score
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className={`text-2xl font-bold ${getScoreColor(result.score)}`}>
                  {formatScore(result.score)}
                </div>
                <div className="text-xs text-gray-500 mt-1">out of 5,000</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <MapPin className="w-4 h-4" />
                  Accuracy
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {((result.score / 5000) * 100).toFixed(1)}%
                </div>
                <div className="text-xs text-gray-500 mt-1">accuracy rating</div>
              </CardContent>
            </Card>
          </div>

          {/* Results Map */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Your Guess vs Actual Location</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="h-64 md:h-80">
                <ResultsMap
                  actualLocation={result.actualLocation}
                  guessedLocation={result.guessedLocation}
                />
              </div>
            </CardContent>
          </Card>

          {/* Action Button */}
          <div className="flex justify-center pt-4">
            <Button
              onClick={onNextRound}
              size="lg"
              className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white px-8"
            >
              {isLastRound ? (
                <>
                  View Final Results
                  <Trophy className="w-5 h-5 ml-2" />
                </>
              ) : (
                <>
                  Next Round
                  <ArrowRight className="w-5 h-5 ml-2" />
                </>
              )}
            </Button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}