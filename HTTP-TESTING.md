# 🌐 HTTP API Testing Guide

## 🚀 Start the Server

```bash
npm run dev
```

The server will start on **http://localhost:3000**

You should see:
```
Server listening on http://localhost:3000
MCP transport started (stdio)
```

---

## 📋 Available HTTP Endpoints

### 1. Health Check
```bash
GET http://localhost:3000/health
```

**Response:**
```json
{
  "status": "ok",
  "version": "1.0.0",
  "timestamp": "2025-11-09T...",
  "tools": 10
}
```

### 2. List All Tools
```bash
GET http://localhost:3000/tools
```

**Response:** All 10 tools with their descriptions and input schemas.

### 3. Execute a Tool
```bash
POST http://localhost:3000/tools/{toolName}
Content-Type: application/json

{...tool parameters...}
```

---

## 🧪 Test Examples

### Example 1: Create a New Version

```bash
curl -X POST http://localhost:3000/tools/version_control \
  -H "Content-Type: application/json" \
  -d '{
    "apiId": "my-api",
    "version": "v1.0.0",
    "operation": "create",
    "description": "Initial version"
  }'
```

**PowerShell:**
```powershell
$body = @{
    apiId = "my-api"
    version = "v1.0.0"
    operation = "create"
    description = "Initial version"
} | ConvertTo-Json

Invoke-RestMethod -Uri http://localhost:3000/tools/version_control -Method Post -Body $body -ContentType "application/json"
```

### Example 2: Update Metadata

```bash
curl -X POST http://localhost:3000/tools/metadata_update \
  -H "Content-Type: application/json" \
  -d '{
    "apiId": "my-api",
    "version": "v1.0.0",
    "updates": {
      "title": "My Awesome API",
      "description": "This API does amazing things",
      "version": "1.0.0"
    }
  }'
```

**PowerShell:**
```powershell
$body = @{
    apiId = "my-api"
    version = "v1.0.0"
    updates = @{
        title = "My Awesome API"
        description = "This API does amazing things"
        version = "1.0.0"
    }
} | ConvertTo-Json -Depth 10

Invoke-RestMethod -Uri http://localhost:3000/tools/metadata_update -Method Post -Body $body -ContentType "application/json"
```

### Example 3: Add a Schema

```bash
curl -X POST http://localhost:3000/tools/schema_manage \
  -H "Content-Type: application/json" \
  -d '{
    "apiId": "my-api",
    "version": "v1.0.0",
    "operation": "add",
    "schemaName": "User",
    "schema": {
      "type": "object",
      "properties": {
        "id": { "type": "string" },
        "name": { "type": "string" },
        "email": { "type": "string", "format": "email" }
      },
      "required": ["id", "name", "email"]
    }
  }'
```

**PowerShell:**
```powershell
$body = @{
    apiId = "my-api"
    version = "v1.0.0"
    operation = "add"
    schemaName = "User"
    schema = @{
        type = "object"
        properties = @{
            id = @{ type = "string" }
            name = @{ type = "string" }
            email = @{ type = "string"; format = "email" }
        }
        required = @("id", "name", "email")
    }
} | ConvertTo-Json -Depth 10

Invoke-RestMethod -Uri http://localhost:3000/tools/schema_manage -Method Post -Body $body -ContentType "application/json"
```

### Example 4: Add an Endpoint

```bash
curl -X POST http://localhost:3000/tools/endpoint_manage \
  -H "Content-Type: application/json" \
  -d '{
    "apiId": "my-api",
    "version": "v1.0.0",
    "operation": "add",
    "path": "/users",
    "method": "GET",
    "endpoint": {
      "summary": "Get all users",
      "description": "Returns a list of all users",
      "responses": {
        "200": {
          "description": "Success",
          "content": {
            "application/json": {
              "schema": {
                "type": "array",
                "items": { "$ref": "#/components/schemas/User" }
              }
            }
          }
        }
      }
    }
  }'
```

