/**
 * Quick Start Script
 * 
 * Starts the HTTP server without MCP SDK dependency
 */

import('./dist/server.js').then(({ start }) => {
  start().catch(console.error)
})

