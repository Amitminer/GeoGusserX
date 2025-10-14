'use client';

import React from 'react';
import { PageLayout } from '@/components/ui/page-layout';

/**
 * A component that displays a skeleton loading state for the homepage.
 * It mimics the layout of the actual homepage to provide a smooth and
 * visually consistent loading experience.
 */
export function HomepageSkeleton() {
	return (
		<PageLayout>
			<div className="relative">
				{/* These decorative elements are consistent with the main homepage design. */}
				<div className="absolute inset-0 overflow-hidden pointer-events-none">
					<div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-400/10 rounded-full blur-3xl"></div>
					<div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-400/10 rounded-full blur-3xl"></div>
				</div>

				{/* A skeleton representation of the hero section. */}
				<section className="container mx-auto px-4 py-12 sm:py-20 relative z-10">
					<div className="mb-12 text-center">
						<div className="mb-8 inline-flex items-center gap-6">
							<div className="w-20 h-20 bg-gray-200 dark:bg-gray-700 rounded-3xl animate-pulse" />
							<div className="text-left space-y-2">
								<div className="h-12 w-64 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
								<div className="h-6 w-48 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
							</div>
						</div>

						<div className="mb-10 space-y-3">
							<div className="h-6 w-96 bg-gray-200 dark:bg-gray-700 rounded animate-pulse mx-auto" />
							<div className="h-6 w-80 bg-gray-200 dark:bg-gray-700 rounded animate-pulse mx-auto" />
						</div>

						<div className="mb-12 flex flex-col items-center justify-center gap-4 sm:flex-row">
							<div className="h-14 w-48 bg-gray-200 dark:bg-gray-700 rounded-xl animate-pulse" />
							<div className="h-14 w-48 bg-gray-200 dark:bg-gray-700 rounded-xl animate-pulse" />
						</div>

						<div className="mx-auto grid max-w-4xl grid-cols-2 gap-6 sm:grid-cols-4">
							{Array.from({ length: 4 }).map((_, i) => (
								<div key={i} className="h-24 bg-gray-200 dark:bg-gray-700 rounded-xl animate-pulse" />
							))}
						</div>
					</div>
				</section>

				{/* A skeleton representation of the features section. */}
				<section className="container mx-auto px-4 py-20 relative z-10">
					<div className="mb-16 text-center">
						<div className="h-12 w-80 bg-gray-200 dark:bg-gray-700 rounded animate-pulse mx-auto mb-6" />
						<div className="h-6 w-96 bg-gray-200 dark:bg-gray-700 rounded animate-pulse mx-auto" />
					</div>

					<div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
						{Array.from({ length: 6 }).map((_, i) => (
							<div key={i} className="h-48 bg-gray-200 dark:bg-gray-700 rounded-2xl animate-pulse" />
						))}
					</div>
				</section>

				{/* A skeleton representation of the call-to-action section. */}
				<section className="container mx-auto px-4 py-16 relative z-10">
					<div className="max-w-5xl mx-auto">
						<div className="p-8 sm:p-12 text-center bg-gray-200 dark:bg-gray-700 rounded-3xl animate-pulse">
							<div className="w-16 h-16 bg-gray-300 dark:bg-gray-600 rounded-2xl mx-auto mb-6" />
							<div className="h-10 w-80 bg-gray-300 dark:bg-gray-600 rounded mx-auto mb-4" />
							<div className="h-6 w-96 bg-gray-300 dark:bg-gray-600 rounded mx-auto mb-8" />
							<div className="h-12 w-48 bg-gray-300 dark:bg-gray-600 rounded-xl mx-auto" />
						</div>
					</div>
				</section>

				{/* A skeleton representation of the footer. */}
				<footer className="container mx-auto px-4 py-16 relative z-10">
					<div className="space-y-6 text-center">
						<div className="h-12 w-40 bg-gray-200 dark:bg-gray-700 rounded-xl animate-pulse mx-auto" />
						<div className="h-6 w-64 bg-gray-200 dark:bg-gray-700 rounded animate-pulse mx-auto" />
						<div className="h-4 w-48 bg-gray-200 dark:bg-gray-700 rounded animate-pulse mx-auto" />
					</div>
				</footer>
			</div>
		</PageLayout>
	);
}