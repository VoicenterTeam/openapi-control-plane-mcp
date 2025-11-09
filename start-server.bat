@echo off
echo.
echo ========================================
echo  OpenAPI Control Plane MCP Server
echo ========================================
echo.
echo Killing any existing Node.js processes...
taskkill /F /IM node.exe >nul 2>&1
timeout /t 2 >nul
echo.
echo Starting server on http://localhost:3000
echo.
echo Press Ctrl+C to stop the server
echo ========================================
echo.
node dist/server.js

