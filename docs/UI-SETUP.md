# UI Setup Guide

This guide will help you get the OpenAPI Control Panel UI up and running.

## Prerequisites

- Node.js >= 20.0.0
- npm or yarn
- Backend server running (see main README.md)

## Installation

```bash
# From project root
cd ui
npm install
```

## Development

### Run UI Dev Server

```bash
# From ui/ directory
npm run dev
```

The UI will be available at http://localhost:3000

The dev server proxies API requests to http://localhost:3001/api (backend).

### Run Backend + UI Together

```bash
# From project root
npm run dev:all
```

This runs both backend and UI concurrently.

## Production Build

```bash
# Build UI
npm run build

# Preview production build
npm run preview
```

## Environment Configuration

The UI uses Nuxt's runtime config. To configure:

### Development

Edit `nuxt.config.ts`:

```typescript
export default defineNuxtConfig({
  runtimeConfig: {
    public: {
      apiBase: '/api' // API endpoint base
    }
  }
})
```

### Production

Set environment variables:

```bash
NUXT_PUBLIC_API_BASE=/api
```

## Features

### Dashboard

- Total specs, versions, endpoints count
- Apache ECharts visualizations
- Recent activity timeline
- Specs by tag pie chart
- Breaking changes alerts

### Specs List

- Grid view of all API specs
- Search by name, owner, tags
- Real-time filtering
- Click to view spec detail

### OpenAPI Viewer

- Full spec rendering
- Endpoints grouped by tags
- HTTP method badges
- Schema explorer
- Version selector

### Versions Page

- Complete version history
- Change summaries
- Breaking changes highlights
- Version comparison (planned)

### Audit Log

- Complete audit trail
- Filter by event type, user, date
- LLM reasoning capture
- Colored event badges

## Customization

### Voicenter Branding

Brand colors are configured in:
- `assets/css/voicenter-theme.css`
- `tailwind.config.ts`

To use different brand colors:

1. Edit CSS variables in `voicenter-theme.css`
2. Update Tailwind config colors
3. Replace `public/voicenter-logo.svg`

See `docs/voicenter-brand-colors.md` for details.

### Dark Mode

The UI supports dark mode via `@nuxtjs/color-mode`.

Toggle dark mode using the icon in the header.

## Troubleshooting

### API Connection Issues

If the UI can't connect to the API:

1. Check backend is running on port 3001
2. Check `nuxt.config.ts` devProxy configuration
3. Check browser console for CORS errors
4. Verify `NUXT_PUBLIC_API_BASE` environment variable

### Build Errors

If you encounter build errors:

```bash
# Clear Nuxt cache
rm -rf .nuxt .output

# Reinstall dependencies
rm -rf node_modules
npm install

# Rebuild
npm run build
```

### Missing Types

If TypeScript complains about missing types:

```bash
# Generate Nuxt types
npm run postinstall
```

## Project Structure

```
ui/
├── assets/          # CSS, theme
├── components/      # Vue components
│   ├── layout/     # Header, Sidebar
│   └── *.vue       # Shared components
├── composables/     # Data fetching hooks
├── layouts/         # Page layouts
├── pages/           # Routes (5 pages)
│   ├── index.vue           # Dashboard
│   ├── specs/
│   │   ├── index.vue       # Specs list
│   │   ├── [apiId].vue     # Spec viewer
│   │   └── [apiId]/
│   │       └── versions.vue # Versions
│   └── audit.vue            # Audit log
├── public/          # Static files
├── types/           # TypeScript types
├── app.vue          # Root component
├── nuxt.config.ts   # Nuxt config
└── package.json     # Dependencies
```

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run generate` - Generate static site (not used)

## Next Steps

- Add authentication
- Implement spec editor
- Add version comparison
- Export audit log to CSV
- Add more charts to dashboard

## Support

For issues or questions:
- Check main [README.md](../README.md)
- Read [AGENTS.md](../docs/AGENTS.md)
- Check [API Reference](./api-reference.md)

