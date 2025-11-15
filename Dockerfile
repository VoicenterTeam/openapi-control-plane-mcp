# =====================================
# Dockerfile - OpenAPI Control Plane MCP
# Base: Debian 12 (Bookworm) Slim
# Node.js: 22.21.1
# Process Manager: PM2
# =====================================

FROM debian:12-slim

# Set working directory
WORKDIR /app

# Install dependencies and Node.js 22.21.1
# Using NodeSource official repository for Debian
RUN apt-get update && \
    apt-get install -y --no-install-recommends \
    ca-certificates \
    curl \
    gnupg \
    && mkdir -p /etc/apt/keyrings \
    && curl -fsSL https://deb.nodesource.com/gpgkey/nodesource-repo.gpg.key | gpg --dearmor -o /etc/apt/keyrings/nodesource.gpg \
    && echo "deb [signed-by=/etc/apt/keyrings/nodesource.gpg] https://deb.nodesource.com/node_22.x nodistro main" | tee /etc/apt/sources.list.d/nodesource.list \
    && apt-get update \
    && apt-get install -y nodejs=22.21.1-1nodesource1 \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

# Verify Node.js and npm installation
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

