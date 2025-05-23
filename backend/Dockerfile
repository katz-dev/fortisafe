# Base image
FROM node:20-alpine AS base

# Install dependencies only when needed
FROM base AS deps
WORKDIR /app

# Copy package.json and pnpm-lock.yaml
COPY package.json pnpm-lock.yaml* ./

# Install pnpm
RUN npm install -g pnpm

# Install dependencies
RUN pnpm install

# Rebuild the source code only when needed
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Build the application
RUN npm run build

# Production image, copy all the files and run next
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production

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

# Set environment variables
# MongoDB Configuration
ARG MONGODB_URI
ENV MONGODB_URI=$MONGODB_URI

# Auth0 Configuration
ARG AUTH0_DOMAIN
ENV AUTH0_DOMAIN=$AUTH0_DOMAIN

ARG AUTH0_AUDIENCE
ENV AUTH0_AUDIENCE=$AUTH0_AUDIENCE

ARG AUTH0_CLIENT_ID
ENV AUTH0_CLIENT_ID=$AUTH0_CLIENT_ID

ARG AUTH0_CLIENT_SECRET
ENV AUTH0_CLIENT_SECRET=$AUTH0_CLIENT_SECRET

ARG AUTH0_CALLBACK_URL
ENV AUTH0_CALLBACK_URL=$AUTH0_CALLBACK_URL

# App Configuration
ARG PORT
ENV PORT=$PORT

ARG FRONTEND_URL
ENV FRONTEND_URL=$FRONTEND_URL

ARG EXTENSION_URL
ENV EXTENSION_URL=$EXTENSION_URL

ARG PASSWORD_ENCRYPTION_KEY
ENV PASSWORD_ENCRYPTION_KEY=$PASSWORD_ENCRYPTION_KEY

ARG GOOGLE_SAFE_BROWSING_API_KEY
ENV GOOGLE_SAFE_BROWSING_API_KEY=$GOOGLE_SAFE_BROWSING_API_KEY

# Brevo SMTP Configuration
ARG BREVO_SMTP
ENV BREVO_SMTP=$BREVO_SMTP

ARG BREVO_SMTP_PORT
ENV BREVO_SMTP_PORT=$BREVO_SMTP_PORT

ARG BREVO_USER
ENV BREVO_USER=$BREVO_USER

ARG BREVO_PASS
ENV BREVO_PASS=$BREVO_PASS

ARG EMAIL_FROM_ADDRESS
ENV EMAIL_FROM_ADDRESS=$EMAIL_FROM_ADDRESS

ARG BREVO_BASE_URL
ENV BREVO_BASE_URL=$BREVO_BASE_URL

ARG BREVO_API_KEY
ENV BREVO_API_KEY=$BREVO_API_KEY

ARG EMAIL_FROM_NAME
ENV EMAIL_FROM_NAME=$EMAIL_FROM_NAME

# Expose the port
EXPOSE ${PORT:-8080}

# Start the application
CMD ["node", "dist/main"]
