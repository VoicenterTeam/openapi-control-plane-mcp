# OpenAPI Control Plane MCP Server

A production-ready Model Context Protocol (MCP) server for managing OpenAPI/Swagger specifications with version control, audit trails, and LLM-driven editing capabilities.

## Features

- 🔧 **10 Comprehensive MCP Tools** - Complete CRUD operations for OpenAPI specs
- 📚 **Version Control** - Semantic versioning with rollback capabilities  
- ✅ **Validation & Linting** - Integration with Spectral for OpenAPI best practices
- 🔍 **Breaking Change Detection** - Automatic detection using oasdiff
- 📝 **Audit Trail** - Complete audit logging with LLM reasoning capture
- 🎨 **Custom x- Attributes** - Configurable OpenAPI extensions
- 🏗️ **Storage Abstraction** - Easy migration from filesystem to S3/Redis
- 🧪 **Comprehensive Testing** - 80%+ test coverage with Jest
- 🐳 **Docker Ready** - Debian-based container with PM2 runtime

## Quick Start

### Prerequisites

- Node.js 20+
- npm or yarn

### Installation

```bash
# Clone repository
git clone https://github.com/your-org/openapi-control-plane-mcp.git
cd openapi-control-plane-mcp

# Install dependencies
npm install

# Configure environment
cp .env.example .env
# Edit .env with your settings

# Start development server
npm run dev
```

### Usage

The MCP server exposes 10 tools for OpenAPI management:

1. **spec_read** - Query OpenAPI specifications
2. **spec_validate** - Validate specs with Spectral
3. **metadata_update** - Update API metadata
4. **schema_manage** - CRUD operations on schemas
5. **endpoint_manage** - Manage API endpoints
6. **parameters_configure** - Configure request parameters
7. **responses_configure** - Define response specifications
8. **references_manage** - Handle $ref operations
9. **security_configure** - Manage security schemes
10. **spec_version** - Version control operations

## Architecture

```
┌─────────────┐
│     LLM     │
│   (Claude)  │
└──────┬──────┘
       │ MCP Protocol
       │
┌──────▼──────────────────────────┐
│   Fastify HTTP Server          │
│   + MCP Server                 │
└──────┬──────────────────────────┘
       │
┌──────▼──────────────────────────┐
│   MCP Tools (10 tools)         │
│   - BaseTool Pattern           │
│   - Zod Validation             │
│   - Audit Logging              │
└──────┬──────────────────────────┘
       │
┌──────▼──────────────────────────┐
│   Services Layer               │
│   - SpecManager                │
│   - VersionManager             │
│   - Validator                  │
│   - AuditLogger                │
└──────┬──────────────────────────┘
       │
┌──────▼──────────────────────────┐
│   Storage Abstraction          │
│   - BaseStorageProvider        │
│   - FileSystemStorage          │
│   - (Future: S3, Redis)        │
└────────────────────────────────┘
```

## Custom x- Attributes

Configure custom OpenAPI extensions via environment variables:

```bash
X_ATTRIBUTE_INFO_LOGO=Logo URL for the API
X_ATTRIBUTE_ENDPOINT_TEAM=Team responsible for this endpoint
X_ATTRIBUTE_PARAMETER_HINT=Parameter usage hint for LLM
X_ATTRIBUTE_SCHEMA_CATEGORY=Schema category for organization
```

Access via unflatify: `endpoint.properties.logo`

## Development

```bash
# Run tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage

# Debug tests
npm run test:debug

# Lint code
npm run lint

# Fix lint issues
npm run lint:fix

# Format code
npm run format

# Build for production
npm run build
```

## Testing

- **Unit Tests**: `tests/unit/` - Test individual functions and classes
- **Integration Tests**: `tests/integration/` - Test complete workflows
- **Coverage**: 80%+ required on all metrics
- **Fixtures**: `tests/fixtures/` - Sample OpenAPI specs with x- attributes

## Docker Deployment

```bash
# Build Docker image
npm run docker:build

# Start container with docker-compose
npm run docker:run

# View logs
npm run docker:logs

# Stop container
npm run docker:stop
```

The container runs on Debian with Node.js 20 and PM2 for process management.

## Documentation

- [Foundation & Tooling](./docs/foundation-tooling/README.md) - Project setup
- [AGENTS.md](./AGENTS.md) - Guide for AI coding agents
- [CONTRIBUTING.md](./.github/CONTRIBUTING.md) - Contribution guidelines _(coming soon)_
- [Architecture](./docs/architecture/README.md) - System design _(coming soon)_
- [API & Tools](./docs/api-tools-testing/README.md) - Complete tools reference _(coming soon)_

## Project Status

✅ Part 1: Foundation & Tooling Setup  
🔄 Part 2-26: In active development

Target: Production-ready v1.0.0 in 4-6 weeks

## License

MIT

## Contributing

Contributions welcome! Please read [CONTRIBUTING.md](./.github/CONTRIBUTING.md) and follow the code style guidelines.

## Code Style

- **Uncle Bob's Clean Code** principles
- **Airbnb ESLint** configuration
- **Prettier** formatting
- **Humorous JSDoc** required
- **camelCase** for variables, **PascalCase** for classes

---

Built with ❤️ and a sense of humor 😄

