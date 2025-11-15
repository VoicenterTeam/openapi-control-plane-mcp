# Foundation & Tooling Setup

## Overview

This document covers the initial project setup, tooling configuration, and development environment for the OpenAPI Control Panel MCP Server.

## Project Structure

```
openapi-control-panel-mcp/
├── src/                    # Source code
│   ├── tools/             # MCP tools (spec_read, spec_validate, etc.)
│   ├── services/          # Business logic (spec-manager, version-manager, etc.)
│   ├── storage/           # Storage abstraction layer
│   ├── types/             # TypeScript type definitions
│   ├── utils/             # Utility functions (logger, errors, validation)
│   └── config/            # Configuration management
├── tests/                  # Test suite
│   ├── unit/              # Unit tests mirroring src/ structure
│   ├── integration/       # Integration tests for workflows
│   ├── helpers/           # Test utilities (mcp-test-client, test-server)
│   └── fixtures/          # Sample OpenAPI specs for testing
├── docs/                   # Documentation (thematic folders)
└── data/                   # Runtime data (specs, versions, audit logs)
```

## Technology Stack

### Core Dependencies

- **TypeScript 5.3+**: Strict mode, modern ES2022 features
- **Fastify 4.x**: High-performance HTTP server
- **@modelcontextprotocol/sdk**: MCP server implementation
- **@apidevtools/swagger-parser**: OpenAPI parsing and validation
- **Zod**: Runtime schema validation
- **Pino**: Fast structured logging
- **Lodash**: Utility library for nested object access with get/set

### Development Tools

- **Jest + ts-jest**: Testing framework with TypeScript support
- **ESLint**: Airbnb base configuration with TypeScript extensions
- **Prettier**: Code formatting with single quotes, no semicolons
- **tsx**: TypeScript execution for development

## Code Style

### Naming Conventions

- **Variables & Functions**: `camelCase` (e.g., `loadSpec`, `apiId`, `currentVersion`)
- **Classes**: `PascalCase` (e.g., `SpecReadTool`, `VersionManager`, `FileSystemStorage`)
- **Constants**: `UPPER_SNAKE_CASE` (e.g., `MAX_FILE_SIZE`, `DEFAULT_LOG_LEVEL`)
- **Files**: `kebab-case` (e.g., `spec-read-tool.ts`, `version-manager.ts`)

### ESLint Configuration

```json
{
  "extends": ["airbnb-base", "plugin:@typescript-eslint/recommended", "prettier"],
  "rules": {
    "no-console": ["warn", { "allow": ["warn", "error"] }],
    "@typescript-eslint/no-unused-vars": ["error", { "argsIgnorePattern": "^_" }]
  }
}
```

### Prettier Configuration

```json
{
  "singleQuote": true,
  "semi": false,
  "trailingComma": "es5",
  "printWidth": 100,
  "tabWidth": 2,
  "arrowParens": "avoid"
}
```

## Custom x- Attributes

The project supports custom OpenAPI extensions (x- attributes) configurable via environment variables:

### Format

```bash
X_ATTRIBUTE_<ENTITY>_<NAME>=Description for LLM
```

### Supported Entities

- `INFO`: API-level attributes (x-logo, x-category)
- `ENDPOINT`: Operation-level attributes (x-team, x-visibility, x-internal)
- `PARAMETER`: Parameter-level attributes (x-hint, x-example-context)
- `SCHEMA`: Schema-level attributes (x-team, x-category)
- `RESPONSE`: Response-level attributes (x-scenario)

### Accessing with unflatify

```typescript
import unflatify from 'unflatify'

const spec = {
  paths: {
    '/users': {
      get: {
        'x-logo': 'logo.png',
        'x-team': 'backend-team'
      }
    }
  }
}

// Access via properties
const unflat = unflatify(spec)
console.log(unflat.paths['/users'].get.properties.logo) // 'logo.png'
```

## NPM Scripts

| Script | Command | Purpose |
|--------|---------|---------|
| `dev` | `tsx watch src/server.ts` | Start development server with hot reload |
| `build` | `tsc` | Compile TypeScript to dist/ |
| `test` | `jest` | Run all tests |
| `test:watch` | `jest --watch` | Run tests in watch mode |
| `test:coverage` | `jest --coverage` | Run tests with coverage report |
| `test:debug` | `node --inspect-brk ...` | Debug tests with Chrome DevTools |
| `lint` | `eslint src/` | Check code style |
| `lint:fix` | `eslint src/ --fix` | Auto-fix code style issues |
| `format` | `prettier --write` | Format all TypeScript files |
| `format:check` | `prettier --check` | Check formatting without changes |

## Getting Started

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Environment

```bash
cp .env.example .env
# Edit .env with your configuration
```

### 3. Run Development Server

```bash
npm run dev
```

### 4. Run Tests

```bash
npm test
```

### 5. Build for Production

```bash
npm run build
```

## Security: .cursorignore

The project includes a comprehensive `.cursorignore` file following organization security standards:

- **Credentials**: .env files, *.pem, *.key, *credentials*.json
- **Data**: data/, *.sqlite, *.db
- **Logs**: logs/, *.log
- **Build**: dist/, coverage/
- **Dependencies**: node_modules/

**Never commit sensitive data to version control!**

## Next Steps

1. **Part 2**: Implement TypeScript types and interfaces
2. **Part 3**: Create core utilities (logger, errors, validation)
3. **Part 4**: Build storage abstraction layer
4. **Part 5**: Implement metadata and audit logging

## Resources

- [TypeScript Documentation](https://www.typescriptlang.org/docs/)
- [Airbnb JavaScript Style Guide](https://github.com/airbnb/javascript)
- [MCP Protocol Specification](https://modelcontextprotocol.io/)
- [OpenAPI Specification](https://swagger.io/specification/)

