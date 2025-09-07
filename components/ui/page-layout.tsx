'use client';

import React from 'react';
import { motion } from 'framer-motion';

interface PageLayoutProps {
  children: React.ReactNode;
  className?: string;
  background?: 'default' | 'game' | 'dark';
}

const backgroundClasses = {
  default: 'bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900',
  game: 'bg-gray-100 dark:bg-gray-900',
  dark: 'bg-gradient-to-br from-gray-900 to-gray-800'
};

export function PageLayout({ children, className = '', background = 'default' }: PageLayoutProps) {
  return (
    <motion.div
      className={`min-h-screen ${backgroundClasses[background]} ${className}`}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      {children}
    </motion.div>
  );
}

export function Container({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`container mx-auto px-4 py-6 sm:py-8 ${className}`}>
      {children}
    </div>
  );
}