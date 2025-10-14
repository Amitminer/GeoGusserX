'use client';

/**
 * Mobile 3-dot Menu - compact access to Help and End Game on small screens
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
import { MoreVertical, HelpCircle, Home, X } from 'lucide-react';

/**
 * Props for the `MobileMenu` component.
 */
interface MobileMenuProps {
  /** A callback function to end the current game. */
  onEndGame?: () => void;
  /** A callback function to show help. */
  onShowHelp?: () => void;
  /** Whether the menu should be disabled. */
  disabled?: boolean;
}

/**
 * A mobile-friendly menu component that shows Help and End Game options
 * in a compact 3-dot menu format for smaller screens.
 */
export function MobileMenu({ onEndGame, onShowHelp, disabled = false }: MobileMenuProps) {
  const [isOpen, setIsOpen] = useState(false);

  const handleHelpClick = () => {
    setIsOpen(false);
    const helpButton = document.querySelector('[data-help-trigger] button');
    if (helpButton) {
      (helpButton as HTMLElement).click();
    }
  };

  const handleEndGameClick = () => {
    setIsOpen(false);
    const endGameButton = document.querySelector('[data-end-game-trigger] button');
    if (endGameButton) {
      (endGameButton as HTMLElement).click();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
          <Button
            variant="outline"
            size="sm"
            disabled={disabled}
            className="flex items-center gap-1 bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm border-gray-300/50 dark:border-gray-600/50 hover:bg-gray-50 dark:hover:bg-gray-700/50 hover:border-gray-400 dark:hover:border-gray-500 transition-all duration-200 px-2 py-1.5 flex-shrink-0"
          >
            <MoreVertical className="w-4 h-4" />
          </Button>
        </motion.div>
      </DialogTrigger>

      <DialogContent className="sm:max-w-xs bg-white/95 dark:bg-gray-900/95 backdrop-blur-md border border-gray-200/50 dark:border-gray-700/50">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <motion.div
              animate={{ rotate: [0, 180, 360] }}
              transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
              className="w-5 h-5 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center"
            >
              <MoreVertical className="w-2.5 h-2.5 text-white" />
            </motion.div>
            Game Options
          </DialogTitle>
          <DialogDescription>
            Quick access to game controls and help.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 mt-4">
          {/* Help Option */}
          {onShowHelp && (
            <motion.div
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="w-full"
            >
              <Button
                variant="outline"
                className="w-full flex items-center gap-3 justify-start p-4 h-auto border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20"
                onClick={handleHelpClick}
              >
                <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
                  <HelpCircle className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                </div>
                <div className="text-left">
                  <div className="font-medium text-gray-900 dark:text-gray-100">Help & FAQ</div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">Game rules and tips</div>
                </div>
              </Button>
            </motion.div>
          )}

          {/* End Game Option */}
          {onEndGame && (
            <motion.div
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="w-full"
            >
              <Button
                variant="outline"
                className="w-full flex items-center gap-3 justify-start p-4 h-auto border-gray-200 dark:border-gray-700 hover:border-red-300 dark:hover:border-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
                onClick={handleEndGameClick}
              >
                <div className="w-8 h-8 bg-red-100 dark:bg-red-900/30 rounded-lg flex items-center justify-center">
                  <Home className="w-4 h-4 text-red-600 dark:text-red-400" />
                </div>
                <div className="text-left">
                  <div className="font-medium text-gray-900 dark:text-gray-100">End Game</div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">Return to homepage</div>
                </div>
              </Button>
            </motion.div>
          )}

          {/* Close Button */}
          <motion.div
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="w-full pt-2 border-t border-gray-200 dark:border-gray-700"
          >
            <Button
              variant="ghost"
              className="w-full flex items-center gap-2 justify-center text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
              onClick={() => setIsOpen(false)}
            >
              <X className="w-4 h-4" />
              Close
            </Button>
          </motion.div>
        </div>
      </DialogContent>
    </Dialog>
  );
}