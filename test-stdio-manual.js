#!/usr/bin/env node

/**
 * Manual test for the stdio MCP server
 * This simulates what Cursor does when connecting via stdio
 */

import { spawn } from 'child_process'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

const serverPath = join(__dirname, 'dist', 'mcp-server.js')

console.log('🧪 Testing stdio MCP server...\n')
console.log(`Server path: ${serverPath}\n`)

const server = spawn('node', [serverPath], {
  stdio: ['pipe', 'pipe', 'inherit'], // stdin, stdout, stderr
  env: {
    ...process.env,
    STORAGE_PATH: join(__dirname, 'data'),
    NODE_ENV: 'development'
  }
})

// Send initialize request
const initRequest = {
  jsonrpc: '2.0',
  id: 0,
  method: 'initialize',
  params: {
    protocolVersion: '2024-11-05',
    capabilities: {
      tools: true
    },
    clientInfo: {
      name: 'test-client',
      version: '1.0.0'
    }
  }
}

console.log('📤 Sending initialize request:\n', JSON.stringify(initRequest, null, 2), '\n')
server.stdin.write(JSON.stringify(initRequest) + '\n')

// Send tools/list request after a short delay
setTimeout(() => {
  const toolsRequest = {
    jsonrpc: '2.0',
    id: 1,
    method: 'tools/list'
  }
  
  console.log('📤 Sending tools/list request:\n', JSON.stringify(toolsRequest, null, 2), '\n')
  server.stdin.write(JSON.stringify(toolsRequest) + '\n')
  
  // Give it time to respond, then exit
  setTimeout(() => {
    console.log('\n✅ Test complete! If you see tool names above, the stdio server works correctly.')
    server.kill()
    process.exit(0)
  }, 2000)
}, 1000)

// Collect responses
let buffer = ''
server.stdout.on('data', (data) => {
  buffer += data.toString()
  
  // Try to parse complete JSON-RPC messages
  const lines = buffer.split('\n')
  buffer = lines.pop() || '' // Keep incomplete line in buffer
  
  lines.forEach(line => {
    if (line.trim()) {
      try {
        const response = JSON.parse(line)
        console.log('📥 Received response:\n', JSON.stringify(response, null, 2), '\n')
        
        // If it's tools/list response, show tool names
        if (response.result && response.result.tools) {
          console.log('🎉 Found tools:')
          response.result.tools.forEach(tool => {
            console.log(`  ✓ ${tool.name}`)
          })
          console.log('')
        }
      } catch (e) {
        console.log('📄 Non-JSON output:', line)
      }
    }
  })
})

server.on('error', (err) => {
  console.error('❌ Server error:', err)
  process.exit(1)
})

server.on('exit', (code) => {
  console.log(`\n🛑 Server exited with code ${code}`)
})

