# OpenAPI Control Panel MCP Server

> **Version 1.0.1** - Production-ready MCP server for OpenAPI/Swagger specification management with LLM-driven editing capabilities.

[![Node.js](https://img.shields.io/badge/node-%3E%3D20.0.0-brightgreen)](https://nodejs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.3-blue)](https://www.typescriptlang.org/)
[![Tests](https://img.shields.io/badge/tests-531%20passing-success)](./tests)
[![Coverage](https://img.shields.io/badge/coverage-82.31%25%20branches-brightgreen)](./docs/coverage-reports)
[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)

## 🎯 Overview

A powerful Model Context Protocol (MCP) server that enables AI assistants (like Claude, GPT-4, Cursor IDE) to manage OpenAPI specifications programmatically. Perfect for teams building and maintaining REST APIs with version control, validation, and collaborative editing.

### ✨ Key Features

- **🛠️ 10 Comprehensive MCP Tools**: Read, validate, and modify OpenAPI specs
- **📦 Version Control**: Full versioning with diffs, comparisons, and rollback
- **✅ Validation**: Built-in Spectral validation with configurable rules
- **🔍 Audit Logging**: Track all changes with LLM reasoning capture
- **🚀 Dual Transport**: SSE/HTTP and stdio protocols supported
- **💾 Storage Abstraction**: File-based storage (easily extensible to S3/Redis)
- **🎨 Custom Extensions**: Support for OpenAPI `x-` attributes
- **📊 531 Tests (82.31% coverage)**: Professional-grade test coverage

## 🚀 Quick Start

### Installation

```bash
# Clone the repository
git clone <repository-url>
cd openapi-control-panel-mcp

# Install dependencies
npm install

# Build the project
npm run build

# Run tests
npm test
```

### Starting the Server

#### Option 1: SSE/HTTP Transport (Recommended for Cursor IDE)

```bash
# Development mode with hot reload
npm run dev

# Production mode
node dist/server.js
```

Server will be available at: `http://localhost:3000`

#### Option 2: Stdio Transport (For CLI/Terminal Integration)

```bash
npm run start:mcp
```

### Configuration

Create a `.env` file in the project root:

```env
# Server Configuration
PORT=3000
NODE_ENV=development

# Storage
DATA_DIR=./data

# Logging
LOG_LEVEL=info
LOG_PRETTY=true

# Custom x- Attributes (Optional)
X_ATTRIBUTE_INFO_LOGO=Logo URL for API
X_ATTRIBUTE_INFO_CATEGORY=API category
X_ATTRIBUTE_ENDPOINT_TEAM=Owning team name
```

## 🔧 MCP Tools

### 1. **spec_read** - Read OpenAPI Specifications
Query specs with flexible filters: full spec, endpoints list, specific endpoint details, schema definitions, server info.

### 2. **spec_validate** - Validate Specifications
Run Spectral validation with configurable severity filters (error, warning, info, hint).

### 3. **metadata_update** - Update API Metadata
Modify info section: title, description, contact, license, terms of service, custom extensions.

### 4. **schema_manage** - Manage Schema Definitions
Add, update, delete, and list schemas in `components.schemas`.

### 5. **endpoint_manage** - Manage API Endpoints
Create, update, delete, and list API paths and operations.

### 6. **version_control** - Version Management
Create versions, compare specs, view diffs, detect breaking changes, rollback.

### 7. **parameters_configure** - Configure Parameters
Manage query params, path params, headers, and cookies at path or operation level.

### 8. **responses_configure** - Configure Responses
Define response schemas, status codes, content types, and headers.

### 9. **security_configure** - Security Configuration
Manage security schemes (API keys, OAuth2, JWT) and global security requirements.

### 10. **references_manage** - Manage $ref References
Find component usages, validate references, update reference paths across specs.

## 📖 Documentation

### Quick Links

- **[Getting Started](./docs/foundation-tooling/README.md)** - Initial setup and architecture
- **[Tools Reference](./docs/api-tools-testing/TOOLS.md)** - Complete MCP tools documentation
- **[HTTP Testing](./HTTP-TESTING.md)** - REST API testing guide
- **[Cursor Integration](./CURSOR-MCP-SETUP.md)** - Cursor IDE setup instructions
- **[Troubleshooting](./CURSOR-TROUBLESHOOTING.md)** - Common issues and solutions
- **[Agent Guide](./AGENTS.md)** - AI coding assistant instructions

### Documentation Structure

```
docs/
├── foundation-tooling/     # Project setup and tooling
├── types-interfaces/       # TypeScript types and interfaces
├── utilities-logging/      # Logger, errors, validation
├── storage-abstraction/    # Storage layer and file system
├── tool-spec-read/        # spec_read tool documentation
├── tool-spec-validate/    # spec_validate tool documentation
├── tool-metadata-update/  # metadata_update tool documentation
├── tool-schema-manage/    # schema_manage tool documentation
├── tool-endpoint-manage/  # endpoint_manage tool documentation
├── tool-version-control/  # version_control tool documentation
├── tool-parameters/       # parameters_configure tool documentation
├── tool-responses/        # responses_configure tool documentation
├── tool-security/         # security_configure tool documentation
├── tool-references/       # references_manage tool documentation
└── architecture/          # System design and patterns
```

## 🔌 Integration with Cursor IDE

### Setup

1. **Add to Cursor MCP Configuration** (`~/.cursor/mcp.json`):

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

2. **Start the server**:
```bash
npm run dev
```

3. **Restart Cursor IDE** completely (quit and reopen)

4. **Verify**: Check MCP panel - you should see 10 tools available

### Example Usage in Cursor

```
Ask Claude: "Read the OpenAPI spec for my-api version v1.0.0"
Ask Claude: "List all endpoints in my-api"
Ask Claude: "Add a new schema called User to my-api"
Ask Claude: "Validate the my-api specification"
Ask Claude: "Create a new version v1.1.0 of my-api based on v1.0.0"
```

## 🧪 Testing

```bash
# Run all tests
npm test

# Watch mode for development
npm run test:watch

# Coverage report
npm run test:coverage

# Debug tests
npm run test:debug

# Integration tests only
npm run test:integration
```

**Test Statistics:**
- ✅ 434 tests passing
- 📊 80%+ coverage on all metrics
- ⚡ Fast execution (<30s for full suite)

## 🏗️ Architecture

### Core Components

- **Storage Layer**: Abstracted storage with filesystem implementation
- **Services**: SpecManager, VersionManager, ValidationService, AuditLogger
- **Tools**: 10 MCP tools implementing BaseTool interface
- **Server**: Fastify-based HTTP/SSE server + stdio transport

### Data Flow

```
Client (Cursor/CLI)
  ↓
MCP Protocol (SSE/stdio)
  ↓
Server (src/server.ts or src/mcp-server.ts)
  ↓
Tools (src/tools/*.ts)
  ↓
Services (src/services/*.ts)
  ↓
Storage (src/storage/*.ts)
  ↓
File System (data/)
```

## 📁 Project Structure

```
openapi-control-panel-mcp/
├── src/
│   ├── config/           # Configuration management
│   ├── services/         # Business logic services
│   ├── storage/          # Storage abstraction layer
│   ├── tools/            # MCP tools implementation
│   ├── types/            # TypeScript type definitions
│   ├── utils/            # Utilities (logger, errors, validation)
│   ├── server.ts         # HTTP/SSE server (Fastify)
│   └── mcp-server.ts     # Stdio server
├── tests/
│   ├── unit/             # Unit tests
│   ├── integration/      # Integration tests
│   └── fixtures/         # Test fixtures (sample specs)
├── docs/                 # Documentation
├── data/                 # Storage directory (git-ignored)
└── dist/                 # Compiled JavaScript (git-ignored)
```

## 🛠️ Development

### Code Style

- **Variables/Functions**: camelCase
- **Classes**: PascalCase
- **Files**: kebab-case
- **ESLint**: Airbnb base config with TypeScript
- **Prettier**: Single quotes, no semicolons

### Scripts

```bash
npm run dev           # Start development server with hot reload
npm run build         # Build TypeScript to JavaScript
npm test              # Run tests
npm run lint          # Lint code
npm run lint:fix      # Fix linting issues
npm run format        # Format code with Prettier
```

### Adding a New Tool

1. Create tool file in `src/tools/` extending `BaseTool`
2. Define Zod schema for parameters
3. Implement `execute()` and `describe()` methods
4. Add tests in `tests/unit/tools/`
5. Register tool in `src/server.ts` and `src/mcp-server.ts`
6. Document in `docs/tool-<name>/`

## 🚢 Deployment

### Docker (Coming Soon)

```bash
# Build image
npm run docker:build

# Run with docker-compose
npm run docker:run

# View logs
npm run docker:logs

# Stop
npm run docker:stop
```

### Production

```bash
# Build
npm run build

# Set environment
export NODE_ENV=production
export PORT=3000
export DATA_DIR=/var/lib/openapi-mcp/data

# Run with PM2
pm2 start dist/server.js --name openapi-mcp

# Or run directly
node dist/server.js
```

## 🤝 Contributing

Contributions are welcome! Please:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Run tests (`npm test`)
5. Push to the branch (`git push origin feature/amazing-feature`)
6. Open a Pull Request

### Commit Message Format

```
[category] Brief description

Categories: feat, fix, docs, test, refactor, style, chore
Examples:
  [feat] Add endpoint filtering by tags
  [fix] Resolve version comparison bug
  [docs] Update README with examples
  [test] Add integration tests for metadata_update
```

## 📝 License

MIT License - see [LICENSE](LICENSE) file for details

## 🙏 Acknowledgments

- Built with [Model Context Protocol SDK](https://github.com/modelcontextprotocol)
- Validation powered by [Spectral](https://stoplight.io/open-source/spectral)
- OpenAPI parsing by [@apidevtools/swagger-parser](https://github.com/APIDevTools/swagger-parser)

## 📚 Documentation

Comprehensive documentation is available in the [`docs/`](./docs) directory:

### Quick Links
- 🚀 **[Quick Start Guide](docs/setup-guides/QUICKSTART.md)** - Get started with Cursor IDE
- 🛠️ **[Developer Guide](docs/AGENTS.md)** - Development setup and conventions
- 🔧 **[HTTP API Testing](docs/setup-guides/HTTP-TESTING.md)** - Test REST endpoints
- 📊 **[Coverage Report](docs/coverage-reports/COVERAGE-82-PERCENT.md)** - Testing methodology
- 🏗️ **[Architecture](docs/architecture/)** - System design and patterns

### Tool Documentation
- [spec_read](docs/tool-spec-read/) - Read OpenAPI specifications
- [spec_validate](docs/tool-spec-validate/) - Validate specs with Spectral
- [metadata_update](docs/tool-metadata-update/) - Update API metadata
- [schema_manage](docs/tool-schema-manage/) - Manage schemas
- [endpoint_manage](docs/tool-endpoint-manage/) - Manage endpoints
- [version_control](docs/tool-spec-version/) - Version management
- [parameters_configure](docs/tool-parameters-configure/) - Configure parameters
- [responses_configure](docs/tool-responses-configure/) - Configure responses
- [security_configure](docs/tool-security-configure/) - Security setup
- [references_manage](docs/tool-references-manage/) - Manage $ref references

See **[docs/README.md](docs/README.md)** for the complete documentation index.

## 📞 Support

- **Documentation**: [./docs](./docs)
- **Issues**: Create a GitHub issue
- **Discussions**: GitHub Discussions

## 🗺️ Roadmap

- [x] ✅ 10 Core MCP Tools
- [x] ✅ Version Control & Diffing
- [x] ✅ SSE/HTTP Transport
- [x] ✅ Stdio Transport
- [x] ✅ Comprehensive Testing
- [ ] 🔜 Docker Deployment
- [ ] 🔜 S3/Redis Storage Backends
- [ ] 🔜 Authentication (JWT/JWK)
- [ ] 🔜 Web UI Dashboard
- [ ] 🔜 Collaborative Editing
- [ ] 🔜 Git Integration
- [ ] 🔜 CI/CD Pipeline Templates

---

**Made with ❤️ for the API development community**

*Version 1.0.1 - SSE Transport with Flattened JSON Schema Support*
