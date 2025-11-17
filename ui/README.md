# OpenAPI Control Panel UI

Modern Nuxt.js/Vue 3 dashboard for managing OpenAPI specifications with Voicenter branding.

## Features

- 📊 Dashboard with Apache ECharts visualizations
- 📝 Specs list with search and filters
- 🔍 OpenAPI spec viewer
- 📜 Version history with change tracking
- 📋 Audit log with filtering
- 🎨 Voicenter red branding

## Setup

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

## Development

The UI runs on port 3000 by default and proxies API calls to the Fastify backend on port 3001.

## Tech Stack

- **Nuxt 3** - Vue 3 framework with SSR
- **@nuxt/ui** - TailwindCSS components
- **Apache ECharts** - Data visualizations
- **TypeScript** - Type safety
- **Voicenter Branding** - Custom red theme

