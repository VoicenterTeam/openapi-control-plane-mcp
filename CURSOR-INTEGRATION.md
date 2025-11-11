# Cursor IDE Integration Guide

> **OpenAPI Control Plane MCP Server v1.0.1**

This guide shows how to integrate the OpenAPI MCP Server with Cursor IDE for AI-assisted API development.

## 🎯 Overview

Once integrated, you can ask Cursor's AI to:
- Read and query your OpenAPI specifications
- Validate specs for errors and best practices
- Add, update, or delete schemas and endpoints
- Manage API versions with automatic diffing
- Configure parameters, responses, and security
- Track all changes with audit logging

## 🚀 Quick Setup (5 minutes)

### Step 1: Install and Build

```bash
cd openapi-control-plane-mcp
npm install
npm run build
```

### Step 2: Configure Cursor MCP

Edit `~/.cursor/mcp.json` (create if it doesn't exist):

**Windows:**
```
C:\Users\<YourUsername>\.cursor\mcp.json
```

**macOS/Linux:**
```
~/.cursor/mcp.json
```

Add this configuration:

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

### Step 3: Start the Server

Open a terminal in the project directory:

```bash
npm run dev
```

You should see:
```
🚀 Server listening on http://0.0.0.0:3000
OpenAPI Control Plane MCP Server started!
```

### Step 4: Restart Cursor

**Important:** Completely quit and reopen Cursor (not just reload window).

### Step 5: Verify Integration

1. Look for the **MCP icon** in Cursor's sidebar (usually bottom-left)
2. Click on **"openapi-mcp"**
3. You should see **10 tools** listed:
   - spec_read
   - spec_validate
   - metadata_update
   - schema_manage
   - endpoint_manage
   - version_control
   - parameters_configure
   - responses_configure
   - security_configure
   - references_manage

## 💬 Example Usage

### Reading an OpenAPI Spec

```
Ask Cursor: "Read the OpenAPI spec for my-api version v1.0.0"
```

The AI will use the `spec_read` tool to fetch the specification.

### Listing Endpoints

```
Ask Cursor: "List all endpoints in my-api v1.0.0"
```

### Adding a Schema

```
Ask Cursor: "Add a new schema called User to my-api v1.0.0 with properties: id (integer), name (string), email (string, format email)"
```

The AI will use `schema_manage` to add the schema.

### Validating a Spec

```
Ask Cursor: "Validate the my-api v1.0.0 specification and show any errors"
```

### Creating a New Version

```
Ask Cursor: "Create a new version v1.1.0 of my-api based on v1.0.0 with description 'Added User schema'"
```

### Comparing Versions

```
Ask Cursor: "Compare my-api versions v1.0.0 and v1.1.0 and show the differences"
```

## 🔧 Troubleshooting

### Tools Not Appearing in Cursor

**1. Check if the server is running:**
```bash
curl http://localhost:3000/health
```

Expected response:
```json
{
  "status": "healthy",
  "timestamp": "2025-01-11T12:00:00.000Z",
  "version": "1.0.1"
}
```

**2. Test the MCP endpoint:**
```bash
# PowerShell
$body = @{ jsonrpc = "2.0"; id = 1; method = "tools/list" } | ConvertTo-Json
Invoke-RestMethod -Uri "http://localhost:3000/mcp/sse" -Method POST -Body $body -ContentType "application/json"

# Bash
curl -X POST http://localhost:3000/mcp/sse \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","id":1,"method":"tools/list"}'
```

You should see all 10 tools in the response.

**3. Check Cursor's MCP configuration:**
- Open `~/.cursor/mcp.json`
- Verify the URL is `http://localhost:3000/mcp/sse`
- Verify `transport` is `"sse"`

**4. Check Cursor's Developer Console:**
- In Cursor: `Help > Toggle Developer Tools`
- Go to Console tab
- Look for MCP-related errors

**5. Restart everything:**
```bash
# Kill all Node processes
# Windows PowerShell:
Get-Process node | Stop-Process -Force

# macOS/Linux:
pkill node

# Restart the server
npm run dev

# Completely quit and reopen Cursor
```

### Server Crashes or Won't Start

**Check Node.js version:**
```bash
node --version
```

Must be v20.0.0 or higher.

**Check port 3000 is available:**
```bash
# Windows PowerShell:
Get-NetTCPConnection -LocalPort 3000

# macOS/Linux:
lsof -i :3000
```

If port 3000 is in use, either:
- Kill the process using it
- Change the port in `.env`: `PORT=3001`

**View server logs:**
```bash
npm run dev
```

Look for any error messages in the console.

### "No tools, prompts, or resources" Error

This usually means the server is running but Cursor can't fetch the tools list.

**Solution:**
1. Stop the server (`Ctrl+C`)
2. Rebuild: `npm run build`
3. Restart: `npm run dev`
4. Wait 10 seconds for the server to fully initialize
5. Completely restart Cursor (quit and reopen)
6. Wait 10-15 seconds after reopening

## 🎨 Advanced Configuration

### Custom Port

Edit `.env`:
```env
PORT=3001
```

Update Cursor config:
```json
{
  "mcpServers": {
    "openapi-mcp": {
      "url": "http://localhost:3001/mcp/sse",
      "transport": "sse"
    }
  }
}
```

### Custom Data Directory

Edit `.env`:
```env
DATA_DIR=/path/to/your/api/specs
```

### Enable Debug Logging

Edit `.env`:
```env
LOG_LEVEL=debug
LOG_PRETTY=true
```

### Custom x- Attributes

Add to `.env`:
```env
X_ATTRIBUTE_INFO_LOGO=Logo URL for API info
X_ATTRIBUTE_INFO_CATEGORY=API category
X_ATTRIBUTE_ENDPOINT_TEAM=Team owning this endpoint
X_ATTRIBUTE_ENDPOINT_DEPRECATED_BY=Replacement endpoint path
X_ATTRIBUTE_SCHEMA_EXAMPLE=Example value
```

## 📊 Monitoring

### Check Server Status

```bash
curl http://localhost:3000/health
```

### List Available Tools

```bash
curl http://localhost:3000/tools
```

### View Audit Logs

Audit logs are stored in `data/audit/`:
```bash
ls -la data/audit/
```

### Test Specific Operations

See [HTTP-TESTING.md](./HTTP-TESTING.md) for comprehensive testing examples.

## 🔐 Security Notes

**Development Mode:**
- No authentication required
- Server listens on `0.0.0.0` (all interfaces)
- Debug logging enabled

**Production Mode (Coming in v1.1.0):**
- JWT/JWK authentication
- Restricted to localhost or specific IPs
- Audit logging to secure storage
- HTTPS support

## 📚 Next Steps

- **Read the [README](./README.md)** for a complete overview
- **Explore [HTTP Testing Guide](./HTTP-TESTING.md)** for API examples
- **Check [AGENTS.md](./AGENTS.md)** for development guidance
- **Review [Documentation](./docs)** for architecture details

## 💡 Tips

1. **Keep the server running**: Start it once and leave it running during development
2. **Use version control**: Create versions before making changes to easily rollback
3. **Validate often**: Use `spec_validate` after making changes
4. **Audit reasoning**: Add meaningful `llmReason` to track why changes were made
5. **Test locally first**: Use HTTP testing before integrating with Cursor

## 🆘 Getting Help

- **Logs**: Check server console output
- **Debugging**: Enable debug logging in `.env`
- **Testing**: Use HTTP endpoints to isolate issues
- **Issues**: Create a GitHub issue with logs and steps to reproduce

---

**Happy API Development with AI! 🚀**

*Questions? Check [CURSOR-TROUBLESHOOTING.md](./CURSOR-TROUBLESHOOTING.md) for detailed troubleshooting.*

