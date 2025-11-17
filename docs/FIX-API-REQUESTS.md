# 🚨 IMPORTANT: API Requests Not Working - Fix Required

## Problem

The API requests from the UI are failing because both servers are trying to run on the same port (3000).

## Solution

Create a `.env` file in the **project root** (not in the `ui/` folder) with the following content:

```bash
# Backend API port (Nuxt dev server will proxy /api requests to this port)
PORT=3001
HOST=0.0.0.0
NODE_ENV=development

# Data storage
DATA_DIR=./data
```

## Why This is Needed

- The Nuxt UI dev server runs on `http://localhost:3000`
- The Fastify backend needs to run on a different port (`3001`)
- The Nuxt proxy (configured in `ui/nuxt.config.ts`) forwards `/api` requests from port 3000 to port 3001
- Without this `.env` file, both servers try to use port 3000, causing conflicts

## Steps to Fix

1. **Stop the running servers** (press Ctrl+C in the terminal)
2. **Create the `.env` file** in the project root with the content above
3. **Restart the servers**: `npm run dev:all`
4. **Refresh your browser** at http://localhost:3000

The UI should now successfully communicate with the API!

## Verification

After restarting, you should see in your terminal:
- Fastify server starting on port 3001
- Nuxt dev server starting on port 3000

And in your browser:
- The dashboard should load with stats
- No console errors about failed API requests

---

**Note:** The `.env` file is intentionally in `.gitignore` for security reasons. Each developer needs to create their own local copy.

