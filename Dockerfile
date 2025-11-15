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

# Copy package files
COPY package*.json ./

# Install production dependencies only
RUN npm ci --only=production --ignore-scripts

# Copy TypeScript configuration and source code
COPY tsconfig.json ./
COPY src ./src

# Install dev dependencies temporarily for build
RUN npm install --only=development --ignore-scripts

# Build TypeScript code
RUN npm run build

# Remove dev dependencies after build
RUN npm prune --production

# Create data directory for volume
RUN mkdir -p /data

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

# Start application with PM2
CMD ["pm2-runtime", "start", "dist/server.js", "--name", "openapi-control-plane-mcp", "--no-daemon"]

