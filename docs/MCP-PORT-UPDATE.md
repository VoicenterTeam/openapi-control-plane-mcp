# 🚨 IMPORTANT: MCP Configuration Update

## Issue
After configuring the backend to run on port **3001** (to avoid conflicts with the Nuxt UI on port 3000), the MCP server endpoint has changed.

## Solution

### Update Your Cursor MCP Configuration

The MCP SSE endpoint URL has changed from:
```
http://localhost:3000/mcp/sse
```

To:
```
http://localhost:3001/mcp/sse
```

### How to Update in Cursor IDE

1. Open **Cursor Settings** (Ctrl+, or Cmd+,)
2. Navigate to **MCP Servers** or **Extensions**
3. Find the **openapi-control-plane-mcp** server configuration
4. Update the URL field to: `http://localhost:3001/mcp/sse`
5. Save and restart Cursor

### Configuration Example

```json
{
  "mcpServers": {
    "openapi-control-plane-mcp": {
      "command": "node",
      "args": ["dist/server.js"],
      "url": "http://localhost:3001/mcp/sse",
      "transport": "sse"
    }
  }
}
```

### Verification

Test the MCP connection:

**PowerShell:**
```powershell
Invoke-RestMethod -Uri "http://localhost:3001/mcp/sse" -Method GET
```

**Bash/Linux:**
```bash
curl -N http://localhost:3001/mcp/sse
```

You should see SSE connection established with heartbeat messages.

### Port Configuration Summary

- **Backend API (Fastify)**: `http://localhost:3001`
- **MCP SSE Endpoint**: `http://localhost:3001/mcp/sse`
- **Frontend UI (Nuxt)**: `http://localhost:3000`
- **API Proxy**: `http://localhost:3000/api` → `http://localhost:3001/api`

### Why the Change?

Both servers were trying to use port 3000, causing conflicts. The solution:
- Backend moved to port 3001 (configured in `.env`)
- Frontend stays on port 3000
- Nuxt proxy forwards API requests from 3000 → 3001

This ensures both the UI and API work correctly without port conflicts.

