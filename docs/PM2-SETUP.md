# PM2 Process Management Setup

This document explains how to use PM2 for managing the OpenAPI Control Plane MCP application.

## Overview

PM2 is a production-grade process manager for Node.js applications with built-in load balancer, monitoring, and zero-downtime deployments.

## Installation

PM2 is already included in the project dependencies. For global installation:

```bash
npm install -g pm2
```

## Configuration

The application uses `ecosystem.config.cjs` for PM2 configuration with the following features:

- **Cluster mode**: Running multiple instances for better performance
- **Auto-restart**: Automatic restart on crashes
- **Memory limit**: Automatic restart if memory exceeds 1GB
- **Log management**: Separate error and output logs
- **Environment variables**: Different configs for development and production

## Usage

### Development

Start the application in development mode:

```bash
npm run build:all
npm run pm2:start
```

### Production

Start the application in production mode:

```bash
npm run build:all
npm run pm2:start:prod
```

### Common Commands

```bash
# View status
npm run pm2:status

# View logs
npm run pm2:logs

# Monitor in real-time
npm run pm2:monit

# Restart application
npm run pm2:restart

# Reload application (zero-downtime)
npm run pm2:reload

# Stop application
npm run pm2:stop

# Delete from PM2
npm run pm2:delete
```

### Direct PM2 Commands

```bash
# Start with ecosystem file
pm2 start ecosystem.config.cjs

# Start in production mode
pm2 start ecosystem.config.cjs --env production

# View logs
pm2 logs openapi-control-plane-mcp

# Monitor
pm2 monit

# Restart
pm2 restart openapi-control-plane-mcp

# Reload (zero-downtime restart)
pm2 reload openapi-control-plane-mcp

# Stop
pm2 stop openapi-control-plane-mcp

# Delete
pm2 delete openapi-control-plane-mcp

# Save PM2 process list
pm2 save

# Resurrect saved process list on reboot
pm2 resurrect
```

## Logs

Logs are stored in the `logs/` directory:

- `logs/pm2-error.log` - Error logs
- `logs/pm2-out.log` - Standard output logs

View logs in real-time:

```bash
# All logs
pm2 logs

# Only errors
pm2 logs --err

# Only output
pm2 logs --out

# Follow logs
pm2 logs --lines 100
```

## Auto-Start on System Reboot

To configure PM2 to start automatically on system reboot:

```bash
# Generate startup script
pm2 startup

# Save current process list
pm2 save
```

On Windows, you may need to use `pm2-windows-startup`:

```bash
npm install -g pm2-windows-startup
pm2-startup install
```

## Monitoring

### Built-in Monitoring

```bash
pm2 monit
```

### Web Dashboard (PM2 Plus - Optional)

PM2 Plus provides a web-based dashboard with advanced monitoring:

1. Sign up at https://pm2.io
2. Link your application:

```bash
pm2 link <secret_key> <public_key>
```

## Docker Usage

The Dockerfile is configured to use PM2:

```bash
# Build image
npm run docker:build

# Run container
npm run docker:run

# View logs
npm run docker:logs

# Stop container
npm run docker:stop
```

## Cluster Mode

The ecosystem file is configured to run in cluster mode. You can adjust the number of instances:

```javascript
// ecosystem.config.cjs
instances: 1, // Change to 'max' for all CPU cores or a specific number
```

## Memory Management

The application will automatically restart if memory usage exceeds 1GB. Adjust in ecosystem file:

```javascript
max_memory_restart: '1G', // Change to '2G', '512M', etc.
```

## Zero-Downtime Deployments

Use reload instead of restart for zero-downtime updates:

```bash
npm run pm2:reload
```

Or:

```bash
pm2 reload ecosystem.config.cjs
```

## Troubleshooting

### Application won't start

1. Check logs:
   ```bash
   pm2 logs openapi-control-plane-mcp --err
   ```

2. Verify build:
   ```bash
   npm run build:all
   ```

3. Check environment variables:
   ```bash
   pm2 env 0  # View environment for process ID 0
   ```

### High memory usage

1. Check current memory:
   ```bash
   pm2 list
   ```

2. Adjust `max_memory_restart` in ecosystem file

3. Analyze memory leaks:
   ```bash
   pm2 monit
   ```

### Port already in use

1. Stop all PM2 processes:
   ```bash
   pm2 stop all
   ```

2. Or kill specific port:
   ```bash
   # Windows
   netstat -ano | findstr :3001
   taskkill /PID <PID> /F

   # Linux/Mac
   lsof -i :3001
   kill -9 <PID>
   ```

## Best Practices

1. **Always build before starting**:
   ```bash
   npm run build:all && npm run pm2:start
   ```

2. **Save process list after changes**:
   ```bash
   pm2 save
   ```

3. **Use reload for updates** (zero-downtime):
   ```bash
   npm run pm2:reload
   ```

4. **Monitor regularly**:
   ```bash
   npm run pm2:status
   ```

5. **Set up auto-start** for production servers

6. **Regular log rotation**:
   ```bash
   pm2 install pm2-logrotate
   ```

## Environment Variables

### Development Environment

```bash
NODE_ENV=development
PORT=3001
HOST=0.0.0.0
DATA_DIR=./data
```

### Production Environment

```bash
NODE_ENV=production
PORT=80
HOST=0.0.0.0
DATA_DIR=/data
```

## Integration with Systemd (Linux)

For production Linux servers, integrate PM2 with systemd:

```bash
pm2 startup systemd
pm2 save
```

This ensures PM2 starts automatically on system boot and manages the application lifecycle.

## Additional Resources

- [PM2 Documentation](https://pm2.keymetrics.io/docs/usage/quick-start/)
- [PM2 Cluster Mode](https://pm2.keymetrics.io/docs/usage/cluster-mode/)
- [PM2 Plus Dashboard](https://pm2.io/)
- [PM2 Runtime](https://pm2.keymetrics.io/docs/usage/docker-pm2-nodejs/)

