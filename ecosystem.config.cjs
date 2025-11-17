// =====================================
// PM2 Ecosystem Configuration
// OpenAPI Control Plane MCP
// =====================================

module.exports = {
  apps: [
    {
      name: 'openapi-control-plane-mcp',
      script: './dist/server.js',
      instances: 1,
      exec_mode: 'cluster',
      watch: false,
      max_memory_restart: '1G',
      env: {
        NODE_ENV: 'development',
        PORT: 3001,
        HOST: '0.0.0.0',
        DATA_DIR: './data'
      },
      env_production: {
        NODE_ENV: 'production',
        PORT: 80,
        HOST: '0.0.0.0',
        DATA_DIR: '/data'
      },
      error_file: './logs/pm2-error.log',
      out_file: './logs/pm2-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      merge_logs: true,
      autorestart: true,
      max_restarts: 10,
      min_uptime: '10s',
      listen_timeout: 3000,
      kill_timeout: 5000,
      shutdown_with_message: true,
      wait_ready: true,
      // Health check
      instance_var: 'INSTANCE_ID',
      // Graceful shutdown
      kill_timeout: 5000,
      listen_timeout: 3000,
    }
  ],

  // Deployment configuration (optional)
  deploy: {
    production: {
      user: 'node',
      host: 'localhost',
      ref: 'origin/main',
      repo: 'git@github.com:VoicenterTeam/openapi-control-plane-mcp.git',
      path: '/var/www/openapi-control-plane-mcp',
      'pre-deploy-local': '',
      'post-deploy': 'npm install && npm run build:all && pm2 reload ecosystem.config.cjs --env production',
      'pre-setup': ''
    }
  }
};

