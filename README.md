# OpenAPI Control Panel MCP Server

[![Tests](https://img.shields.io/badge/tests-passing-green)]()
[![Coverage](https://img.shields.io/badge/coverage-80%25-green)]()
[![License](https://img.shields.io/badge/license-MIT-blue)]()

MCP server for OpenAPI/Swagger specification management with version control, LLM-driven editing, and a beautiful web UI.

## 🎨 Features

### Backend (MCP Server)
- **10 MCP Tools** for complete OpenAPI management
- **Version Control** with diff tracking and breaking change detection
- **Audit Trail** with LLM reasoning capture
- **Validation** with Spectral and SwaggerParser
- **Storage Abstraction** for easy backend switching
- **REST API** for UI integration

### Frontend (Nuxt.js UI)
- **📊 Dashboard** with Apache ECharts visualizations
- **📝 Specs List** with search and filters
- **🔍 OpenAPI Viewer** with endpoint rendering
- **📜 Version History** with change tracking
- **📋 Audit Log** with advanced filtering
- **🎨 Voicenter Red Branding** throughout

## 🚀 Quick Start

### Prerequisites

- Node.js >= 20.0.0
- npm or yarn

### Installation

```bash
# Install backend dependencies
npm install

# Install UI dependencies
cd ui && npm install && cd ..
```

### Development

```bash
# Run backend only (API server on port 3001)
npm run dev

# Run UI only (dev server on port 3000)
npm run dev:ui

# Run both backend and UI concurrently
npm run dev:all
```

Visit:
- **UI**: http://localhost:3000
- **API**: http://localhost:3001

### Production

```bash
# Build everything
npm run build:all

# Start production server
npm start
```

The production server serves both API and UI on the same port (default: 3001).

## 📁 Project Structure

```
openapi-control-plane-mcp/
├── src/                      # Backend source
│   ├── config/              # Configuration
│   ├── services/            # Core services
│   ├── storage/             # Storage layer
│   ├── tools/               # MCP tools (10 tools)
│   ├── types/               # TypeScript types
│   └── utils/               # Utilities
├── ui/                       # Frontend Nuxt.js app
│   ├── assets/              # CSS and theme
│   ├── components/          # Vue components
│   ├── composables/         # Data fetching
│   ├── layouts/             # Page layouts
│   ├── pages/               # 5 main pages
│   ├── public/              # Static assets
│   └── types/               # Frontend types
├── tests/                    # Backend tests (434 passing!)
└── docs/                     # Documentation
```

## 🛠️ MCP Tools

1. **spec_read** - Read OpenAPI specs with custom extensions
2. **spec_validate** - Validate with Spectral
3. **metadata_update** - Update spec metadata
4. **schema_manage** - Manage schemas (add/update/delete)
5. **endpoint_manage** - Manage endpoints
6. **version_control** - Version management and diffing
7. **parameters_configure** - Configure parameters
8. **responses_configure** - Configure responses
9. **security_configure** - Configure security
10. **references_manage** - Manage $refs

## 🎨 UI Pages

1. **Dashboard** (`/`) - Stats and charts with ECharts
2. **Specs List** (`/specs`) - Browse all API specs
3. **OpenAPI Viewer** (`/specs/:apiId`) - View spec details
4. **Versions** (`/specs/:apiId/versions`) - Version history
5. **Audit Log** (`/audit`) - Full audit trail

## 🔧 Configuration

### Environment Variables

```bash
# Backend
PORT=3001
HOST=0.0.0.0
DATA_DIR=./
LOG_LEVEL=info
NODE_ENV=development

# Custom x- attributes
X_ATTRIBUTE_ENDPOINT_LOGO=Logo URL for endpoint
X_ATTRIBUTE_ENDPOINT_DEPRECATED_REASON=Deprecation reason
```

### Voicenter Branding

The UI uses official Voicenter brand colors:
- Primary Red: `#F52222` (hsl(0, 85%, 50%))
- Light Red: `#FABDBD` (hsl(0, 85%, 85%))
- Dark Red: `#750B0B` (hsl(0, 85%, 25%))

See `docs/voicenter-brand-colors.md` for details.

## 📚 API Endpoints

### UI REST API

- `GET /api/specs` - List all specs
- `GET /api/specs/:apiId` - Get spec details
- `GET /api/specs/:apiId/versions` - List versions
- `GET /api/specs/:apiId/versions/:version` - Get specific version
- `PUT /api/specs/:apiId` - Update spec
- `GET /api/audit` - Get audit log
- `GET /api/audit/:apiId` - Get API-specific audit log
- `GET /api/stats` - Dashboard statistics

### MCP Endpoints

- `GET /health` - Health check
- `GET /tools` - List MCP tools
- `POST /tools/:toolName` - Execute tool
- `GET /mcp/sse` - SSE connection
- `POST /mcp/sse` - MCP protocol messages

## 🧪 Testing

```bash
# Run all tests
npm test

# Watch mode
npm run test:watch

# Coverage
npm run test:coverage

# Integration tests only
npm run test:integration
```

**Current Status**: 434 tests passing! 🎉

## 🐳 Docker

```bash
# Build
npm run docker:build

# Run
npm run docker:run

# Stop
npm run docker:stop

# Logs
npm run docker:logs
```

## 📖 Documentation

- [AGENTS.md](docs/AGENTS.md) - Developer guide
- [Tool Documentation](docs/tool-*/README.md) - Each tool documented
- [Architecture](docs/architecture/README.md) - System design
- [Voicenter Branding](docs/voicenter-brand-colors.md) - Brand colors

## 🤝 Contributing

1. Read [docs/AGENTS.md](docs/AGENTS.md)
2. Follow Uncle Bob's principles
3. Add JSDoc with humor
4. Write tests (maintain 80%+ coverage)
5. Use conventional commit messages

## 📝 License

MIT

## 🎯 Roadmap

- [x] 10 MCP tools complete
- [x] SSE/HTTP transport
- [x] Beautiful Nuxt.js UI with Voicenter branding
- [x] Dashboard with ECharts
- [x] OpenAPI viewer
- [x] Version history
- [x] Audit log
- [ ] Authentication
- [ ] Multi-user support
- [ ] S3 storage backend
- [ ] Redis caching
- [ ] Kubernetes deployment

## 💡 Credits

Built with:
- [Fastify](https://www.fastify.io/) - Fast backend framework
- [Nuxt.js](https://nuxt.com/) - Vue 3 framework
- [Apache ECharts](https://echarts.apache.org/) - Data visualization
- [@nuxt/ui](https://ui.nuxt.com/) - TailwindCSS components
- [MCP SDK](https://modelcontextprotocol.io/) - Model Context Protocol

**Voicenter** - VoIP/Telecom Platform Branding

---

**Made with ❤️ and lots of ☕**
