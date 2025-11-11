# 🚀 Quick Start Guide - FIXED!

## ✅ Issue Fixed!

The MCP SDK had installation issues. I've removed the dependency and the server now works with just HTTP endpoints!

## 🎯 **How to Start:**

### Open PowerShell/Terminal and run:

```powershell
cd D:\source\openapi-control-plane-mcp
node dist/server.js
```

You should see:
```
🚀 OpenAPI Control Plane MCP Server started!
Server listening on http://localhost:3000
```

---

## 🧪 **Test It (in a NEW terminal):**

### 1. Health Check:
```powershell
curl http://localhost:3000/health
```

### 2. List All Tools:
```powershell
curl http://localhost:3000/tools
```

### 3. Create Your First API:
```powershell
$body = @{
    apiId = "my-api"
    version = "v1.0.0"
    operation = "create"
    description = "My first API"
} | ConvertTo-Json

Invoke-RestMethod -Uri http://localhost:3000/tools/version_control -Method Post -Body $body -ContentType "application/json"
```

### 4. Update Metadata:
```powershell
$body = @{
    apiId = "my-api"
    version = "v1.0.0"
    updates = @{
        title = "My Awesome API"
        description = "This API is amazing"
    }
} | ConvertTo-Json -Depth 10

Invoke-RestMethod -Uri http://localhost:3000/tools/metadata_update -Method Post -Body $body -ContentType "application/json"
```

### 5. Read the Spec:
```powershell
$body = @{
    apiId = "my-api"
    version = "v1.0.0"
    format = "yaml"
} | ConvertTo-Json

Invoke-RestMethod -Uri http://localhost:3000/tools/spec_read -Method Post -Body $body -ContentType "application/json"
```

---

## 📋 **All Available Endpoints:**

### HTTP REST API:
- **GET** `/health` - Server health check
- **GET** `/tools` - List all 10 tools
- **POST** `/tools/:toolName` - Execute any tool

### MCP SSE (for web clients):
- **GET** `/mcp/sse` - SSE connection stream
- **POST** `/mcp/message` - JSON-RPC 2.0 messages

---

## 🎯 **Your URLs:**

```
HTTP API Base:    http://localhost:3000
MCP SSE Endpoint: http://localhost:3000/mcp/sse
Health Check:     http://localhost:3000/health
Tools List:       http://localhost:3000/tools
```

---

## 🛠️ **All 10 Tools Available:**

1. `spec_read` - Read OpenAPI specs
2. `spec_validate` - Validate with Spectral
3. `metadata_update` - Update API metadata  
4. `schema_manage` - Manage schemas
5. `endpoint_manage` - Manage endpoints
6. `version_control` - Version management
7. `parameters_configure` - Configure parameters
8. `responses_configure` - Configure responses
9. `security_configure` - Configure security
10. `references_manage` - Manage $ref references

---

## 📖 **More Examples:**

See `HTTP-TESTING.md` for comprehensive examples of all tools!

---

## 🐛 **Troubleshooting:**

### Port already in use?
```powershell
# Find process on port 3000
netstat -ano | findstr :3000

# Kill it
taskkill /PID <PID> /F
```

### Server not responding?
- Make sure you ran `npm run build` first
- Check that `data/` folder exists
- Look for errors in the terminal where you started the server

---

**Now run `node dist/server.js` and start building APIs!** 🚀

