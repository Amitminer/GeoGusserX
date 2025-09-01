'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from '@/components/ui/dialog';
import { CountrySettings } from '@/lib/types';
import { getAvailableCountries, getCountriesOnly, getRegionsByType } from '@/lib/locations/regions';
import { Settings, Globe, MapPin, Search, Check, X } from 'lucide-react';

interface CountrySelectionProps {
  countrySettings: CountrySettings;
  onSettingsChange: (settings: CountrySettings) => void;
}

export function CountrySelection({ countrySettings, onSettingsChange }: CountrySelectionProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [localSettings, setLocalSettings] = useState<CountrySettings>(countrySettings);
  const [searchTerm, setSearchTerm] = useState('');
  const [availableCountries] = useState(() => getAvailableCountries());
  const [showOnlyCountries, setShowOnlyCountries] = useState(false);

  // Filter countries based on search term and filter preference
  const baseList = showOnlyCountries ? getCountriesOnly() : availableCountries;
  const filteredCountries = baseList.filter(country =>
    country.toLowerCase().includes(searchTerm.toLowerCase())
  );
  
  // Group countries by type for better display
  const groupedCountries = {
    countries: filteredCountries.filter(name => {
      const regions = getRegionsByType('country');
      return regions.some(r => r.name === name);
    }),
    states: filteredCountries.filter(name => {
      const regions = getRegionsByType('state');
      return regions.some(r => r.name === name);
    }),
    regions: filteredCountries.filter(name => {
      const regions = getRegionsByType('region');
      return regions.some(r => r.name === name);
    })
  };

  // Update local settings when props change
  useEffect(() => {
    setLocalSettings(countrySettings);
  }, [countrySettings]);

  const handleSave = () => {
    onSettingsChange(localSettings);
    setIsOpen(false);
  };

  const handleCancel = () => {
    setLocalSettings(countrySettings);
    setSearchTerm('');
    setIsOpen(false);
  };

  const handleRandomToggle = (checked: boolean) => {
    setLocalSettings(prev => ({
      ...prev,
      isRandomCountry: checked,
      targetCountry: checked ? null : prev.targetCountry
    }));
  };

  const handleCountrySelect = (country: string) => {
    setLocalSettings(prev => ({
      ...prev,
      targetCountry: country,
      isRandomCountry: false
    }));
    setSearchTerm('');
  };

  const getCurrentDisplayText = () => {
    if (countrySettings.isRandomCountry) {
      return 'Random Country';
    }
    return countrySettings.targetCountry || 'Select Country';
  };

  const getDisplayIcon = () => {
    if (countrySettings.isRandomCountry) {
      return <Globe className="w-4 h-4 text-blue-500" />;
    }
    return <MapPin className="w-4 h-4 text-green-500" />;
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Card className="w-full max-w-sm mx-auto cursor-pointer hover:shadow-lg transition-all duration-300 border-2 hover:border-blue-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {getDisplayIcon()}
                <div className="text-left">
                  <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                    {getCurrentDisplayText()}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Tap to change location settings
                  </p>
                </div>
              </div>
              <Settings className="w-4 h-4 text-gray-400" />
            </div>
          </CardContent>
        </Card>
      </DialogTrigger>
      
      <DialogContent className="sm:max-w-md max-w-[95vw] max-h-[90vh] overflow-y-auto">
        <DialogHeader className="space-y-3">
          <DialogTitle className="flex items-center gap-2 text-lg">
            <Globe className="w-5 h-5 text-blue-500" />
            Location Settings
          </DialogTitle>
          <DialogDescription className="text-sm text-gray-600 dark:text-gray-300">
            Choose whether to explore random countries or focus on a specific country for your Street View adventure.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-6 py-4">
          {/* Random Country Toggle - Always Visible */}
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-white dark:bg-gray-800 rounded-lg border-2 border-gray-200 dark:border-gray-600 shadow-sm">
              <div className="flex-1 space-y-1 pr-4">
                <Label htmlFor="random-toggle" className="text-sm font-semibold cursor-pointer text-gray-900 dark:text-gray-100 flex items-center gap-2">
                  <Globe className="w-4 h-4 text-blue-500" />
                  Random Country Mode
                </Label>
                <p className="text-xs text-gray-600 dark:text-gray-400">
                  Explore locations from any available country worldwide
                </p>
              </div>
              <div className="flex-shrink-0 ml-4">
                <Switch
                  id="random-toggle"
                  checked={localSettings.isRandomCountry}
                  onCheckedChange={handleRandomToggle}
                  className="data-[state=checked]:bg-blue-600 data-[state=unchecked]:bg-gray-300"
                />
              </div>
            </div>

            {/* Current Selection Indicator */}
            <div className={`flex items-center gap-2 p-3 rounded-lg border transition-colors ${
              localSettings.isRandomCountry 
                ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800' 
                : 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800'
            }`}>
              {localSettings.isRandomCountry ? (
                <>
                  <Globe className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                  <span className="text-sm font-medium text-blue-800 dark:text-blue-200">
                    Random countries enabled
                  </span>
                </>
              ) : (
                <>
                  <MapPin className="w-4 h-4 text-green-600 dark:text-green-400" />
                  <span className="text-sm font-medium text-green-800 dark:text-green-200">
                    {localSettings.targetCountry ? `Selected: ${localSettings.targetCountry}` : 'Choose a specific country below'}
                  </span>
                </>
              )}
            </div>
          </div>

          {/* Country Selection */}
          <AnimatePresence>
            {!localSettings.isRandomCountry && (
              <motion.div
                initial={{ opacity: 0, height: 0, overflow: 'hidden' }}
                animate={{ opacity: 1, height: 'auto', overflow: 'visible' }}
                exit={{ opacity: 0, height: 0, overflow: 'hidden' }}
                transition={{ duration: 0.3, ease: 'easeInOut' }}
                className="space-y-4"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label className="text-sm font-medium">Select Location</Label>
                    <button
                      onClick={() => setShowOnlyCountries(!showOnlyCountries)}
                      className="text-xs text-blue-600 hover:text-blue-800 transition-colors"
                    >
                      {showOnlyCountries ? 'Show All Regions' : 'Countries Only'}
                    </button>
                  </div>
                  
                  {/* Search Input */}
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <Input
                      placeholder={showOnlyCountries ? "Search countries..." : "Search countries, states, regions..."}
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10 h-10"
                    />
                    {searchTerm && (
                      <button
                        onClick={() => setSearchTerm('')}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Location List */}
                <div className="space-y-1">
                  <div className="max-h-48 overflow-y-auto border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800">
                    {filteredCountries.length > 0 ? (
                      <div className="divide-y divide-gray-100 dark:divide-gray-700">
                        {/* Countries */}
                        {groupedCountries.countries.length > 0 && (
                          <div>
                            {!showOnlyCountries && (
                              <div className="px-3 py-2 bg-gray-50 dark:bg-gray-700">
                                <span className="text-xs font-medium text-gray-600 dark:text-gray-300 uppercase tracking-wide">Countries</span>
                              </div>
                            )}
                            {groupedCountries.countries.map((country) => (
                              <button
                                key={country}
                                onClick={() => handleCountrySelect(country)}
                                className={`w-full text-left px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors flex items-center justify-between ${
                                  localSettings.targetCountry === country
                                    ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300'
                                    : 'text-gray-900 dark:text-gray-100'
                                }`}
                              >
                                <div className="flex items-center gap-2">
                                  <Globe className="w-4 h-4 text-blue-500" />
                                  <span className="text-sm font-medium">{country}</span>
                                </div>
                                {localSettings.targetCountry === country && (
                                  <Check className="w-4 h-4 text-blue-600" />
                                )}
                              </button>
                            ))}
                          </div>
                        )}
                        
                        {/* States */}
                        {!showOnlyCountries && groupedCountries.states.length > 0 && (
                          <div>
                            <div className="px-3 py-2 bg-gray-50 dark:bg-gray-700">
                              <span className="text-xs font-medium text-gray-600 dark:text-gray-300 uppercase tracking-wide">States & Provinces</span>
                            </div>
                            {groupedCountries.states.map((state) => (
                              <button
                                key={state}
                                onClick={() => handleCountrySelect(state)}
                                className={`w-full text-left px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors flex items-center justify-between ${
                                  localSettings.targetCountry === state
                                    ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300'
                                    : 'text-gray-900 dark:text-gray-100'
                                }`}
                              >
                                <div className="flex items-center gap-2">
                                  <MapPin className="w-4 h-4 text-green-500" />
                                  <span className="text-sm">{state}</span>
                                </div>
                                {localSettings.targetCountry === state && (
                                  <Check className="w-4 h-4 text-blue-600" />
                                )}
                              </button>
                            ))}
                          </div>
                        )}
                        
                        {/* Regions */}
                        {!showOnlyCountries && groupedCountries.regions.length > 0 && (
                          <div>
                            <div className="px-3 py-2 bg-gray-50 dark:bg-gray-700">
                              <span className="text-xs font-medium text-gray-600 dark:text-gray-300 uppercase tracking-wide">Regions</span>
                            </div>
                            {groupedCountries.regions.map((region) => (
                              <button
                                key={region}
                                onClick={() => handleCountrySelect(region)}
                                className={`w-full text-left px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors flex items-center justify-between ${
                                  localSettings.targetCountry === region
                                    ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300'
                                    : 'text-gray-900 dark:text-gray-100'
                                }`}
                              >
                                <div className="flex items-center gap-2">
                                  <Settings className="w-4 h-4 text-purple-500" />
                                  <span className="text-sm">{region}</span>
                                </div>
                                {localSettings.targetCountry === region && (
                                  <Check className="w-4 h-4 text-blue-600" />
                                )}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="px-4 py-8 text-center text-gray-500 dark:text-gray-400">
                        <Search className="w-8 h-8 mx-auto mb-2 opacity-50" />
                        <p className="text-sm">No locations found</p>
                        <p className="text-xs">Try a different search term</p>
                      </div>
                    )}
                  </div>
                  
                  {filteredCountries.length > 0 && (
                    <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
                      {filteredCountries.length} of {baseList.length} locations
                      {showOnlyCountries && ' (countries only)'}
                    </p>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
            <Button 
              onClick={handleSave} 
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white order-2 sm:order-1"
              disabled={!localSettings.isRandomCountry && !localSettings.targetCountry}
            >
              <Check className="w-4 h-4 mr-2" />
              Save Settings
            </Button>
            <Button 
              onClick={handleCancel} 
              variant="outline" 
              className="flex-1 order-1 sm:order-2"
            >
              <X className="w-4 h-4 mr-2" />
              Cancel
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}