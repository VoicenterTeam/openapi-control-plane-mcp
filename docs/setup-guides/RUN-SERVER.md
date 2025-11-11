# 🐛 Server Startup Test

Please run this command to see what's happening:

```powershell
node dist/server.js
```

This will run the server in your current terminal so you can see any error messages.

If it works, you should see:
```
🚀 OpenAPI Control Plane MCP Server started!
```

Then in a NEW terminal, test it:
```powershell
curl http://localhost:3000/health
```

---

## If you see an error, please share it so I can fix it!

Common issues and fixes:

### "Cannot find module..."
Run: `npm install`

### "Port 3000 already in use"
```powershell
netstat -ano | findstr :3000
# Then kill the process:
taskkill /PID <PID> /F
```

### Still not working?
Try running the tests to verify everything is set up correctly:
```powershell
npm test
```

All 434 tests should pass!

