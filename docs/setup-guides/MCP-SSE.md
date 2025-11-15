# 🌐 MCP SSE Connection Guide

## 🎯 **Your MCP SSE URL:**

```
http://localhost:3000/mcp/sse
```

## 🚀 **Start the Server:**

```bash
npm run dev
```

Server will be available at `http://localhost:3000`

---

## 📋 **MCP Endpoints:**

### 1. **SSE Stream** (for connection)
```
GET http://localhost:3000/mcp/sse
```
- Content-Type: `text/event-stream`
- Returns SSE stream with endpoint information
- Keeps connection alive with heartbeat every 30 seconds

### 2. **MCP Messages** (for requests)
```
POST http://localhost:3000/mcp/message
Content-Type: application/json
```

Example request:
```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "method": "tools/list",
  "params": {}
}
```

---

## 🔧 **Connect from Cursor IDE:**

Update your Cursor MCP config to use HTTP transport:

**File:** `%APPDATA%\Cursor\User\globalStorage\saoudrizwan.claude-dev\settings\cline_mcp_settings.json`

**Option 1 - SSE Transport (if supported):**
```json
{
  "mcpServers": {
    "openapi-control-panel": {
      "url": "http://localhost:3000/mcp/sse",
      "transport": "sse"
    }
  }
}
```

**Option 2 - Stdio Transport (current):**
```json
{
  "mcpServers": {
    "openapi-control-panel": {
      "command": "node",
      "args": ["D:\\source\\openapi-control-panel-mcp\\dist\\mcp-server.js"],
      "env": {
        "STORAGE_PATH": "D:\\source\\openapi-control-panel-mcp\\data",
        "NODE_ENV": "development"
      }
    }
  }
}
```

---

## 🧪 **Test MCP SSE Manually:**

### 1. Connect to SSE stream:
```bash
curl -N http://localhost:3000/mcp/sse
```

You should see:
```
event: endpoint
data: {"type":"endpoint","endpoint":"/mcp/message"}

: heartbeat
```

### 2. List tools via MCP protocol:
```bash
curl -X POST http://localhost:3000/mcp/message \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "id": 1,
    "method": "tools/list",
    "params": {}
  }'
```

**PowerShell:**
```powershell
$body = @{
    jsonrpc = "2.0"
    id = 1
    method = "tools/list"
    params = @{}
} | ConvertTo-Json

Invoke-RestMethod -Uri http://localhost:3000/mcp/message -Method Post -Body $body -ContentType "application/json"
```

### 3. Call a tool via MCP protocol:
```bash
curl -X POST http://localhost:3000/mcp/message \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "id": 2,
    "method": "tools/call",
    "params": {
      "name": "version_control",
      "arguments": {
        "apiId": "test-api",
        "version": "v1.0.0",
        "operation": "create",
        "description": "Test API"
      }
    }
  }'
```

**PowerShell:**
```powershell
$body = @{
    jsonrpc = "2.0"
    id = 2
    method = "tools/call"
    params = @{
        name = "version_control"
        arguments = @{
            apiId = "test-api"
            version = "v1.0.0"
            operation = "create"
            description = "Test API"
        }
    }
} | ConvertTo-Json -Depth 10

Invoke-RestMethod -Uri http://localhost:3000/mcp/message -Method Post -Body $body -ContentType "application/json"
```

---

## 📡 **All Available Transports:**

Your server now supports **THREE ways** to connect:

### 1. **MCP SSE** (HTTP Server-Sent Events)
- **URL:** `http://localhost:3000/mcp/sse`
- **Best for:** Web clients, HTTP-based integrations
- **Protocol:** JSON-RPC 2.0 over SSE

### 2. **MCP Stdio** (Standard Input/Output)
- **Command:** `node dist/mcp-server.js`
- **Best for:** Cursor IDE, CLI tools, local processes
- **Protocol:** JSON-RPC 2.0 over stdio

### 3. **REST API** (Simple HTTP endpoints)
- **Base URL:** `http://localhost:3000`
- **Endpoints:** `/tools/:toolName`
- **Best for:** Testing, simple integrations, curl commands
- **Protocol:** Plain JSON

---

## 🎯 **Which One to Use?**

### For **Cursor IDE:**
Use **Stdio transport** (already configured in `cursor-mcp-config.json`)

### For **Web Applications:**
Use **MCP SSE** at `http://localhost:3000/mcp/sse`

### For **Quick Testing:**
Use **REST API** at `http://localhost:3000/tools/:toolName`

---

## 🔍 **Available Endpoints Summary:**

| Type | Endpoint | Method | Purpose |
|------|----------|--------|---------|
| Health | `/health` | GET | Server status |
| Tools List | `/tools` | GET | List all tools (REST) |
| Tool Execute | `/tools/:toolName` | POST | Execute tool (REST) |
| MCP SSE | `/mcp/sse` | GET | MCP connection stream |
| MCP Message | `/mcp/message` | POST | MCP protocol messages |

---

## 🐛 **Troubleshooting:**

### SSE connection fails
- Make sure server is running: `npm run dev`
- Check firewall settings for port 3000
- Try accessing `http://localhost:3000/health` first

### Cursor can't connect
- Use **Stdio transport** instead of SSE for Cursor
- Check `cursor-mcp-config.json` has correct paths
- Restart Cursor completely after config changes

### CORS errors (if accessing from browser)
The SSE endpoint includes `Access-Control-Allow-Origin: *` for testing

---

## 📖 **More Information:**

- **REST API Testing:** See `HTTP-TESTING.md`
- **Cursor Connection:** See `QUICKSTART.md`
- **Architecture:** See `AGENTS.md`

---

**Your MCP SSE URL is ready at `http://localhost:3000/mcp/sse`!** 🚀

