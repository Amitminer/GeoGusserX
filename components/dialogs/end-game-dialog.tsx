'use client';

/**
 * End Game Confirmation Dialog - prevents accidental game exits
 */

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Home, AlertTriangle, X } from 'lucide-react';

/**
 * Props for the `EndGameDialog` component.
 */
interface EndGameDialogProps {
  /** A callback function to end the current game. */
  onEndGame: () => void;
  /** Whether the button should be disabled. */
  disabled?: boolean;
}

/**
 * A dialog component that shows a confirmation before ending the current game.
 * Prevents accidental game exits by requiring user confirmation.
 */
export function EndGameDialog({ onEndGame, disabled = false }: EndGameDialogProps) {
  const [isOpen, setIsOpen] = useState(false);

  /**
   * Handles the confirmation to end the game.
   */
  const handleConfirmEndGame = () => {
    setIsOpen(false);
    onEndGame();
  };

  /**
   * Handles canceling the end game action.
   */
  const handleCancel = () => {
    setIsOpen(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
          <Button
            variant="outline"
            size="sm"
            disabled={disabled}
            className="flex items-center gap-1 sm:gap-2 bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm border-gray-300/50 dark:border-gray-600/50 hover:bg-red-50 dark:hover:bg-red-900/20 hover:border-red-300 dark:hover:border-red-600 transition-all duration-200 px-2 sm:px-3 py-1.5 flex-shrink-0"
          >
            <Home className="w-3 h-3 sm:w-4 sm:h-4" />
            <span className="hidden md:inline font-medium text-xs sm:text-sm whitespace-nowrap">End Game</span>
          </Button>
        </motion.div>
      </DialogTrigger>

      <DialogContent className="sm:max-w-md bg-white/95 dark:bg-gray-900/95 backdrop-blur-md border border-gray-200/50 dark:border-gray-700/50">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <motion.div
              animate={{ scale: [1, 1.1, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="w-6 h-6 bg-gradient-to-r from-red-500 to-orange-500 rounded-full flex items-center justify-center"
            >
              <AlertTriangle className="w-3 h-3 text-white" />
            </motion.div>
            End Current Game?
          </DialogTitle>
          <DialogDescription className="text-gray-600 dark:text-gray-300">
            Are you sure you want to end your current game and return to the homepage? 
            Your progress will be saved and you can view your final results.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col sm:flex-row gap-3 mt-6">
          <motion.div
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="flex-1"
          >
            <Button
              onClick={handleCancel}
              variant="outline"
              className="w-full flex items-center gap-2 border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500 bg-white/50 dark:bg-gray-800/50"
            >
              <X className="w-4 h-4" />
              Cancel
            </Button>
          </motion.div>
          
          <motion.div
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="flex-1"
          >
            <Button
              onClick={handleConfirmEndGame}
              className="w-full flex items-center gap-2 bg-gradient-to-r from-red-500 to-orange-500 hover:from-red-600 hover:to-orange-600 text-white"
            >
              <Home className="w-4 h-4" />
              End Game
            </Button>
          </motion.div>
        </div>

        <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
          <div className="flex items-center gap-2 mb-1">
            <AlertTriangle className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            <span className="text-sm font-medium text-blue-700 dark:text-blue-300">
              What happens next?
            </span>
          </div>
          <ul className="text-xs text-blue-600 dark:text-blue-400 space-y-1 ml-6">
            <li>• Your current game progress will be saved</li>
            <li>• You&apos;ll see your final score and statistics</li>
            <li>• You can start a new game anytime</li>
          </ul>
        </div>
      </DialogContent>
    </Dialog>
  );
}