# Cursor MCP Troubleshooting - "No tools, prompts, or resources"

## ❌ **Current Problem**

Your Cursor is showing "openapi-mcp" with "No tools, prompts, or resources" even though:
- ✅ The server is running
- ✅ All 10 tools are implemented
- ✅ The server is responding with valid JSON Schema
- ❌ But Cursor can't display the tools

## 🔍 **Root Cause**

The logs show Cursor is connecting to the **HTTP/SSE server** (`POST /mcp/sse`) instead of the **stdio server**. The MCP SDK's stdio transport is what Cursor actually needs for proper tool integration.

## 🎯 **Solution Steps**

### Step 1: Find Your Cursor MCP Configuration

Your Cursor MCP server is configured somewhere. We need to find it. Try these locations:

#### Option A: Through Cursor UI

1. Open Cursor Command Palette: `Ctrl+Shift+P`
2. Search for: `MCP`
3. Look for commands like:
   - "MCP: Configure Servers"
   - "MCP: Edit Settings"
   - "MCP: Open Configuration"
   - "Preferences: Open Settings (JSON)"

#### Option B: Manual File Search

The configuration might be in:

```powershell
# Search for MCP config files
Get-ChildItem -Path "$env:APPDATA\Cursor" -Recurse -Filter "*.json" -ErrorAction SilentlyContinue | 
  Where-Object { (Get-Content $_.FullName -Raw) -like "*openapi*" -or (Get-Content $_.FullName -Raw) -like "*mcp*" } |
  Select-Object FullName
```

Common locations:
- `%APPDATA%\Cursor\User\settings.json`
- `%APPDATA%\Cursor\User\globalStorage\**\mcp*.json`
- Workspace `.cursor` folder
- Workspace `.vscode` folder

### Step 2: Check Current Configuration

Once you find the MCP config, it probably looks like this (WRONG):

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

### Step 3: Change to Stdio Transport (CORRECT)

Replace it with:

```json
{
  "mcpServers": {
    "openapi-control-plane": {
      "command": "node",
      "args": [
        "D:\\source\\openapi-control-plane-mcp\\dist\\mcp-server.js"
      ],
      "env": {
        "STORAGE_PATH": "D:\\source\\openapi-control-plane-mcp\\data",
        "NODE_ENV": "development"
      }
    }
  }
}
```

**IMPORTANT:** Replace `D:\\source\\openapi-control-plane-mcp` with your actual project path!

### Step 4: Stop the HTTP Server

The HTTP server (`dist/server.js`) is running in the background and might be interfering:

```powershell
# Kill all Node processes
Get-Process node -ErrorAction SilentlyContinue | Stop-Process -Force
```

### Step 5: Test the Stdio Server

Before restarting Cursor, verify the stdio server works:

```powershell
# From project root
cd D:\source\openapi-control-plane-mcp
npm run build

# Test the server
node dist/mcp-server.js
# Should output: "OpenAPI Control Plane MCP Server running on stdio"
```

Press `Ctrl+C` to stop.

### Step 6: Completely Restart Cursor

1. **Close all Cursor windows**
2. **Quit Cursor completely** (Task Manager if needed)
3. **Reopen Cursor**
4. **Wait 10-15 seconds** for MCP to initialize
5. **Check the MCP panel**

### Step 7: Verify in Cursor

After restart, you should see:

```
openapi-control-plane
  ✓ 10 tools
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
```

## 🔧 **Alternative: Manual MCP Extension Setup**

If Cursor doesn't have built-in MCP support, you might need an extension:

1. Open Cursor Extensions: `Ctrl+Shift+X`
2. Search for: "Model Context Protocol" or "MCP"
3. Install the MCP extension
4. Follow the extension's setup instructions

## 🐛 **Debugging Commands**

### Check if the config file exists

```powershell
# Check workspace
Get-ChildItem -Path "D:\source\openapi-control-plane-mcp" -Filter "*.json" -Recurse | 
  Select-Object FullName | 
  Where-Object { $_ -like "*mcp*" -or $_ -like "*cursor*" }
```

### View Cursor's Developer Console

1. In Cursor: `Help > Toggle Developer Tools`
2. Go to Console tab
3. Look for MCP-related errors
4. Search for: "mcp", "tools", "initialize"

### Test JSON-RPC over stdio

```powershell
# Send a tools/list request
$request = '{"jsonrpc":"2.0","id":1,"method":"tools/list"}'
$request | node dist/mcp-server.js
```

You should see a JSON response with all 10 tools.

## 📋 **What to Look For**

When you find the MCP config, check:

1. **Transport type**: Should be `stdio` (with `command` + `args`), NOT `sse` or `http`
2. **File paths**: Must use absolute paths with double backslashes on Windows
3. **Server name**: Can be anything, but must be unique
4. **Node.js in PATH**: Run `node --version` to verify

## 🚨 **Common Issues**

### Issue: "command not found" or "node not found"

**Solution:** Use full path to Node.js:

```json
{
  "command": "C:\\Program Files\\nodejs\\node.exe",
  "args": ["D:\\source\\openapi-control-plane-mcp\\dist\\mcp-server.js"]
}
```

### Issue: Cursor shows connection error

**Solution:** Check the logs in Developer Tools Console for specific error messages.

### Issue: Tools appear but immediately disappear

**Solution:** The server might be crashing. Test it manually:

```powershell
node dist/mcp-server.js
# Should stay running, not exit immediately
```

## 📞 **Next Steps**

Please:

1. **Find your MCP configuration file** using the steps above
2. **Share the current configuration** (or screenshot)
3. **Try changing to stdio transport** if it's using SSE/HTTP
4. **Restart Cursor completely**
5. **Check if tools appear**

If it still doesn't work after these steps, please share:
- The MCP configuration you found
- Any errors from Cursor's Developer Console
- Output from `node dist/mcp-server.js`

---

**The server code is perfect! We just need to connect Cursor to the right endpoint!** 🎯

