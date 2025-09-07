'use client';

import React from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Home, Settings, Play, ArrowLeft } from 'lucide-react';

interface NavigationProps {
  showBackButton?: boolean;
  className?: string;
}

export function Navigation({ showBackButton = false, className = '' }: NavigationProps) {
  const router = useRouter();
  const pathname = usePathname();

  const navItems = [
    { path: '/', icon: Home, label: 'Home' },
    { path: '/config', icon: Settings, label: 'Config' },
    { path: '/play', icon: Play, label: 'Play' }
  ];

  return (
    <nav className={`flex items-center gap-2 ${className}`}>
      {showBackButton && (
        <Button
          variant="outline"
          size="sm"
          onClick={() => router.back()}
          className="flex items-center gap-2"
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </Button>
      )}
      
      <div className="flex items-center gap-1">
        {navItems.map((item) => {
          const isActive = pathname === item.path;
          const Icon = item.icon;
          
          return (
            <motion.div
              key={item.path}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Button
                variant={isActive ? "default" : "ghost"}
                size="sm"
                onClick={() => router.push(item.path)}
                className={`flex items-center gap-2 ${
                  isActive 
                    ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white' 
                    : 'hover:bg-gray-100 dark:hover:bg-gray-800'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span className="hidden sm:inline">{item.label}</span>
              </Button>
            </motion.div>
          );
        })}
      </div>
    </nav>
  );
}