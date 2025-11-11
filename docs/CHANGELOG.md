# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.1] - 2025-01-11

### Added
- SSE/HTTP transport support for MCP protocol
- JSON Schema flattening for SSE transport (resolves `$ref` definitions)
- Cursor IDE integration support via SSE endpoint
- Comprehensive README with quick start guide
- HTTP testing guide (`HTTP-TESTING.md`)
- Cursor setup guide (`CURSOR-MCP-SETUP.md`)
- Troubleshooting guide (`CURSOR-TROUBLESHOOTING.md`)

### Changed
- MCP server now supports dual transport: SSE/HTTP and stdio
- JSON Schema generation for Zod-based tools now uses `zod-to-json-schema`
- Updated server to flatten `$ref` schemas in tools/list responses
- Improved logging for MCP protocol debugging
- Reorganized documentation structure

### Fixed
- JSON Schema `$ref` resolution for SSE transport
- MCP capabilities response format for Cursor compatibility
- Server startup logging and error handling
- ESM import issues with `.js` extensions

## [1.0.0] - 2025-01-10

### Added
- 10 complete MCP tools for OpenAPI management
  - `spec_read` - Read and query OpenAPI specifications
  - `spec_validate` - Validate specs with Spectral
  - `metadata_update` - Update API metadata
  - `schema_manage` - Manage schema definitions
  - `endpoint_manage` - Manage API endpoints
  - `version_control` - Version management and diffing
  - `parameters_configure` - Configure parameters
  - `responses_configure` - Configure responses
  - `security_configure` - Manage security schemes
  - `references_manage` - Manage $ref references
- Comprehensive version control with diff generation
- Breaking change detection using oasdiff
- Audit logging with LLM reasoning capture
- Custom OpenAPI x- attributes support
- Storage abstraction layer (FileSystemStorage)
- 434 passing unit and integration tests
- 80%+ test coverage on all metrics
- Complete TypeScript type safety
- Pino-based structured logging
- Spectral-based OpenAPI validation
- File locking for concurrent access
- Branded types for API IDs and versions
- ESLint (Airbnb) and Prettier configuration
- Jest testing framework with ts-jest
- Comprehensive documentation in docs/ folder

### Infrastructure
- TypeScript 5.3 with strict mode
- Node.js 20+ requirement
- Fastify web framework
- Zod schema validation
- ES Modules (ESM) support
- Fastify for HTTP server
- @modelcontextprotocol/sdk for stdio transport

## [Unreleased]

### Planned
- Docker deployment with docker-compose
- S3 storage backend
- Redis storage backend
- JWT/JWK authentication
- Web UI dashboard
- Collaborative editing features
- Git integration for version control
- CI/CD pipeline templates
- GraphQL API support
- Webhook notifications
- Rate limiting
- API usage analytics

---

## Version History

- **1.0.1** - SSE transport and Cursor integration
- **1.0.0** - Initial release with 10 MCP tools

## Migration Guides

### Upgrading from 1.0.0 to 1.0.1

No breaking changes. Simply:

```bash
git pull
npm install
npm run build
```

**New Features:**
- SSE transport now available at `http://localhost:3000/mcp/sse`
- Add to Cursor MCP config to use with Cursor IDE
- JSON schemas are now flattened for better compatibility

**Configuration:**
Add to `~/.cursor/mcp.json`:
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

---

*For detailed information about each version, see the [README](./README.md) and [documentation](./docs).*

