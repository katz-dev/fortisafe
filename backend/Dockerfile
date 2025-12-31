# Base image
FROM node:20-alpine AS base

# Install pnpm globally in base image
RUN npm install -g pnpm

# Install dependencies only when needed
FROM base AS deps
WORKDIR /app

# Copy package.json and pnpm-lock.yaml
COPY package.json pnpm-lock.yaml* ./

# Install dependenciess
# Note: If pnpm-lock.yaml exists, it will be used; otherwise, it will generate one
RUN pnpm install --no-frozen-lockfile

# Rebuild the source code only when needed
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Build the application
RUN pnpm run build

# Production image, copy all the files and run next
FROM base AS runner
WORKDIR /app

# Set default environment variables
# Note: Dokploy will inject environment variables at runtime
ENV NODE_ENV=production
ENV PORT=8080

# Create a non-root user
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nestjs

# Create directory structure with correct ownership from the start
RUN mkdir -p /app/dist && chown -R nestjs:nodejs /app

# Switch to non-root user before copying files
USER nestjs

# Copy necessary files (now as the nestjs user)
COPY --from=builder --chown=nestjs:nodejs /app/dist ./dist
COPY --from=builder --chown=nestjs:nodejs /app/package.json ./package.json

# Copy node_modules last (this is usually the largest directory)
COPY --from=builder --chown=nestjs:nodejs /app/node_modules ./node_modules

# Expose the port
EXPOSE 8080

# Start the application
CMD ["node", "dist/main"]
