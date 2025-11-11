# MCP Protocol Testing

## Overview

Testing the MCP (Model Context Protocol) server and its JSON-RPC interface.

## MCP Protocol Basics

### JSON-RPC 2.0 Format

```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "method": "tools/call",
  "params": {
    "name": "spec_read",
    "arguments": {
      "apiId": "my-api",
      "version": "v1.0.0",
      "queryType": "info"
    }
  }
}
```

### MCP Methods

- `initialize` - Handshake, returns server capabilities
- `notifications/initialized` - Client ready notification
- `tools/list` - Get available tools
- `tools/call` - Execute a tool

## Testing Approaches

### 1. HTTP REST Testing

Test via HTTP endpoints:

```bash
# List tools
curl http://localhost:3000/tools

# Execute tool
curl -X POST http://localhost:3000/tools/spec_read \
  -H "Content-Type: application/json" \
  -d '{
    "apiId": "my-api",
    "version": "v1.0.0",
    "queryType": "info"
  }'
```

### 2. SSE Transport Testing

Test via SSE endpoint:

```bash
# Connect to SSE stream
curl -N http://localhost:3000/mcp/sse

# Send JSON-RPC request
curl -X POST http://localhost:3000/mcp/sse \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "id": 1,
    "method": "tools/list",
    "params": {}
  }'
```

### 3. Stdio Transport Testing

Test stdio-based MCP server:

```javascript
const { spawn } = require('child_process')

const mcp = spawn('node', ['dist/mcp-server.js'])

// Send initialize
mcp.stdin.write(JSON.stringify({
  jsonrpc: '2.0',
  id: 1,
  method: 'initialize',
  params: {
    protocolVersion: '2024-11-05',
    capabilities: {},
    clientInfo: { name: 'test-client', version: '1.0.0' }
  }
}) + '\n')

// Read response
mcp.stdout.on('data', (data) => {
  console.log('Response:', data.toString())
})
```

## Cursor IDE Integration Testing

### 1. Configure Cursor

Edit `~/.cursor/mcp.json` or `.cursor/cline_mcp_settings.json`:

```json
{
  "mcpServers": {
    "openapi-mcp": {
      "url": "http://localhost:3000/mcp/sse",
      "transport": "sse"
    }
  }
}
```

### 2. Test in Cursor

Use Cursor's MCP panel to:
1. Connect to server
2. List available tools
3. Execute tool operations

## Automated MCP Testing

```typescript
describe('MCP Server', () => {
  let server: FastifyInstance
  
  beforeAll(async () => {
    server = await createServer()
    await server.listen({ port: 3000 })
  })
  
  afterAll(async () => {
    await server.close()
  })
  
  it('should handle initialize', async () => {
    const response = await fetch('http://localhost:3000/mcp/sse', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: 0,
        method: 'initialize',
        params: {
          protocolVersion: '2024-11-05',
          capabilities: {},
          clientInfo: { name: 'test', version: '1.0.0' }
        }
      })
    })
    
    const data = await response.json()
    
    expect(data.result.protocolVersion).toBe('2024-11-05')
    expect(data.result.serverInfo.name).toBe('openapi-control-plane-mcp')
  })
  
  it('should list tools', async () => {
    const response = await fetch('http://localhost:3000/mcp/sse', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: 1,
        method: 'tools/list',
        params: {}
      })
    })
    
    const data = await response.json()
    
    expect(data.result.tools).toHaveLength(10)
    expect(data.result.tools[0]).toHaveProperty('name')
    expect(data.result.tools[0]).toHaveProperty('description')
    expect(data.result.tools[0]).toHaveProperty('inputSchema')
  })
})
```

## Troubleshooting

### Tool Not Appearing in Cursor

1. Check server logs
2. Verify tool registration in `src/server.ts`
3. Ensure `describe()` returns valid JSON Schema
4. Restart Cursor after config changes

### JSON-RPC Errors

```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "error": {
    "code": -32601,
    "message": "Method not found"
  }
}
```

Check method name spelling and server implementation.

## Related Documentation

- [Setup Guides](../setup-guides/CURSOR-MCP-SETUP.md)
- [Troubleshooting](../setup-guides/CURSOR-TROUBLESHOOTING.md)
- [API Tools & Testing](../api-tools-testing/README.md)