**PowerShell:**
```powershell
$body = @{
    apiId = "my-api"
    version = "v1.0.0"
    operation = "add"
    path = "/users"
    method = "GET"
    endpoint = @{
        summary = "Get all users"
        description = "Returns a list of all users"
        responses = @{
            "200" = @{
                description = "Success"
                content = @{
                    "application/json" = @{
                        schema = @{
                            type = "array"
                            items = @{ '$ref' = "#/components/schemas/User" }
                        }
                    }
                }
            }
        }
    }
} | ConvertTo-Json -Depth 10

Invoke-RestMethod -Uri http://localhost:3000/tools/endpoint_manage -Method Post -Body $body -ContentType "application/json"
```

### Example 5: Read the Spec

```bash
curl -X POST http://localhost:3000/tools/spec_read \
  -H "Content-Type: application/json" \
  -d '{
    "apiId": "my-api",
    "version": "v1.0.0",
    "format": "yaml"
  }'
```

**PowerShell:**
```powershell
$body = @{
    apiId = "my-api"
    version = "v1.0.0"
    format = "yaml"
} | ConvertTo-Json

Invoke-RestMethod -Uri http://localhost:3000/tools/spec_read -Method Post -Body $body -ContentType "application/json"
```

### Example 6: Validate the Spec

```bash
curl -X POST http://localhost:3000/tools/spec_validate \
  -H "Content-Type: application/json" \
  -d '{
    "apiId": "my-api",
    "version": "v1.0.0"
  }'
```

### Example 7: List All Versions

```bash
curl -X POST http://localhost:3000/tools/version_control \
  -H "Content-Type: application/json" \
  -d '{
    "apiId": "my-api",
    "operation": "list"
  }'
```

---

## 🛠️ All Available Tools

| Tool Name | Endpoint |
|-----------|----------|
| `spec_read` | `POST /tools/spec_read` |
| `spec_validate` | `POST /tools/spec_validate` |
| `metadata_update` | `POST /tools/metadata_update` |
| `schema_manage` | `POST /tools/schema_manage` |
| `endpoint_manage` | `POST /tools/endpoint_manage` |
| `version_control` | `POST /tools/version_control` |
| `parameters_configure` | `POST /tools/parameters_configure` |
| `responses_configure` | `POST /tools/responses_configure` |
| `security_configure` | `POST /tools/security_configure` |
| `references_manage` | `POST /tools/references_manage` |

---

## 📊 Testing with Postman

1. Import this collection URL or create requests manually
2. Base URL: `http://localhost:3000`
3. All tool requests are `POST` to `/tools/{toolName}`
4. Set `Content-Type: application/json`
5. Body is raw JSON with tool parameters

---

## 🐛 Troubleshooting

### Server won't start
```bash
# Check if port 3000 is already in use
netstat -ano | findstr :3000

# Kill the process if needed
taskkill /PID <PID> /F
```

### Check server logs
The server logs to console and to `data/logs/` directory.

---

## 🎯 Quick Workflow

```bash
# 1. Start server
npm run dev

# 2. Create a new version (in another terminal)
curl -X POST http://localhost:3000/tools/version_control \
  -H "Content-Type: application/json" \
  -d '{"apiId":"test-api","version":"v1.0.0","operation":"create","description":"Test"}'

# 3. Update metadata
curl -X POST http://localhost:3000/tools/metadata_update \
  -H "Content-Type: application/json" \
  -d '{"apiId":"test-api","version":"v1.0.0","updates":{"title":"Test API"}}'

# 4. Add a schema
curl -X POST http://localhost:3000/tools/schema_manage \
  -H "Content-Type: application/json" \
  -d '{"apiId":"test-api","version":"v1.0.0","operation":"add","schemaName":"Item","schema":{"type":"object"}}'

# 5. Read the spec
curl -X POST http://localhost:3000/tools/spec_read \
  -H "Content-Type: application/json" \
  -d '{"apiId":"test-api","version":"v1.0.0"}'
```

---

**Ready to test? Fire up the server with `npm run dev` and start making requests!** 🚀

