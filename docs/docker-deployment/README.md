# Docker Deployment

## Overview

The OpenAPI Control Panel MCP Server can be deployed using Docker with Node.js and PM2 for process management.

## Dockerfile

```dockerfile
FROM debian:bookworm-slim

# Install Node.js 20.x
RUN apt-get update && apt-get install -y \
    curl \
    ca-certificates \
    && curl -fsSL https://deb.nodesource.com/setup_20.x | bash - \
    && apt-get install -y nodejs \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

# Install PM2 globally
RUN npm install -g pm2

# Create app directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy built application
COPY dist/ ./dist/

# Copy PM2 config
COPY ecosystem.config.js ./

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000/health', (r) => { process.exit(r.statusCode === 200 ? 0 : 1); })"

# Start with PM2
CMD ["pm2-runtime", "start", "ecosystem.config.js"]
```

## PM2 Configuration

`ecosystem.config.js`:

```javascript
module.exports = {
  apps: [{
    name: 'openapi-mcp',
    script: './dist/server.js',
    instances: 1,
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'production',
      PORT: 3000,
      DATA_DIR: '/data',
      LOG_LEVEL: 'info'
    },
    error_file: '/var/log/pm2/error.log',
    out_file: '/var/log/pm2/out.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    merge_logs: true
  }]
}
```

## Building the Image

```bash
# Build
npm run build
docker build -t openapi-mcp:latest .

# Tag for registry
docker tag openapi-mcp:latest registry.example.com/openapi-mcp:1.0.0
```

## Running the Container

```bash
docker run -d \
  --name openapi-mcp \
  -p 3000:3000 \
  -v $(pwd)/data:/data \
  -e DATA_DIR=/data \
  -e LOG_LEVEL=info \
  openapi-mcp:latest
```

## Docker Compose

`docker-compose.yml`:

```yaml
version: '3.8'

services:
  openapi-mcp:
    build: .
    ports:
      - "3000:3000"
    volumes:
      - ./data:/data
      - pm2-logs:/var/log/pm2
    environment:
      DATA_DIR: /data
      LOG_LEVEL: info
      NODE_ENV: production
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3000/health"]
      interval: 30s
      timeout: 3s
      retries: 3

volumes:
  pm2-logs:
```

Start with:
```bash
docker-compose up -d
```

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| PORT | 3000 | HTTP server port |
| DATA_DIR | ./data | Storage directory |
| LOG_LEVEL | info | Logging level |
| NODE_ENV | development | Environment |

## Kubernetes Deployment

`deployment.yaml`:

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: openapi-mcp
spec:
  replicas: 2
  selector:
    matchLabels:
      app: openapi-mcp
  template:
    metadata:
      labels:
        app: openapi-mcp
    spec:
      containers:
      - name: openapi-mcp
        image: registry.example.com/openapi-mcp:1.0.0
        ports:
        - containerPort: 3000
        env:
        - name: DATA_DIR
          value: /data
        - name: LOG_LEVEL
          value: info
        volumeMounts:
        - name: data
          mountPath: /data
        livenessProbe:
          httpGet:
            path: /health
            port: 3000
          initialDelaySeconds: 10
          periodSeconds: 30
        readinessProbe:
          httpGet:
            path: /health
            port: 3000
          initialDelaySeconds: 5
          periodSeconds: 10
      volumes:
      - name: data
        persistentVolumeClaim:
          claimName: openapi-mcp-data
---
apiVersion: v1
kind: Service
metadata:
  name: openapi-mcp
spec:
  selector:
    app: openapi-mcp
  ports:
  - port: 80
    targetPort: 3000
  type: LoadBalancer
```

## Production Considerations

1. **Persistent Storage**: Mount `/data` to persistent volume
2. **Logging**: Configure log aggregation (ELK, Splunk)
3. **Monitoring**: Add Prometheus metrics
4. **Scaling**: Use multiple replicas with shared storage
5. **Security**: Run as non-root user, use secrets for sensitive config

## Related Documentation

- [Architecture](../architecture/README.md)
- [Setup Guides](../setup-guides/START-HERE.md)

