# 🎮 How to Connect to Cursor IDE

## ✅ Step 1: Build the Server (DONE!)

```bash
npm run build
```

**Status:** ✅ Already built! The `dist/` folder is ready.

## 📝 Step 2: Configure Cursor IDE

You need to add the MCP server configuration to Cursor's settings.

### Find Your Cursor MCP Settings File:

**Windows:** `%APPDATA%\Cursor\User\globalStorage\saoudrizwan.claude-dev\settings\cline_mcp_settings.json`

Or try this path: `C:\Users\YOUR_USERNAME\AppData\Roaming\Cursor\User\globalStorage\saoudrizwan.claude-dev\settings\cline_mcp_settings.json`

**Mac/Linux:** `~/.cursor/User/globalStorage/saoudrizwan.claude-dev/settings/cline_mcp_settings.json`

### Add This Configuration:

I've created a config file for you: `cursor-mcp-config.json`

Copy its contents into your Cursor MCP settings file:

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

**Note:** The paths are already set correctly for your machine! If the file doesn't exist, create it.

## 🔄 Step 3: Restart Cursor IDE

1. **Close Cursor completely** (make sure it's not in system tray)
2. **Reopen Cursor**
3. Open the **Claude/Cline panel** (usually on the left sidebar)
4. Look for MCP tools - you should see our 10 OpenAPI tools available!

## 🧪 Step 4: Test It!

Try asking Claude in Cursor:

### Basic Test:
```
"What MCP tools are available?"
```

### Create Your First API:
```
"Create a new OpenAPI spec for 'my-test-api' version v1.0.0 with title 'My Test API' and description 'A test API for learning'"
```

### List APIs:
```
"List all available OpenAPI specs"
```

### Add a Schema:
```
"Add a User schema to my-test-api v1.0.0 with properties: id (string), name (string), email (string)"
```

### Add an Endpoint:
```
"Add a GET /users endpoint to my-test-api v1.0.0 that returns a list of users"
```

## 🛠️ Available Tools (All 10!)

1. **spec_read** - Read and inspect OpenAPI specs
2. **spec_validate** - Validate specs with Spectral linter
3. **metadata_update** - Update API metadata (title, description, version info, etc.)
4. **schema_manage** - Add/update/delete/list schemas (data models)
5. **endpoint_manage** - Add/update/delete/list API endpoints
6. **version_control** - Create versions, compare, set current, manage history
7. **parameters_configure** - Manage parameters (query, path, header, cookie)
8. **responses_configure** - Manage API responses (status codes, content types)
9. **security_configure** - Manage security schemes (API keys, OAuth, JWT)
10. **references_manage** - Find and manage $ref references across the spec

## 🐛 Troubleshooting

### "Module not found" errors
```bash
npm install
npm run build
```

### "Cannot find MCP server" in Cursor
- Check that the path in `cursor-mcp-config.json` matches your actual project location
- Make sure you've restarted Cursor COMPLETELY
- Check Cursor's developer console (Help → Toggle Developer Tools) for errors

### "Server not responding"
- Make sure the `data/` directory exists (it should - we created it!)
- Try running the server manually to test:
```bash
npm run start:mcp
```
Press Ctrl+C to stop it, then try connecting from Cursor again.

### Still having issues?
Check the logs in `data/logs/` directory for detailed error messages!

## 🚀 Next Steps

Once connected, you can:
- Create multiple API specs
- Manage versions of each API
- Compare versions to see what changed
- Validate specs to catch errors
- Use version control to track changes
- Collaborate with AI to build complete OpenAPI specifications!

## 📚 Want to Learn More?

- Check `AGENTS.md` for the complete architecture
- Run `npm test` to see all 434 passing tests
- Explore the `src/tools/` directory to see how each tool works
- Read the JSDoc comments - they're technically accurate AND funny! 😄

---

**Ready to build some APIs? Let's go!** 🚀

