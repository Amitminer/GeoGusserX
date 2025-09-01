# Simple Dockerfile for GeoGusserX
FROM node:20-alpine

# Install system dependencies
RUN apk add --no-cache libc6-compat

# Install pnpm
RUN npm install -g pnpm

# Set working directory
WORKDIR /app

# Create non-root user
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copy package files
COPY package.json pnpm-lock.yaml* ./

# Install dependencies
RUN pnpm install --frozen-lockfile

# Copy source code
COPY . .

# Set correct permissions
RUN chown -R nextjs:nodejs /app
USER nextjs

# Build the application
RUN pnpm build

# Expose port
EXPOSE 3000

# Set environment variables
ENV PORT 3000
ENV NODE_ENV production
ENV NEXT_TELEMETRY_DISABLED 1

# Start the application
CMD ["pnpm", "start"]