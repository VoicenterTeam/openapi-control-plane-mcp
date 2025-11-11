# OpenAPI Control Plane MCP - Documentation

Welcome to the documentation for the OpenAPI Control Plane MCP Server!

## 📚 Documentation Structure

### Getting Started
- **[QUICKSTART.md](setup-guides/QUICKSTART.md)** - Quick start guide for Cursor IDE integration
- **[CURSOR-MCP-SETUP.md](setup-guides/CURSOR-MCP-SETUP.md)** - Detailed Cursor setup instructions
- **[HTTP-TESTING.md](setup-guides/HTTP-TESTING.md)** - Testing HTTP REST endpoints
- **[MCP-SSE.md](setup-guides/MCP-SSE.md)** - Server-Sent Events integration guide

### Development
- **[AGENTS.md](AGENTS.md)** - AI agent development guide (setup, conventions, testing)
- **[foundation-tooling/](foundation-tooling/)** - Project setup and tooling
- **[types-interfaces/](types-interfaces/)** - TypeScript types and interfaces

### MCP Tools Documentation

**Read Operations:**
- **[tool-spec-read/](tool-spec-read/)** - Read and query OpenAPI specifications with flexible filtering
- **[tool-spec-validate/](tool-spec-validate/)** - Validate specs using Spectral with severity filtering

**Write Operations:**
- **[tool-metadata-update/](tool-metadata-update/)** - Update API info, contact, license, and custom x- attributes
- **[tool-schema-manage/](tool-schema-manage/)** - Full CRUD for schema definitions (components.schemas)
- **[tool-endpoint-manage/](tool-endpoint-manage/)** - Manage API paths and operations
- **[tool-parameters-configure/](tool-parameters-configure/)** - Configure query, path, header, and cookie parameters
- **[tool-responses-configure/](tool-responses-configure/)** - Configure response status codes and content types
- **[tool-security-configure/](tool-security-configure/)** - Manage API keys, OAuth2, JWT, and OpenID Connect

**Version & Reference Management:**
- **[tool-spec-version/](tool-spec-version/)** - Version control with diff and breaking change detection
- **[tool-references-manage/](tool-references-manage/)** - Find, validate, and update $ref references

### Architecture & Services

**Core Architecture:**
- **[architecture/](architecture/)** - System design, patterns, and data flow diagrams
- **[base-tool-server/](base-tool-server/)** - BaseTool abstract class pattern and MCP server setup

**Services:**
- **[spec-manager/](spec-manager/)** - SpecManager service for loading/saving OpenAPI specs
- **[version-management/](version-management/)** - VersionManager and DiffCalculator services
- **[metadata-audit/](metadata-audit/)** - AuditLogger service and event tracking
- **[storage-abstraction/](storage-abstraction/)** - BaseStorageProvider interface and FileSystemStorage
- **[utilities-logging/](utilities-logging/)** - Pino logger, error utilities, and validation helpers

**Advanced Topics:**
- **[breaking-changes/](breaking-changes/)** - Breaking change detection using oasdiff

### Testing & Quality

**Testing Documentation:**
- **[api-tools-testing/](api-tools-testing/)** - Unit testing patterns for MCP tools
- **[integration-tests/](integration-tests/)** - End-to-end workflow testing
- **[mcp-testing/](mcp-testing/)** - MCP protocol and JSON-RPC testing

**Coverage Reports:**
- **[coverage-reports/](coverage-reports/)** - Test coverage analysis and reports
  - **[COVERAGE-82-PERCENT.md](coverage-reports/COVERAGE-82-PERCENT.md)** - Current coverage analysis (82.31% branches)
  - **[COVERAGE-SUCCESS.md](coverage-reports/COVERAGE-SUCCESS.md)** - Coverage milestone achievements
  - **[TESTING-FIXED.md](coverage-reports/TESTING-FIXED.md)** - Jest ES module compatibility fixes

### Project Information
- **[CHANGELOG.md](CHANGELOG.md)** - Version history and changes
- **[PROJECT-STATUS.md](setup-guides/PROJECT-STATUS.md)** - Current project status
- **[STATUS.md](setup-guides/STATUS.md)** - Build and deployment status
- **[reqierments.md](reqierments.md)** - Original project requirements

### Troubleshooting
- **[CURSOR-TROUBLESHOOTING.md](setup-guides/CURSOR-TROUBLESHOOTING.md)** - Cursor integration issues
- **[RUN-SERVER.md](setup-guides/RUN-SERVER.md)** - Server startup troubleshooting
- **[START-HERE.md](setup-guides/START-HERE.md)** - First-time setup help

