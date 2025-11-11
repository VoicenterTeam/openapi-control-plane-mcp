# Contributing Guidelines for AI Agents

## Quick Reference

See [AGENTS.md](../AGENTS.md) for comprehensive AI agent guidelines including:
- Setup commands
- Dev environment tips
- Testing instructions
- Code style rules
- Tool implementation pattern
- PR checklist

## Key Points for AI Agents

### Before Starting
1. Run `npm install` to set up dependencies
2. Understand the BaseTool pattern (see [Base Tool & Server](../base-tool-server/README.md))
3. Review existing tools for examples

### While Coding
1. Use `npm run test:watch` for continuous feedback
2. Follow camelCase for variables, PascalCase for classes
3. Add humorous JSDoc comments
4. Write tests for every change

### Before Committing
1. Run `npm run lint:fix && npm run format`
2. Run `npm test` - all tests must pass
3. Check `npm run test:coverage` - maintain 80%+ coverage
4. Write clear commit messages (present tense)

## Adding a New MCP Tool

See detailed guide in [Base Tool & Server](../base-tool-server/README.md).

Quick checklist:
- [ ] Create tool class extending BaseTool
- [ ] Define Zod schema with llmReason parameter
- [ ] Implement execute() and describe() methods
- [ ] Add comprehensive JSDoc
- [ ] Write unit tests (80%+ coverage)
- [ ] Register in src/server.ts
- [ ] Create integration test
- [ ] Document in docs/tool-{name}/README.md
- [ ] Update docs/AGENTS.md with reference

## Architecture Understanding

Review these docs before major changes:
- [Architecture](../architecture/README.md) - System design
- [Storage Abstraction](../storage-abstraction/README.md) - Storage layer
- [Base Tool Pattern](../base-tool-server/README.md) - Tool structure

## Testing Philosophy

- **Unit tests**: Mock external dependencies, test logic in isolation
- **Integration tests**: Use real services, test end-to-end workflows
- **Coverage target**: 80%+ on all metrics (lines, branches, functions, statements)
- **Test-driven**: Write tests first when fixing bugs

## Related Documentation

- [AGENTS.md](../AGENTS.md) - Complete agent guidelines
- [Architecture](../architecture/README.md) - System architecture
- [API Tools & Testing](../api-tools-testing/README.md) - Testing strategies

