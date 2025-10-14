'use client';

/**
 * Help & FAQ Dialog - game rules and tips in accordion format
 */

import React from 'react';
import { motion } from 'framer-motion';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from '@/components/ui/dialog';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Button } from '@/components/ui/button';
import { HelpCircle, MapPin, Trophy, Lightbulb, Settings, Gamepad2 } from 'lucide-react';

/**
 * Props for the `HelpDialog` component.
 */
interface HelpDialogProps {
  /** Whether the help button should be disabled. */
  disabled?: boolean;
}

/**
 * A dialog component that displays help information and frequently asked questions
 * about the game using an accordion layout for easy navigation.
 */
export function HelpDialog({ disabled = false }: HelpDialogProps) {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
          <Button
            variant="outline"
            size="sm"
            disabled={disabled}
            className="flex items-center gap-1 sm:gap-2 bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm border-gray-300/50 dark:border-gray-600/50 hover:bg-blue-50 dark:hover:bg-blue-900/20 hover:border-blue-300 dark:hover:border-blue-600 transition-all duration-200 px-2 sm:px-3 py-1.5 flex-shrink-0"
          >
            <HelpCircle className="w-3 h-3 sm:w-4 sm:h-4" />
            <span className="hidden md:inline font-medium text-xs sm:text-sm whitespace-nowrap">
              Help
            </span>
          </Button>
        </motion.div>
      </DialogTrigger>

      <DialogContent className="sm:max-w-2xl max-h-[80vh] flex flex-col bg-white/95 dark:bg-gray-900/95 backdrop-blur-md border border-gray-200/50 dark:border-gray-700/50">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <motion.div
              animate={{ rotate: [0, 360] }}
              transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
              className="w-6 h-6 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center"
            >
              <HelpCircle className="w-3 h-3 text-white" />
            </motion.div>
            Game Help & FAQ
          </DialogTitle>
          <DialogDescription>
            Everything you need to know about playing GeoGusserX and mastering the art of geographic exploration.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
          <Accordion type="single" collapsible className="w-full space-y-2">
            <AccordionItem value="how-to-play" className="border border-gray-200 dark:border-gray-700 rounded-lg px-4">
              <AccordionTrigger className="hover:no-underline">
                <div className="flex items-center gap-2">
                  <Gamepad2 className="w-4 h-4 text-blue-500" />
                  How do I play GeoGusserX?
                </div>
              </AccordionTrigger>
              <AccordionContent className="text-sm text-gray-600 dark:text-gray-300 space-y-2">
                <p>GeoGusserX is a geography guessing game where you explore Street View locations and guess where you are on the map.</p>
                <ol className="list-decimal list-inside space-y-1 ml-2">
                  <li>Choose your game mode (4, 5, 8 rounds, or infinite)</li>
                  <li>Explore the Street View panorama by clicking and dragging</li>
                  <li>Look for clues like signs, architecture, vegetation, and license plates</li>
                  <li>Click on the map to make your guess</li>
                  <li>Earn points based on how close your guess is to the actual location</li>
                </ol>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="scoring-system" className="border border-gray-200 dark:border-gray-700 rounded-lg px-4">
              <AccordionTrigger className="hover:no-underline">
                <div className="flex items-center gap-2">
                  <Trophy className="w-4 h-4 text-amber-500" />
                  How does the scoring system work?
                </div>
              </AccordionTrigger>
              <AccordionContent className="text-sm text-gray-600 dark:text-gray-300 space-y-2">
                <p>Your score is calculated based on the distance between your guess and the actual location:</p>
                <ul className="list-disc list-inside space-y-1 ml-2">
                  <li><strong>Perfect guess (0km):</strong> 5000 points</li>
                  <li><strong>Very close (&lt;1km):</strong> 4000-4999 points</li>
                  <li><strong>Close (&lt;10km):</strong> 3000-3999 points</li>
                  <li><strong>Good (&lt;100km):</strong> 2000-2999 points</li>
                  <li><strong>Fair (&lt;1000km):</strong> 1000-1999 points</li>
                  <li><strong>Far (&gt;1000km):</strong> 0-999 points</li>
                </ul>
                <p className="text-xs text-gray-500">The closer your guess, the higher your score!</p>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="hints-system" className="border border-gray-200 dark:border-gray-700 rounded-lg px-4">
              <AccordionTrigger className="hover:no-underline">
                <div className="flex items-center gap-2">
                  <Lightbulb className="w-4 h-4 text-yellow-500" />
                  How do hints work?
                </div>
              </AccordionTrigger>
              <AccordionContent className="text-sm text-gray-600 dark:text-gray-300 space-y-2">
                <p>GeoGusserX offers two types of hints to help you identify locations:</p>
                <div className="space-y-3">
                  <div>
                    <h4 className="font-medium text-purple-600 dark:text-purple-400">Text Hints (Progressive)</h4>
                    <ul className="list-disc list-inside space-y-1 ml-2 text-xs">
                      <li>First hint is FREE - shows first and last letters of country name</li>
                      <li>Additional hints cost 50 points each</li>
                      <li>Each hint reveals one more letter of the country name</li>
                    </ul>
                  </div>
                  <div>
                    <h4 className="font-medium text-blue-600 dark:text-blue-400">AI Hints (Strategic)</h4>
                    <ul className="list-disc list-inside space-y-1 ml-2 text-xs">
                      <li>Cost 300 points each</li>
                      <li>Provide strategic clues about observable details</li>
                      <li>Become more specific with each purchase</li>
                      <li>Include categories like geographical, cultural, architectural</li>
                    </ul>
                  </div>
                </div>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="game-modes" className="border border-gray-200 dark:border-gray-700 rounded-lg px-4">
              <AccordionTrigger className="hover:no-underline">
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-green-500" />
                  What are the different game modes?
                </div>
              </AccordionTrigger>
              <AccordionContent className="text-sm text-gray-600 dark:text-gray-300 space-y-2">
                <div className="space-y-3">
                  <div>
                    <h4 className="font-medium text-green-600 dark:text-green-400">🏃‍♂️ Quick Expedition (4 rounds)</h4>
                    <p className="text-xs">Perfect for a swift geographic adventure during breaks (~10 min)</p>
                  </div>
                  <div>
                    <h4 className="font-medium text-blue-600 dark:text-blue-400">🎯 Classic Journey (5 rounds)</h4>
                    <p className="text-xs">The traditional explorer experience with balanced discovery (~15 min)</p>
                  </div>
                  <div>
                    <h4 className="font-medium text-purple-600 dark:text-purple-400">🏔️ Epic Adventure (8 rounds)</h4>
                    <p className="text-xs">For serious explorers who crave extended challenges (~25 min)</p>
                  </div>
                  <div>
                    <h4 className="font-medium text-orange-600 dark:text-orange-400">♾️ Endless Exploration (infinite)</h4>
                    <p className="text-xs">Unlimited geographic discovery - explore until your heart&apos;s content</p>
                  </div>
                </div>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="controls" className="border border-gray-200 dark:border-gray-700 rounded-lg px-4">
              <AccordionTrigger className="hover:no-underline">
                <div className="flex items-center gap-2">
                  <Settings className="w-4 h-4 text-gray-500" />
                  What are the game controls?
                </div>
              </AccordionTrigger>
              <AccordionContent className="text-sm text-gray-600 dark:text-gray-300 space-y-2">
                <div className="space-y-3">
                  <div>
                    <h4 className="font-medium">Street View Navigation:</h4>
                    <ul className="list-disc list-inside space-y-1 ml-2 text-xs">
                      <li><strong>Click & Drag:</strong> Look around in 360°</li>
                      <li><strong>Double Click:</strong> Zoom in</li>
                      <li><strong>Scroll Wheel:</strong> Zoom in/out</li>
                      <li><strong>Arrow Keys:</strong> Move forward/backward/turn</li>
                      <li><strong>White Lines:</strong> Click to move to connected roads</li>
                    </ul>
                  </div>
                  <div>
                    <h4 className="font-medium">Game Controls:</h4>
                    <ul className="list-disc list-inside space-y-1 ml-2 text-xs">
                      <li><strong>Map Click:</strong> Place your guess marker</li>
                      <li><strong>Skip Button:</strong> Skip to next location (no points)</li>
                      <li><strong>Hints Button:</strong> Purchase helpful clues</li>
                      <li><strong>End Game:</strong> Finish early and see results</li>
                    </ul>
                  </div>
                </div>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="tips-tricks" className="border border-gray-200 dark:border-gray-700 rounded-lg px-4">
              <AccordionTrigger className="hover:no-underline">
                <div className="flex items-center gap-2">
                  <Trophy className="w-4 h-4 text-yellow-500" />
                  Any tips for getting better scores?
                </div>
              </AccordionTrigger>
              <AccordionContent className="text-sm text-gray-600 dark:text-gray-300 space-y-2">
                <div className="space-y-2">
                  <h4 className="font-medium">Look for these clues:</h4>
                  <ul className="list-disc list-inside space-y-1 ml-2 text-xs">
                    <li><strong>Language on signs:</strong> Helps identify country/region</li>
                    <li><strong>License plates:</strong> Often show country codes or distinctive designs</li>
                    <li><strong>Architecture style:</strong> Different regions have unique building styles</li>
                    <li><strong>Vegetation & landscape:</strong> Climate clues about latitude</li>
                    <li><strong>Road markings:</strong> Yellow/white lines, driving side</li>
                    <li><strong>Phone numbers:</strong> Country codes and formats</li>
                    <li><strong>Currency symbols:</strong> On shops and advertisements</li>
                    <li><strong>Domain extensions:</strong> .co.uk, .de, .fr on websites</li>
                  </ul>
                  <p className="text-xs text-blue-600 dark:text-blue-400 font-medium">
                    💡 Pro tip: Start broad (continent) then narrow down (country/region)
                  </p>
                </div>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </div>
      </DialogContent>
    </Dialog>
  );
}