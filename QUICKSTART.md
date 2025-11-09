# 🎮 How to Connect to Cursor IDE

## Step 1: Build the Server

```bash
npm run build
```

## Step 2: Configure Cursor IDE

Add this to your Cursor MCP settings file:

**On Windows:** `%APPDATA%\Cursor\User\globalStorage\saoudrizwan.claude-dev\settings\cline_mcp_settings.json`

**On Mac/Linux:** `~/.cursor/User/globalStorage/saoudrizwan.claude-dev/settings/cline_mcp_settings.json`

```json
{
  "mcpServers": {
    "openapi-control-plane": {
      "command": "node",
      "args": [
        "D:\\source\\openapi-control-plane-mcp\\dist\\mcp-server.js"
      ],
      "env": {
        "STORAGE_PATH": "D:\\source\\openapi-control-plane-mcp\\data"
      }
    }
  }
}
```

**Important:** Replace `D:\\source\\openapi-control-plane-mcp` with your actual project path!

## Step 3: Restart Cursor IDE

1. Close Cursor completely
2. Reopen Cursor
3. Open the Claude/Cline panel
4. You should see the OpenAPI Control Plane tools available!

## Step 4: Test It!

Try asking Claude in Cursor:

```
"List all available MCP tools"
```

Or:

```
"Create a new OpenAPI spec for test-api version v1.0.0 with title 'Test API'"
```

## Available Tools

All 10 tools are ready:

1. **spec_read** - Read OpenAPI specs
2. **spec_validate** - Validate specs with Spectral
3. **metadata_update** - Update API metadata (title, description, etc.)
4. **schema_manage** - Add/update/delete/list schemas
5. **endpoint_manage** - Add/update/delete/list endpoints
6. **version_control** - Create/compare/manage versions
7. **parameters_configure** - Manage parameters
8. **responses_configure** - Manage responses
9. **security_configure** - Manage security schemes
10. **references_manage** - Find/validate/$ref management

## Troubleshooting

### "Module not found" errors
Run `npm install` to ensure all dependencies are installed.

### "Cannot find file" errors
Make sure you've run `npm run build` first!

### "Server not connecting"
- Check the path in the JSON config is correct
- Make sure `STORAGE_PATH` directory exists
- Check Cursor's developer console for errors

### Still having issues?
Check the logs in your `STORAGE_PATH/logs` directory!

## Quick Test (Without Cursor)

You can also test the tools directly:

```bash
npm test
```

All 434 tests should pass! ✅

