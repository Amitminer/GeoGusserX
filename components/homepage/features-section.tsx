'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Globe, MapPin, Trophy, Zap, Eye, Star } from 'lucide-react';
import { features } from '.';

const iconMap = {
	Globe,
	MapPin,
	Trophy,
	Zap,
	Eye,
	Star,
} as const;

const containerVariants = {
	hidden: { opacity: 0 },
	visible: {
		opacity: 1,
		transition: {
			staggerChildren: 0.1
		}
	}
};

const itemVariants = {
	hidden: { opacity: 0, y: 20 },
	visible: { opacity: 1, y: 0 }
};

export function FeaturesSection() {
	return (
		<section className="container mx-auto px-4 py-20 relative z-10">
			<motion.div
				variants={containerVariants}
				initial="hidden"
				whileInView="visible"
				viewport={{ once: true }}
				className="mb-16 text-center"
			>
				<motion.h2
					variants={itemVariants}
					className="mb-6 text-4xl font-bold bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent dark:from-gray-200 dark:to-gray-400 sm:text-5xl"
				>
					Why Choose GeoGusserX?
				</motion.h2>
				<motion.p
					variants={itemVariants}
					className="mx-auto max-w-2xl text-lg text-gray-600 dark:text-gray-400 font-light leading-relaxed"
				>
					Experience the ultimate geography guessing game with modern features designed for explorers like you
				</motion.p>
			</motion.div>

			<motion.div
				variants={containerVariants}
				initial="hidden"
				whileInView="visible"
				viewport={{ once: true }}
				className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3"
			>
				{features.map((feature, index) => {
					const IconComponent = iconMap[feature.icon as keyof typeof iconMap];

					return (
						<motion.div
							key={index}
							variants={itemVariants}
							whileHover="hover"
						>
							<motion.div
								whileHover={{ y: -8, transition: { type: 'spring', stiffness: 300 } }}
							>
								<Card className="h-full border-2 border-gray-200/50 dark:border-gray-700/50 hover:border-blue-300/50 dark:hover:border-blue-600/50 transition-all duration-300 bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm shadow-xl hover:shadow-2xl rounded-2xl overflow-hidden group">
									<CardHeader className="pb-4">
										<CardTitle className="flex items-center gap-4">
											<motion.div
												className={`flex h-14 w-14 items-center justify-center rounded-xl bg-gradient-to-r ${feature.gradient} text-white shadow-lg group-hover:scale-110 transition-transform duration-300`}
												whileHover={{ rotate: 360 }}
												transition={{ duration: 0.6 }}
											>
												<IconComponent className="h-6 w-6" />
											</motion.div>
											<span className="text-xl font-semibold bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent dark:from-gray-200 dark:to-gray-400">
												{feature.title}
											</span>
										</CardTitle>
									</CardHeader>
									<CardContent>
										<p className="text-gray-600 dark:text-gray-300 leading-relaxed font-light">
											{feature.description}
										</p>
									</CardContent>
								</Card>
							</motion.div>
						</motion.div>
					);
				})}
			</motion.div>
		</section>
	);
}
