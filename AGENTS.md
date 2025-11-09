# AGENTS.md

This file provides guidance for AI coding agents working on the OpenAPI Control Plane MCP Server project.

## Setup Commands

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Run tests
npm test

# Run tests in watch mode
npm run test:watch

# Build for production
npm run build

# Lint code
npm run lint

# Format code
npm run format
```

## Dev Environment Tips

- **Quick test iteration**: Use `npm run test:watch` to run tests automatically on file changes
- **Debugging**: Use `npm run test:debug` and attach Chrome DevTools for step-by-step debugging
- **Folder navigation**: Source code is in `src/`, tests mirror the structure in `tests/unit/`
- **TypeScript compilation**: The project uses strict mode - all types must be explicitly defined
- **Hot reload**: Dev server (`npm run dev`) automatically restarts on code changes

## Testing Instructions

- **Always run tests before committing**: `npm test`
- **Add tests for new code**: Every new function/class needs corresponding unit tests
- **Coverage threshold**: Maintain 80%+ coverage on all metrics (lines, branches, functions, statements)
- **Integration tests**: Located in `tests/integration/` for end-to-end workflows
- **Test fixtures**: Sample OpenAPI specs are in `tests/fixtures/` with x- attributes

## Code Style

- **Variables/functions**: `camelCase` (e.g., `loadSpec`, `apiId`)
- **Classes**: `PascalCase` (e.g., `SpecReadTool`, `VersionManager`)
- **Constants**: `UPPER_SNAKE_CASE` (e.g., `MAX_FILE_SIZE`)
- **Files**: `kebab-case` (e.g., `spec-read-tool.ts`)
- **Uncle Bob principles**: Single responsibility, meaningful names, small functions (max 20-30 lines)
- **JSDoc required**: Every public function/class must have JSDoc with humor and technical accuracy

### ESLint & Prettier

- **ESLint**: Airbnb base config with TypeScript extensions
- **Prettier**: Single quotes, no semicolons, trailing commas
- **Auto-fix**: `npm run lint:fix && npm run format`

## Tool Implementation

### Adding a New MCP Tool

1. Create tool file in `src/tools/` extending `BaseTool`
2. Define Zod schema for parameters (include optional `llmReason` parameter)
3. Implement `execute()` method with switch/conditional logic
4. Implement `describe()` method returning tool description
5. Add humorous JSDoc explaining what the tool does
6. Create unit tests in `tests/unit/tools/`
7. Register tool in `src/server.ts`
8. Create integration test in `tests/integration/`
9. Document in `docs/tool-<name>/README.md`
10. Update this AGENTS.md with reference to new docs

### BaseTool Pattern

All tools extend the abstract `BaseTool` class:

```typescript
abstract class BaseTool {
  abstract execute(params: any): Promise<ToolResult>
  abstract describe(): ToolDescription
  validate(params: any, schema: z.ZodSchema): void
  success(message: string, data?: any): ToolResult
  error(message: string, details?: any): ToolResult
}
```

Every tool operation:
- Validates input with Zod
- Logs the operation
- Records audit trail with optional `llmReason`
- Returns structured `ToolResult`

## PR Instructions

- **Title format**: `[category] Brief description` (e.g., `[tool] Add spec_read tool`, `[docs] Update AGENTS.md`)
- **Branch naming**: `feature/tool-name` or `fix/issue-description`
- **Before submitting**:
  1. Run `npm run lint:fix`
  2. Run `npm run format`
  3. Run `npm test` and ensure all pass
  4. Run `npm run test:coverage` and verify 80%+ coverage
- **Commit messages**: Descriptive, present tense (e.g., "Add spec_read tool with validation")
- **Testing**: Include both unit and integration tests for new features

## Architecture Notes

**Storage Abstraction**: The project uses `BaseStorageProvider` abstract class with `FileSystemStorage` implementation. This makes it easy to swap to S3, Redis, or other storage backends later.

**Custom x- Attributes**: Configured via environment variables with format `X_ATTRIBUTE_<ENTITY>_<NAME>=Description`. Accessible via unflatify as `entity.properties.attributeName`.

**LLM Reasoning**: All tool parameters include optional `llmReason` field to capture why the LLM made a change. This is logged in the audit trail for debugging and compliance.

For more details, see:
- [Foundation & Tooling](./docs/foundation-tooling/README.md) - Project setup and tooling
- [Architecture](./docs/architecture/README.md) - System design and patterns _(coming in Part 22)_
- [Metadata Update Tool](./docs/tool-metadata-update/README.md) - First write operation with full patterns
- [Tools Reference](./docs/api-tools-testing/TOOLS.md) - Complete MCP tools documentation _(coming in Part 23)_

## Common Tasks

### Run a specific test file

```bash
npm test -- spec-read-tool.test.ts
```

### Debug a specific test

```bash
npm run test:debug -- spec-read-tool.test.ts
```

### Add a new service

1. Create service file in `src/services/`
2. Use dependency injection for storage/logger
3. Add comprehensive JSDoc
4. Create unit tests in `tests/unit/services/`
5. Mock external dependencies in tests

### Add a new storage provider

1. Extend `BaseStorageProvider` in `src/storage/`
2. Implement all abstract methods
3. Add configuration to `src/config/`
4. Create unit tests mocking underlying storage
5. Update docs in `docs/storage-abstraction/`

## Documentation Structure

Each major feature has its own documentation folder in `docs/`:

- `foundation-tooling/` - Initial setup, tooling, conventions
- `types-interfaces/` - TypeScript types, custom extensions
- `utilities-logging/` - Logger, errors, validation
- `storage-abstraction/` - Storage layer, file system, locking
- `tool-<name>/` - Individual tool documentation
- `architecture/` - System design, patterns, data flow
- `mcp-testing/` - Testing infrastructure, helpers

## Quick Reference

| Task | Command |
|------|---------|
| Install | `npm install` |
| Dev server | `npm run dev` |
| Test | `npm test` |
| Test watch | `npm run test:watch` |
| Debug test | `npm run test:debug` |
| Coverage | `npm run test:coverage` |
| Lint | `npm run lint` |
| Fix lint | `npm run lint:fix` |
| Format | `npm run format` |
| Build | `npm run build` |

## Project Status

✅ Part 1: Foundation & Tooling Setup (Complete)
✅ Part 2: TypeScript Types & Interfaces (Complete)
✅ Part 3: Core Infrastructure (Complete)
✅ Part 4: Read Operations (Complete)
✅ Part 5: Version Management Infrastructure (Complete)
✅ Part 6: Comprehensive Testing (Complete)
✅ Part 7: First Write Tool - metadata_update (Complete)
🔄 Part 8: Schema Management Tool (Next)
⏳ Parts 9-15: Pending...

---

**Remember**: Code should be clean, tested, and humorous. If the JSDoc doesn't make you smile, you're doing it wrong. 😄