## 🎯 Quick Links

### For Users
1. [Quick Start with Cursor](setup-guides/QUICKSTART.md)
2. [HTTP API Testing](setup-guides/HTTP-TESTING.md)
3. [All 10 MCP Tools Overview](#mcp-tools-documentation)
4. [Polished Examples & Workflows](examples-polish/)

### For Developers
1. [Development Setup](AGENTS.md)
2. [Project Architecture](architecture/)
3. [Contributing Guidelines](agents-contributing/)
4. [Testing Strategies](api-tools-testing/)
5. [Docker Deployment](docker-deployment/)

### For AI Agents
1. [Start Here: AGENTS.md](AGENTS.md)
2. [BaseTool Pattern](base-tool-server/)
3. [Testing Strategy](api-tools-testing/)
4. [Tool Implementation Example](tool-metadata-update/)

## 📊 Project Metrics

- **10 MCP Tools** - All implemented and tested
- **531 Tests** - All passing ✅
- **82.31% Branch Coverage** - Professional-grade
- **93%+ Statement/Function/Line Coverage** - Excellent
- **HTTP + SSE Transport** - Fully operational

## 🚀 Current Status

**Version: 1.0.1** - Production Ready

✅ All 10 MCP tools implemented
✅ HTTP REST API operational
✅ SSE/MCP transport working
✅ Cursor IDE integration ready
✅ 531 tests passing
✅ Professional test coverage

## 📖 Reading Order for New Contributors

1. **[README.md](../README.md)** - Main project overview
2. **[AGENTS.md](AGENTS.md)** - Development guidelines and conventions
3. **[architecture/](architecture/)** - System architecture and design patterns
4. **[base-tool-server/](base-tool-server/)** - BaseTool pattern and server setup
5. **[tool-metadata-update/](tool-metadata-update/)** - Example tool implementation (most comprehensive)
6. **[api-tools-testing/](api-tools-testing/)** - Testing strategies and patterns
7. **[examples-polish/](examples-polish/)** - Polished workflow examples

## 📁 Complete Documentation Index

### Setup & Getting Started
- [QUICKSTART.md](setup-guides/QUICKSTART.md)
- [CURSOR-MCP-SETUP.md](setup-guides/CURSOR-MCP-SETUP.md)
- [HTTP-TESTING.md](setup-guides/HTTP-TESTING.md)
- [MCP-SSE.md](setup-guides/MCP-SSE.md)
- [START-HERE.md](setup-guides/START-HERE.md)

### All 10 MCP Tools
1. [spec_read](tool-spec-read/) - Query specifications
2. [spec_validate](tool-spec-validate/) - Validate with Spectral
3. [metadata_update](tool-metadata-update/) - Update API metadata
4. [schema_manage](tool-schema-manage/) - CRUD for schemas
5. [endpoint_manage](tool-endpoint-manage/) - CRUD for endpoints
6. [parameters_configure](tool-parameters-configure/) - Configure parameters
7. [responses_configure](tool-responses-configure/) - Configure responses
8. [security_configure](tool-security-configure/) - Configure security
9. [version_control](tool-spec-version/) - Version management
10. [references_manage](tool-references-manage/) - Manage $ref

### Architecture & Implementation
- [Architecture Overview](architecture/)
- [BaseTool Pattern](base-tool-server/)
- [Storage Abstraction](storage-abstraction/)
- [Spec Manager Service](spec-manager/)
- [Version Management System](version-management/)
- [Audit Logging](metadata-audit/)
- [Utilities & Logging](utilities-logging/)

### Testing & Quality Assurance
- [API Tools Testing](api-tools-testing/)
- [Integration Tests](integration-tests/)
- [MCP Protocol Testing](mcp-testing/)
- [Coverage Reports](coverage-reports/)

### Deployment & Operations
- [Docker Deployment](docker-deployment/)
- [Breaking Changes Detection](breaking-changes/)

### Examples & Guides
- [Polished Examples](examples-polish/)
- [Agents Contributing](agents-contributing/)

---

*For the latest updates, see [CHANGELOG.md](CHANGELOG.md)*
*For issues and troubleshooting, start with [CURSOR-TROUBLESHOOTING.md](setup-guides/CURSOR-TROUBLESHOOTING.md)*

