'use client';

import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from '@/components/ui/dialog';
import { CountrySettings } from '@/lib/types';
import { getCountriesOnly, getStatesForCountry } from '@/lib/locations/regions';
import { Settings, Globe, MapPin, Search, X } from 'lucide-react';

/**
 * Props for the `CountrySelection` component.
 */
interface CountrySelectionProps {
  /** The current country settings. */
  countrySettings: CountrySettings;
  /** A callback function that is triggered when the country settings are changed. */
  onSettingsChange: (settings: CountrySettings) => void;
}

/**
 * A custom hook that debounces a value. This is useful for delaying the execution
 * of a function until after a certain amount of time has passed since the last event.
 * @param value The value to be debounced.
 * @param delay The debounce delay in milliseconds.
 * @returns The debounced value.
 */
function useDebounce<T>(value: T, delay: number): T {
	const [debouncedValue, setDebouncedValue] = useState<T>(value);

	useEffect(() => {
		const handler = setTimeout(() => setDebouncedValue(value), delay);
		return () => clearTimeout(handler);
	}, [value, delay]);

	return debouncedValue;
}

/**
 * A component that allows the user to select a country or region for the game.
 * It features a dialog with a searchable list of countries and their regions,
 * as well as an option to play with random countries.
 */
export function CountrySelection({ countrySettings, onSettingsChange }: CountrySelectionProps) {
	const [isOpen, setIsOpen] = useState(false);
	const [searchTerm, setSearchTerm] = useState('');
	const [selectedCountry, setSelectedCountry] = useState<string | null>(null);
	const [showRegions, setShowRegions] = useState(false);
	const searchInputRef = useRef<HTMLInputElement>(null);

	const debouncedSearch = useDebounce(searchTerm, 200);

	const allCountries = useMemo(() => {
		const countries = getCountriesOnly();
		return [...new Set(countries)].sort();
	}, []);

	const countryRegions = useMemo(() => {
		if (!selectedCountry) return [];
		return getStatesForCountry(selectedCountry);
	}, [selectedCountry]);

	const filteredRegions = useMemo(() => {
		if (!showRegions || !debouncedSearch.trim()) return countryRegions;
		const searchLower = debouncedSearch.toLowerCase();
		return countryRegions.filter(region =>
			region.name.toLowerCase().includes(searchLower)
		);
	}, [countryRegions, showRegions, debouncedSearch]);

	const filteredCountries = useMemo(() => {
		if (!debouncedSearch.trim()) return allCountries;
		const searchLower = debouncedSearch.toLowerCase();
		return allCountries.filter(country =>
			country.toLowerCase().includes(searchLower)
		);
	}, [allCountries, debouncedSearch]);

	/**
	 * This effect auto-focuses the search input when the dialog is opened on desktop devices.
	 */
	useEffect(() => {
		if (isOpen) {
			queueMicrotask(() => {
				setSearchTerm('');
				setSelectedCountry(null);
				setShowRegions(false);
			});
			if (window.innerWidth > 768) {
				requestAnimationFrame(() => {
					searchInputRef.current?.focus();
				});
			}
		}
	}, [isOpen]);

	/**
	 * Clears the search term when switching between the country and region views.
	 */
	useEffect(() => {
		queueMicrotask(() => {
			setSearchTerm('');
		});
	}, [showRegions]);

	/**
	 * Handles the click event on a country. If the country has regions, it displays the region list.
	 * Otherwise, it selects the country and closes the dialog.
	 * @param country The name of the country that was clicked.
	 */
	const handleCountryClick = useCallback((country: string) => {
		const regions = getStatesForCountry(country);
		if (regions.length > 0) {
			setSelectedCountry(country);
			setShowRegions(true);
		} else {
			onSettingsChange({
				targetCountry: country,
				isRandomCountry: false
			});
			setIsOpen(false);
		}
	}, [onSettingsChange]);

	/**
	 * Handles the selection of a region, updating the settings and closing the dialog.
	 * @param region The name of the region that was selected.
	 */
	const handleRegionSelect = useCallback((region: string) => {
		onSettingsChange({
			targetCountry: region,
			isRandomCountry: false
		});
		setIsOpen(false);
	}, [onSettingsChange]);

	/**
	 * Navigates back to the country list from the region list.
	 */
	const handleBackToCountries = useCallback(() => {
		setShowRegions(false);
		setSelectedCountry(null);
	}, []);

	/**
	 * Handles the toggling of the random country mode.
	 * @param checked A boolean indicating whether the random mode is enabled.
	 */
	const handleRandomToggle = useCallback((checked: boolean) => {
		onSettingsChange({
			isRandomCountry: checked,
			targetCountry: checked ? null : countrySettings.targetCountry
		});
		if (checked) setIsOpen(false);
	}, [countrySettings.targetCountry, onSettingsChange]);

	/**
	 * Clears the search input.
	 */
	const clearSearch = useCallback(() => {
		setSearchTerm('');
		searchInputRef.current?.focus();
	}, []);

	const displayText = countrySettings.isRandomCountry
		? 'Random Country'
		: countrySettings.targetCountry || 'Select Country';

	const displayIcon = countrySettings.isRandomCountry
		? <Globe className="w-4 h-4 text-blue-500" />
		: <MapPin className="w-4 h-4 text-green-500" />;

	return (
		<Dialog open={isOpen} onOpenChange={setIsOpen}>
			<DialogTrigger asChild>
				<Card className="w-full max-w-sm sm:max-w-lg mx-auto cursor-pointer hover:shadow-lg transition-all duration-300 border-2 hover:border-blue-200">
					<CardContent className="p-4 sm:p-6">
						<div className="flex items-center justify-between">
							<div className="flex items-center gap-3 sm:gap-4">
								<div className="p-2 sm:p-3 rounded-lg bg-blue-50 dark:bg-blue-900/20">
									{React.cloneElement(displayIcon, {
										className: "w-5 h-5 sm:w-6 sm:h-6 text-blue-600"
									})}
								</div>
								<div className="text-left">
									<p className="text-sm sm:text-lg font-medium text-gray-900 dark:text-gray-100">
										{displayText}
									</p>
									<p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">
										Click to change location preferences
									</p>
								</div>
							</div>
							<div className="flex items-center gap-2">
								<div className="hidden sm:block text-right">
									<p className="text-xs text-gray-400">Settings</p>
								</div>
								<Settings className="w-4 h-4 sm:w-5 sm:h-5 text-gray-400" />
							</div>
						</div>
					</CardContent>
				</Card>
			</DialogTrigger>

			<DialogContent className="sm:max-w-lg max-w-[95vw] max-h-[80vh] overflow-hidden">
				<DialogHeader>
					<DialogTitle className="flex items-center gap-2 text-lg sm:text-xl">
						<Globe className="w-5 h-5 sm:w-6 sm:h-6 text-blue-500" />
						Location Preferences
					</DialogTitle>
					<DialogDescription className="text-sm sm:text-base">
						Choose random countries or select a specific location for your game.
					</DialogDescription>
				</DialogHeader>

				<div className="space-y-4">
					{/* A toggle switch for enabling or disabling random country mode. */}
					<div className={`flex items-center justify-between p-3 sm:p-4 rounded-lg border transition-all duration-200 ${countrySettings.isRandomCountry
							? 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-700'
							: 'bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-600'
						}`}>
						<div className="flex items-center gap-3 sm:gap-4 flex-1">
							<div className="p-2 rounded-lg bg-white dark:bg-gray-700">
								<Globe className={`w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0 ${countrySettings.isRandomCountry ? 'text-blue-600' : 'text-gray-500'
									}`} />
							</div>
							<div className="min-w-0">
								<Label htmlFor="random-toggle" className="text-sm sm:text-base font-medium cursor-pointer">
									Random Country Mode
								</Label>
								<p className={`text-xs sm:text-sm ${countrySettings.isRandomCountry
										? 'text-blue-600 dark:text-blue-400'
										: 'text-gray-500 dark:text-gray-400'
									}`}>
									{countrySettings.isRandomCountry ? '✓ Exploring random locations worldwide' : 'Choose specific countries or regions'}
								</p>
							</div>
						</div>
						<Switch
							id="random-toggle"
							checked={countrySettings.isRandomCountry}
							onCheckedChange={handleRandomToggle}
							className="data-[state=checked]:bg-blue-600 flex-shrink-0"
						/>
					</div>

					{/* The country and region selection UI, which is shown only when random mode is disabled. */}
					{!countrySettings.isRandomCountry && (
						<motion.div
							initial={{ opacity: 0, y: 10 }}
							animate={{ opacity: 1, y: 0 }}
							className="space-y-3"
						>
							<div className="relative">
								<Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
								<Input
									ref={searchInputRef}
									placeholder={showRegions ? `Search regions in ${selectedCountry}...` : "Search countries..."}
									value={searchTerm}
									onChange={(e) => setSearchTerm(e.target.value)}
									className="pl-10"
								/>
								{searchTerm && (
									<button
										onClick={clearSearch}
										className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
									>
										<X className="w-4 h-4" />
									</button>
								)}
							</div>

							<div className="border rounded-lg h-48 sm:h-64 overflow-y-auto">
								{!showRegions ? (
									filteredCountries.length > 0 ? (
										filteredCountries.map((country) => {
											const hasRegions = getStatesForCountry(country).length > 0;
											return (
												<button
													key={country}
													onClick={() => handleCountryClick(country)}
													className={`w-full text-left px-3 py-2 hover:bg-gray-50 dark:hover:bg-gray-800 border-b last:border-b-0 transition-colors flex items-center justify-between text-sm ${countrySettings.targetCountry === country
															? 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300'
															: ''
														}`}
												>
													<span>{country}</span>
													{hasRegions && (
														<span className="text-xs text-gray-400">→</span>
													)}
												</button>
											);
										})
									) : (
										<div className="p-8 text-center text-gray-500">
											<Search className="w-8 h-8 mx-auto mb-2 opacity-50" />
											<p className="text-sm">No countries found</p>
										</div>
									)
								) : (
									<div>
										<button
											onClick={handleBackToCountries}
											className="w-full text-left px-3 py-2 bg-blue-50 dark:bg-blue-900/20 border-b border-blue-200 dark:border-blue-700 font-medium text-blue-700 dark:text-blue-300 hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors flex items-center gap-2 text-sm"
										>
											<MapPin className="w-4 h-4" />
											← Back
										</button>

										<button
											onClick={() => handleRegionSelect(selectedCountry!)}
											className={`w-full text-left px-3 py-2 hover:bg-green-50 dark:hover:bg-green-900/20 border-b border-green-100 dark:border-green-800 font-medium text-green-700 dark:text-green-300 transition-colors flex items-center gap-2 text-sm ${countrySettings.targetCountry === selectedCountry
													? 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300'
													: ''
												}`}
										>
											<Globe className="w-4 h-4" />
											Entire Country
										</button>

										{filteredRegions
											.filter(region => region.name !== selectedCountry)
											.map((region) => (
												<button
													key={region.name}
													onClick={() => handleRegionSelect(region.name)}
													className={`w-full text-left px-3 py-2 hover:bg-gray-50 dark:hover:bg-gray-800 border-b last:border-b-0 transition-colors text-sm ${countrySettings.targetCountry === region.name
															? 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300'
															: ''
														}`}
												>
													{region.name}
												</button>
											))}
									</div>
								)}
							</div>
						</motion.div>
					)}

					<div className="flex justify-end pt-4 border-t">
						<Button onClick={() => setIsOpen(false)} variant="outline">
							Close
						</Button>
					</div>
				</div>
			</DialogContent>
		</Dialog>
	);
}