import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { MapPin, Home, Search } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-4">
      <div className="max-w-md w-full text-center">
        <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-xl p-8">
          {/* 404 Illustration */}
          <div className="relative mb-8">
            <div className="text-8xl font-bold text-gray-200 dark:text-gray-700 mb-4">404</div>
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center">
                <MapPin className="w-8 h-8 text-white" suppressHydrationWarning />
              </div>
            </div>
          </div>
          
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-4">
            Location Not Found
          </h1>
          
          <p className="text-gray-600 dark:text-gray-300 mb-8">
            Looks like you&apos;ve wandered off the map! The page you&apos;re looking for doesn&apos;t exist, 
            but don&apos;t worry - there&apos;s a whole world to explore.
          </p>

          <div className="space-y-3">
            <Link href="/">
              <Button className="w-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white">
                <Home className="w-4 h-4 mr-2" suppressHydrationWarning />
                Back to Home
              </Button>
            </Link>
            
            <Link href="/">
              <Button variant="outline" className="w-full">
                <Search className="w-4 h-4 mr-2" suppressHydrationWarning />
                Start New Game
              </Button>
            </Link>
          </div>
        </div>
        
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-6">
          Ready to test your geography skills? Start a new game and explore the world!
        </p>
      </div>
    </div>
  );
}