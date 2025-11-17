# =====================================
# Dockerfile - OpenAPI Control Plane MCP
# Base: Debian 12 (Bookworm) Slim with Node.js 22
# Process Manager: PM2
# =====================================

FROM node:22-bookworm-slim

# Set working directory
WORKDIR /app

# Verify Node.js and npm installation (comes with base image)
RUN node --version && npm --version

# Install PM2 globally
RUN npm install -g pm2

# Copy root package files
COPY package*.json ./

# Copy UI package files
COPY ui/package*.json ./ui/

# Install root production dependencies
RUN npm ci --only=production --ignore-scripts

# Install UI production dependencies
RUN cd ui && npm ci --only=production --ignore-scripts

# Copy TypeScript configuration and source code
COPY tsconfig.json ./
COPY src ./src

# Copy UI source code and configuration
COPY ui ./ui

# Copy PM2 ecosystem file
COPY ecosystem.config.cjs ./

# Install dev dependencies temporarily for build (both root and UI)
RUN npm install --only=development --ignore-scripts
RUN cd ui && npm install --only=development --ignore-scripts

# Build both backend and UI
RUN npm run build:all

# Remove dev dependencies after build
RUN npm prune --production
RUN cd ui && npm prune --production

# Create data and logs directories
RUN mkdir -p /data /app/logs

# Set environment variables
ENV NODE_ENV=production
ENV PORT=80
ENV HOST=0.0.0.0
ENV DATA_DIR=/data

# Define volume for persistent data
VOLUME /data

# Expose port 80
EXPOSE 80

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
    CMD node -e "require('http').get('http://localhost:80/health', (r) => process.exit(r.statusCode === 200 ? 0 : 1))"

# Start application with PM2 using ecosystem file
CMD ["pm2-runtime", "start", "ecosystem.config.cjs", "--env", "production"]

