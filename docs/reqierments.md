# Building an MCP Server for OpenAPI/Swagger Management: Complete Technical Specification

This comprehensive guide provides a production-ready implementation plan for building an MCP (Model Context Protocol) server that manages OpenAPI/Swagger specifications with version control, audit trails, and LLM-driven editing capabilities using TypeScript, Fastify, and file-based storage.

## Executive summary: The optimal architecture

**Core stack**: TypeScript with @apidevtools/swagger-parser for parsing, Fastify with fastify-mcp-server for HTTP/MCP integration, file-system versioning with JSON metadata, and 10 precisely-designed MCP tools for comprehensive LLM control. This architecture balances simplicity (file-based storage), power (full CRUD operations), and safety (validation + versioning) while maximizing LLM usability through carefully-scoped tool interfaces. Build time estimate: 2-3 weeks for MVP, 4-6 weeks for production-ready system.

## NPM libraries and tooling recommendations

### OpenAPI parsing and manipulation

**@apidevtools/swagger-parser v12.1.0** (Primary choice)
- Downloads: ~2.5M weekly, 3.3k+ GitHub stars
- Supports Swagger 2.0, OpenAPI 3.0, 3.1
- Comprehensive parsing, validation, dereferencing, and bundling
- Resolves all $ref pointers (external files, URLs)
- Full TypeScript definitions included
- **Alternative**: @readme/openapi-parser (v5.2.0) if enhanced error messages are critical

```typescript
import SwaggerParser from '@apidevtools/swagger-parser';

const api = await SwaggerParser.validate('openapi.yaml');
const dereferenced = await SwaggerParser.dereference('openapi.yaml');
const bundled = await SwaggerParser.bundle('openapi.yaml');
```

**swagger2openapi v7.0.8** (Migration support)
- Essential for Swagger 2.0 → OpenAPI 3.x conversion
- Battle-tested on 74K+ real-world specs
- Auto-repair non-compliant schemas

### Validation libraries

**Runtime validation**: Choose based on requirements

**openapi-backend v5.15.0** (Comprehensive)
- Framework-agnostic middleware with AJV validation
- Request/response validation, auto-mocking, security handlers
- Best for building APIs with OpenAPI specs
- Excellent TypeScript support

**Zod + openapi-zod-client** (TypeScript-first DX)
- Best developer experience with static type inference
- Zero dependencies, parse-don't-validate philosophy
- Slower than AJV but superior TypeScript integration
- **Use when**: Prioritizing DX over raw performance

**TypeBox + AJV** (Performance-critical)
- JSON Schema-first (perfect for OpenAPI)
- Extremely fast with AJV compilation
- Smallest bundle size
- **Use when**: High-volume validation (1000+ req/sec)

**Spec validation**: Spectral (Essential)

**@stoplight/spectral-cli** (Industry standard)
- Flexible linter for OpenAPI 2.0, 3.0, 3.1
- Built-in rulesets, custom rule creation
- Pre-built style guides (OWASP Top 10, URL guidelines)
- CLI and JavaScript API

```typescript
import { Spectral, Document } from '@stoplight/spectral-core';
import { oas } from '@stoplight/spectral-rulesets';

const spectral = new Spectral();
spectral.setRuleset(oas);
const results = await spectral.run(new Document(spec, { source: 'openapi.yaml' }));
```

### Schema manipulation and $ref resolution

**@apidevtools/json-schema-ref-parser** (Recommended)
- Downloads: ~1.2M weekly
- Full JSON Reference and JSON Pointer implementation
- Resolves external files and URLs, handles circular references
- Bundle or dereference operations
- Works with OpenAPI specs (not OpenAPI-specific but comprehensive)

```typescript
import $RefParser from '@apidevtools/json-schema-ref-parser';

// Resolve all $refs
const resolved = await $RefParser.dereference('openapi.yaml');

// Bundle multiple files
const bundled = await $RefParser.bundle('openapi.yaml');
```

### YAML/JSON parsing

**js-yaml v4.1.0** (Standard choice)
- Downloads: ~128M weekly
- YAML 1.2 parser and serializer
- Fast, battle-tested, most widely used

**yaml npm package** (Modern alternative)
- Comment and blank line preservation
- Better AST manipulation
- **Choose when**: Need to preserve formatting and comments in specs

### Breaking change detection

**oasdiff** (Strongly recommended)
- Most comprehensive breaking change detection
- Multiple output formats (Markdown, HTML, JSON, YAML, JUnit XML)
- GitHub Actions integration
- Localization support
- Available as CLI with npm wrapper

```bash
npm install -g oasdiff
oasdiff changelog old.yaml new.yaml --format markdown
oasdiff breaking old.yaml new.yaml --fail-on-diff
```

**Alternative**: openapi-diff (Azure-backed, stable but less active)

### TypeScript type generation

**openapi-typescript** (Zero runtime overhead)
- Generates pure TypeScript types (no runtime code)
- Extremely fast (milliseconds for huge schemas)
- Node.js 20+ required
- Pair with openapi-fetch for type-safe HTTP clients

```bash
npx openapi-typescript openapi.yaml -o types.ts
```

**swagger-typescript-api v13.2.16** (Full client generation)
- Complete API client with methods
- Fetch or Axios support
- Customizable templates
- **Choose when**: Need runtime API client, not just types

**@hey-api/openapi-ts v0.87.0** (Modern SDK generation)
- Plugin architecture with validation support (Zod, TypeBox, Valibot)
- Multiple client options (Fetch, Axios, Angular)
- Very active development (published 2 days ago as of late 2024)
- Trusted by Google, Amazon, PayPal

### OpenAPI version compatibility matrix

| Library | Swagger 2.0 | OpenAPI 3.0 | OpenAPI 3.1 |
|---------|-------------|-------------|-------------|
| @apidevtools/swagger-parser | ✅ | ✅ | ✅ |
| openapi-typescript | v5.x only | ✅ | ✅ |
| openapi-backend | ✅ | ✅ | ✅ |
| Spectral | ✅ | ✅ | ✅ |
| oasdiff | ✅ | ✅ | ✅ |

## MCP server architecture with Fastify

### Server initialization pattern

```typescript
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import Fastify from 'fastify';
import FastifyMcpServer, { getMcpDecorator } from 'fastify-mcp-server';
import { z } from 'zod';

// Initialize MCP server
const mcp = new McpServer(
  { name: 'openapi-manager', version: '1.0.0' },
  { 
    capabilities: { tools: {}, resources: {}, prompts: {} },
    notificationDebouncing: { enabled: true, debounceInterval: 100 }
  }
);

// Initialize Fastify
const app = Fastify({ logger: true, trustProxy: true });

// Register Fastify MCP plugin (recommended approach)
await app.register(FastifyMcpServer, {
  server: mcp.server,
  endpoint: '/mcp',
  authorization: {
    bearerMiddlewareOptions: {
      verifier: tokenVerifier,
      requiredScopes: ['mcp:read', 'mcp:write']
    }
  }
});
```

### MCP tool registration with validation

```typescript
// Register tool with comprehensive validation
mcp.tool(
  'spec_read',
  {
    query_type: z.enum(['full_spec', 'endpoints_list', 'endpoint_detail', 'schema_detail'])
      .describe('Type of information to retrieve'),
    path: z.string().optional()
      .describe('Specific path/endpoint (required for endpoint_detail)'),
    method: z.enum(['GET', 'POST', 'PUT', 'DELETE', 'PATCH']).optional(),
    schema_name: z.string().optional()
      .describe('Schema component name (required for schema_detail)')
  },
  async ({ query_type, path, method, schema_name }) => {
    const spec = await loadCurrentSpec();
    
    switch (query_type) {
      case 'full_spec':
        return { content: [{ type: 'text', text: JSON.stringify(spec, null, 2) }] };
      case 'endpoints_list':
        const endpoints = Object.keys(spec.paths || {});
        return { content: [{ type: 'text', text: JSON.stringify(endpoints, null, 2) }] };
      case 'endpoint_detail':
        if (!path) throw new Error('path required for endpoint_detail');
        const endpoint = spec.paths?.[path]?.[method?.toLowerCase() || 'get'];
        return { content: [{ type: 'text', text: JSON.stringify(endpoint, null, 2) }] };
      case 'schema_detail':
        if (!schema_name) throw new Error('schema_name required for schema_detail');
        const schema = spec.components?.schemas?.[schema_name];
        return { content: [{ type: 'text', text: JSON.stringify(schema, null, 2) }] };
      default:
        throw new Error(`Unknown query_type: ${query_type}`);
    }
  }
).describe('Retrieve and query OpenAPI specification information');
```

### Error handling patterns

**MCP error codes** (Protocol-level errors only)

```typescript
import { ErrorCode, McpError } from '@modelcontextprotocol/sdk';

// Use for protocol violations
throw new McpError(
  ErrorCode.InvalidParams,
  'Missing required field: userId',
  { field: 'userId' }
);
```

**Tool-level error handling** (Preferred for business logic)

```typescript
// Return errors in tool results
mcp.tool('endpoint_manage', schema, async (input) => {
  try {
    const result = await updateEndpoint(input);
    return { content: [{ type: 'text', text: 'Success' }] };
  } catch (error) {
    return {
      content: [{ type: 'text', text: `Failed: ${error.message}` }],
      isError: true  // LLM can see and handle appropriately
    };
  }
});
```

### Authentication approaches

**OAuth 2.1** (Production recommended)

```typescript
import jwt from 'jsonwebtoken';

const tokenVerifier = {
  async verifyAccessToken(token: string) {
    const decoded = await jwt.verify(token, publicKey);
    return {
      token,
      clientId: decoded.sub,
      scopes: decoded.scope?.split(' ') || [],
      expiresAt: decoded.exp * 1000
    };
  }
};
```

**API Key** (Simpler alternative for internal tools)

```typescript
const apiKeys = new Map([
  ['key_abc123', { name: 'Service', scopes: ['read'] }],
  ['key_xyz789', { name: 'Admin', scopes: ['read', 'write'] }]
]);

app.addHook('preHandler', async (request, reply) => {
  if (!request.url.startsWith('/mcp')) return;
  
  const apiKey = request.headers['x-api-key'];
  if (!apiKey || !apiKeys.has(apiKey as string)) {
    return reply.code(401).send({ error: 'Invalid API key' });
  }
  
  request.apiKeyInfo = apiKeys.get(apiKey as string);
});
```

## Version management and storage architecture

### Recommended folder structure

**File-based versioning** (Optimal for this use case)

```
data/
├── specs/
│   ├── petstore-api/
│   │   ├── current.yaml                    # Current working version (symlink or copy)
│   │   ├── versions/
│   │   │   ├── v1.0.0/
│   │   │   │   ├── spec.yaml
│   │   │   │   └── metadata.json
│   │   │   ├── v1.1.0/
│   │   │   │   ├── spec.yaml
│   │   │   │   └── metadata.json
│   │   │   └── v2.0.0/
│   │   │       ├── spec.yaml
│   │   │       └── metadata.json
│   │   └── metadata.json                   # API-level metadata
│   └── payment-api/
│       ├── current.yaml
│       ├── versions/
│       └── metadata.json
├── backups/                                # Automated backups
└── audit.jsonl                             # Audit trail (JSON Lines format)
```

**Rationale for file-based approach**:
- Simple to implement and debug (no database overhead)
- Easy backup and restore (standard file operations)
- Git-friendly (can optionally use Git as backing store)
- Human-readable and inspectable
- Sufficient for most use cases (thousands of versions)
- Atomic operations possible with proper file locking

### Metadata schema design

**Version metadata.json** (per version)

```json
{
  "version": "v1.1.0",
  "created_at": "2025-11-08T10:30:00Z",
  "created_by": "user@example.com",
  "parent_version": "v1.0.0",
  "description": "Added user authentication endpoints",
  "changes": {
    "endpoints_added": ["/auth/login", "/auth/logout"],
    "endpoints_modified": [],
    "endpoints_deleted": [],
    "schemas_added": ["AuthRequest", "AuthResponse"],
    "breaking_changes": []
  },
  "validation": {
    "spectral_errors": 0,
    "spectral_warnings": 2,
    "openapi_valid": true
  },
  "stats": {
    "endpoint_count": 15,
    "schema_count": 8,
    "file_size_bytes": 12500
  },
  "tags": ["production", "stable"]
}
```

**API-level metadata.json**

```json
{
  "api_id": "petstore-api",
  "name": "Petstore API",
  "created_at": "2025-01-01T00:00:00Z",
  "current_version": "v1.1.0",
  "versions": ["v1.0.0", "v1.1.0"],
  "latest_stable": "v1.1.0",
  "owner": "team@example.com",
  "tags": ["public", "rest"]
}
```

**Audit trail format** (audit.jsonl - JSON Lines)

```jsonl
{"timestamp":"2025-11-08T10:30:00Z","event":"version_created","api_id":"petstore-api","version":"v1.1.0","user":"user@example.com","description":"Added auth endpoints"}
{"timestamp":"2025-11-08T11:00:00Z","event":"endpoint_added","api_id":"petstore-api","version":"v1.1.0","user":"user@example.com","details":{"path":"/auth/login","method":"POST"}}
{"timestamp":"2025-11-08T11:15:00Z","event":"schema_modified","api_id":"petstore-api","version":"v1.1.0","user":"user@example.com","details":{"schema":"User","change":"added_field","field":"email"}}
```

### Version numbering schemes

**Semantic versioning** (Recommended)

- Format: `v{major}.{minor}.{patch}` (e.g., v2.1.3)
- Major: Breaking changes
- Minor: Backward-compatible additions
- Patch: Bug fixes, documentation updates
- Use oasdiff to detect breaking changes automatically

**Timestamp-based** (Alternative for high-frequency changes)

- Format: `v{timestamp}` (e.g., v20251108-103000)
- Simple, always unique
- Natural ordering
- Less semantic meaning

**Sequential** (Simplest)

- Format: `v{number}` (e.g., v1, v2, v3)
- Easiest to understand
- No semantic versioning overhead
- Good for internal tools

### Concurrent edit handling

**File locking with proper-lockfile**

```typescript
import lockfile from 'proper-lockfile';
import { promises as fs } from 'fs';

async function updateSpec(apiId: string, version: string, updater: (spec: any) => void) {
  const filePath = `./data/specs/${apiId}/versions/${version}/spec.yaml`;
  
  // Acquire lock
  const release = await lockfile.lock(filePath, {
    retries: { retries: 5, minTimeout: 100, maxTimeout: 1000 }
  });
  
  try {
    // Read current spec
    const content = await fs.readFile(filePath, 'utf-8');
    const spec = YAML.parse(content);
    
    // Apply updates
    updater(spec);
    
    // Validate before writing
    await SwaggerParser.validate(spec);
    
    // Write atomically
    const tempFile = `${filePath}.tmp`;
    await fs.writeFile(tempFile, YAML.stringify(spec));
    await fs.rename(tempFile, filePath);
    
  } finally {
    await release();
  }
}
```

**Optimistic locking** (Alternative)

```typescript
interface VersionedSpec {
  version_number: number;
  data: any;
}

async function optimisticUpdate(
  apiId: string,
  expectedVersion: number,
  updates: any
): Promise<void> {
  const spec = await loadSpec(apiId);
  
  if (spec.version_number !== expectedVersion) {
    throw new Error('Spec was modified by another user. Please refresh and try again.');
  }
  
  spec.version_number++;
  Object.assign(spec.data, updates);
  await saveSpec(apiId, spec);
}
```

### Git integration pattern (Optional enhancement)

```typescript
import simpleGit from 'simple-git';

const git = simpleGit('./data/specs');

async function createVersionWithGit(
  apiId: string,
  version: string,
  description: string,
  user: string
) {
  const specPath = `${apiId}/versions/${version}/spec.yaml`;
  
  // Initialize git repo if needed
  if (!await fs.access('./data/specs/.git').catch(() => false)) {
    await git.init();
  }
  
  // Stage and commit
  await git.add(specPath);
  await git.commit(description, { '--author': `${user} <${user}>` });
  await git.addTag(`${apiId}-${version}`);
  
  // Git provides automatic diff, blame, history
}
```

## The optimal 10 MCP tools for LLM control

Based on research into LLM tool design (optimal count: 8-12 tools), API management UX patterns (Postman, Stoplight, Insomia), and workflow-oriented design principles, here are the precisely-scoped tools:

### Tool 1: spec_read

**Purpose**: Retrieve and query OpenAPI specification information

**Parameters**:
```typescript
{
  query_type: 'full_spec' | 'endpoints_list' | 'endpoint_detail' | 'schema_detail' | 'info' | 'servers',
  path?: string,              // Required for endpoint_detail
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH',
  schema_name?: string,       // Required for schema_detail
  filters?: {
    tags?: string[],
    deprecated?: boolean
  }
}
```

**Rationale**: Consolidates all read operations. LLMs need context before changes, and this provides all discovery capabilities in one tool.

### Tool 2: endpoint_manage

**Purpose**: Add, update, or delete API endpoints and their operations

**Parameters**:
```typescript
{
  action: 'add' | 'update' | 'delete',
  path: string,               // e.g., /users/{id}
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH',
  operation?: {
    summary?: string,
    description?: string,
    operationId?: string,
    tags?: string[],
    deprecated?: boolean
  }
}
```

**Rationale**: Groups endpoint-level operations by workflow rather than splitting into separate tools. Matches how developers think about endpoint management.

### Tool 3: parameters_configure

**Purpose**: Configure request parameters (query, path, header, cookie, body)

**Parameters**:
```typescript
{
  path: string,
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH',
  parameter_location: 'query' | 'path' | 'header' | 'cookie' | 'body',
  parameters: Array<{
    name: string,
    required: boolean,
    schema: object,
    description: string,
    example?: any
  }>,
  replace?: boolean          // Replace all (true) or merge (false)
}
```

**Rationale**: Parameters are contextually bound to endpoints and frequently modified together. Handles all parameter types in one operation.

### Tool 4: responses_configure

**Purpose**: Define response specifications including status codes, schemas, examples

**Parameters**:
```typescript
{
  path: string,
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH',
  status_code: string,       // '200', '404', 'default'
  response: {
    description: string,
    content?: object,        // Media type and schema mapping
    headers?: object,
    examples?: object
  },
  action?: 'set' | 'delete'
}
```

**Rationale**: Responses are complex objects requiring coordination of schemas, examples, and headers. Grouping reduces cognitive load for the LLM.

### Tool 5: schema_manage

**Purpose**: Create, update, or delete reusable schema components

**Parameters**:
```typescript
{
  action: 'add' | 'update' | 'delete' | 'add_property' | 'remove_property',
  schema_name: string,
  schema_definition?: object,    // For add/update
  property_path?: string,        // e.g., 'address.city' for nested
  property_definition?: object   // For add_property
}
```

**Rationale**: Schemas are central to OpenAPI. Supports both coarse-grained (whole schema) and fine-grained (property-level) operations for iterative development.

### Tool 6: references_manage

**Purpose**: Handle $ref operations - create, update, resolve, validate references

**Parameters**:
```typescript
{
  action: 'add_ref' | 'update_ref' | 'resolve_ref' | 'find_refs' | 'validate_refs',
  location?: {
    path: string,
    method: string,
    section: 'parameters' | 'responses' | 'requestBody' | 'schemas'
  },
  ref_path?: string,           // e.g., '#/components/schemas/User'
  target_schema?: string
}
```

**Rationale**: References are unique to OpenAPI and require special handling. Grouping all $ref operations prevents broken references and maintains spec integrity.

### Tool 7: security_configure

**Purpose**: Define security schemes and apply security requirements

**Parameters**:
```typescript
{
  action: 'add_scheme' | 'update_scheme' | 'delete_scheme' | 'apply_to_endpoint' | 'apply_global',
  scheme_name: string,
  scheme_definition?: {
    type: 'apiKey' | 'http' | 'oauth2' | 'openIdConnect',
    scheme?: string,
    bearerFormat?: string,
    flows?: object
  },
  endpoint?: { path: string, method: string },
  scopes?: string[]
}
```

**Rationale**: Security is critical and often applied at both global and endpoint levels. Handles complete security workflow in one place.

### Tool 8: metadata_update

**Purpose**: Update API metadata (info, servers, tags, external documentation)

**Parameters**:
```typescript
{
  section: 'info' | 'servers' | 'tags' | 'externalDocs',
  data: object,
  merge?: boolean,              // Merge (true) or replace (false)
  tag_operations?: {
    action: 'add' | 'update' | 'delete',
    tag_name: string,
    tag_definition?: object
  }
}
```

**Rationale**: Metadata updates are distinct from structural changes. Grouping makes it clear this is about documentation, not API structure.

### Tool 9: spec_validate

**Purpose**: Validate OpenAPI specification with comprehensive checks

**Parameters**:
```typescript
{
  validation_type?: 'full' | 'schema_only' | 'references_only' | 'security_only' | 'breaking_changes',
  lint_rules?: {
    ruleset: 'spectral:oas' | 'spectral:recommended' | 'custom',
    custom_rules?: any[]
  },
  compare_against?: string,     // Version for breaking change detection
  severity_threshold?: 'error' | 'warning' | 'info' | 'hint'
}
```

**Rationale**: Validation is critical for safety. Consolidates all validation types while supporting different validation depths.

### Tool 10: spec_version

**Purpose**: Version control operations for OpenAPI specifications

**Parameters**:
```typescript
{
  action: 'create_version' | 'list_versions' | 'get_version' | 'compare_versions' | 'rollback' | 'diff',
  version_name?: string,
  description?: string,
  compare_from?: string,
  compare_to?: string,
  diff_format?: 'json' | 'markdown' | 'html'
}
```

**Rationale**: Version control is essential for managing changes over time. Handles all version-related operations, supporting both snapshot and comparison workflows.

### Example workflow: Add authenticated endpoint

```
1. spec_read(query_type="full_spec") → Understand current API
2. schema_manage(action="add", schema_name="NewResource", ...) → Create data model
3. endpoint_manage(action="add", path="/resources", method="POST", ...) → Add endpoint
4. parameters_configure(path="/resources", method="POST", parameter_location="body", ...) → Configure request
5. responses_configure(path="/resources", method="POST", status_code="201", ...) → Define response
6. security_configure(action="apply_to_endpoint", scheme_name="bearerAuth", ...) → Apply auth
7. spec_validate(validation_type="full") → Verify correctness
8. spec_version(action="create_version", version_name="v1.1.0", ...) → Save version
```

## Technical implementation details

### OpenAPI version handling (2.0, 3.0, 3.1)

**Key differences to handle**:

**OpenAPI 3.1 vs 3.0**:
- **$ref behavior**: 3.1 allows $ref with sibling keywords (description, example). In 3.0, $ref couldn't have siblings, requiring allOf workarounds.
- **JSON Schema alignment**: 3.1 is 100% compatible with JSON Schema Draft 2020-12. Use any JSON Schema keyword.
- **nullable removed**: Use type union instead (`type: ['string', 'null']` instead of `type: 'string', nullable: true`)
- **webhooks**: New top-level webhooks object for event-driven APIs
- **Server variables**: default now optional
- **exclusiveMinimum/Maximum**: No longer accept boolean values

**Implementation pattern**:

```typescript
import SwaggerParser from '@apidevtools/swagger-parser';
import { convert } from 'swagger2openapi';

async function normalizeSpec(spec: any): Promise<any> {
  // Detect version
  const version = spec.openapi || spec.swagger;
  
  if (version?.startsWith('2.')) {
    // Convert Swagger 2.0 to OpenAPI 3.0
    const result = await convert(spec, { patch: true });
    return result.openapi;
  }
  
  if (version?.startsWith('3.0')) {
    // Optionally upgrade 3.0 to 3.1 or handle as-is
    return spec;
  }
  
  if (version?.startsWith('3.1')) {
    return spec;
  }
  
  throw new Error(`Unsupported OpenAPI version: ${version}`);
}

// Type-safe access with version detection
interface OpenAPISpec {
  openapi?: string;
  swagger?: string;
  info: { title: string; version: string };
  paths?: Record<string, any>;
  components?: { schemas?: Record<string, any> };
}

function getVersion(spec: OpenAPISpec): '2.0' | '3.0' | '3.1' {
  if (spec.swagger) return '2.0';
  if (spec.openapi?.startsWith('3.0')) return '3.0';
  if (spec.openapi?.startsWith('3.1')) return '3.1';
  throw new Error('Unknown OpenAPI version');
}
```

### $ref resolution strategies

**Three modes of handling $refs**:

**1. Resolve/Dereference** (Replace $refs with actual content)

```typescript
import SwaggerParser from '@apidevtools/swagger-parser';

// Replace all $refs with actual schemas
const dereferenced = await SwaggerParser.dereference('spec.yaml');

// Now spec.paths['/users'].get.responses['200'].content['application/json'].schema
// contains the full User schema, not a $ref
```

**Use when**: 
- Presenting to LLMs (no reference resolution needed)
- Generating code
- Simple validation

**2. Bundle** (Collect external refs into components)

```typescript
// Combine multiple files into single spec with internal refs
const bundled = await SwaggerParser.bundle('spec.yaml');

// External $refs moved to components, refs updated to internal
```

**Use when**:
- Publishing single-file specs
- Deploying to platforms requiring single file

**3. Keep References** (Maintain $refs as-is)

```typescript
// Just parse, don't resolve
const parsed = await SwaggerParser.parse('spec.yaml');

// $refs remain as strings like '#/components/schemas/User'
```

**Use when**:
- Editing specs (maintain structure)
- Version control (easier diffs)
- Modular spec management

**Circular reference handling**:

```typescript
import $RefParser from '@apidevtools/json-schema-ref-parser';

const parser = new $RefParser();
await parser.dereference('spec.yaml', {
  dereference: {
    circular: 'ignore'  // Keep circular refs as $ref strings
  }
});
```

### Breaking change detection integration

```typescript
import { execFile } from 'child_process';
import { promisify } from 'util';

const execFileAsync = promisify(execFile);

async function detectBreakingChanges(
  oldVersion: string,
  newVersion: string
): Promise<{ breaking: boolean; changes: any[] }> {
  const oldPath = `./data/specs/${apiId}/versions/${oldVersion}/spec.yaml`;
  const newPath = `./data/specs/${apiId}/versions/${newVersion}/spec.yaml`;
  
  try {
    // Run oasdiff
    const { stdout } = await execFileAsync('oasdiff', [
      'breaking',
      oldPath,
      newPath,
      '--format',
      'json'
    ]);
    
    const result = JSON.parse(stdout);
    return {
      breaking: result.breakingChanges && result.breakingChanges.length > 0,
      changes: result.breakingChanges || []
    };
  } catch (error) {
    // oasdiff exits with code 1 if breaking changes found
    if (error.code === 1) {
      const result = JSON.parse(error.stdout);
      return { breaking: true, changes: result.breakingChanges };
    }
    throw error;
  }
}
```

### Spectral linting integration

```typescript
import { Spectral, Document } from '@stoplight/spectral-core';
import { oas } from '@stoplight/spectral-rulesets';
import * as fs from 'fs/promises';

const spectral = new Spectral();
spectral.setRuleset(oas);

async function lintSpec(specPath: string) {
  const content = await fs.readFile(specPath, 'utf-8');
  const results = await spectral.run(new Document(content, { source: specPath }));
  
  return {
    errors: results.filter(r => r.severity === 0),
    warnings: results.filter(r => r.severity === 1),
    info: results.filter(r => r.severity === 2),
    hints: results.filter(r => r.severity === 3),
    valid: results.filter(r => r.severity === 0).length === 0
  };
}
```

### TypeScript type safety patterns

```typescript
import type { OpenAPIV3, OpenAPIV3_1 } from 'openapi-types';

// Discriminated union for version handling
type OpenAPIDocument = 
  | { version: '3.0'; spec: OpenAPIV3.Document }
  | { version: '3.1'; spec: OpenAPIV3_1.Document };

// Branded types for safety
type ApiId = string & { readonly __brand: 'ApiId' };
type VersionTag = string & { readonly __brand: 'VersionTag' };

function createApiId(id: string): ApiId {
  // Validate format
  if (!/^[a-z0-9-]+$/.test(id)) {
    throw new Error('Invalid API ID format');
  }
  return id as ApiId;
}

// Type-safe spec operations
interface SpecOperations {
  addEndpoint(
    spec: OpenAPIV3.Document, 
    path: string, 
    method: OpenAPIV3.HttpMethods,
    operation: OpenAPIV3.OperationObject
  ): OpenAPIV3.Document;
  
  addSchema(
    spec: OpenAPIV3.Document,
    name: string,
    schema: OpenAPIV3.SchemaObject
  ): OpenAPIV3.Document;
}
```

## Developer experience and project structure

### Recommended project structure

```
mcp-openapi-server/
├── src/
│   ├── server.ts                 # Fastify + MCP server initialization
│   ├── config.ts                 # Configuration management
│   ├── tools/                    # MCP tool implementations
│   │   ├── index.ts
│   │   ├── spec-read.ts
│   │   ├── endpoint-manage.ts
│   │   ├── parameters-configure.ts
│   │   ├── responses-configure.ts
│   │   ├── schema-manage.ts
│   │   ├── references-manage.ts
│   │   ├── security-configure.ts
│   │   ├── metadata-update.ts
│   │   ├── spec-validate.ts
│   │   └── spec-version.ts
│   ├── services/                 # Business logic
│   │   ├── spec-manager.ts       # Core spec operations
│   │   ├── version-manager.ts    # Versioning logic
│   │   ├── validator.ts          # Validation service
│   │   └── audit-logger.ts       # Audit trail
│   ├── storage/                  # Storage layer
│   │   ├── file-storage.ts       # File operations
│   │   ├── metadata-store.ts     # Metadata management
│   │   └── lock-manager.ts       # Concurrent access control
│   ├── types/                    # TypeScript types
│   │   ├── openapi.ts
│   │   ├── metadata.ts
│   │   └── audit.ts
│   └── utils/                    # Utilities
│       ├── logger.ts
│       ├── errors.ts
│       └── validation.ts
├── tests/
│   ├── unit/                     # Unit tests
│   ├── integration/              # Integration tests
│   └── fixtures/                 # Test data
├── docs/
│   ├── API.md
│   ├── ARCHITECTURE.md
│   └── DEPLOYMENT.md
├── data/                         # Data directory (gitignored)
├── package.json
├── tsconfig.json
├── vitest.config.ts
├── .env.example
└── README.md
```

### Configuration management

```typescript
// src/config.ts
import { z } from 'zod';
import 'dotenv/config';

const configSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().int().positive().default(3000),
  HOST: z.string().default('0.0.0.0'),
  
  // Storage
  DATA_DIR: z.string().default('./data'),
  BACKUP_DIR: z.string().default('./backups'),
  
  // Logging
  LOG_LEVEL: z.enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace']).default('info'),
  
  // Security
  API_KEY: z.string().optional(),
  JWT_SECRET: z.string().optional(),
  
  // Features
  ENABLE_GIT_INTEGRATION: z.coerce.boolean().default(false),
  AUTO_BACKUP_INTERVAL: z.coerce.number().default(3600), // seconds
});

export const config = configSchema.parse(process.env);

// Type-safe access
export type Config = z.infer<typeof configSchema>;
```

### Testing strategy

**Unit tests** (Vitest)

```typescript
// tests/unit/schema-manage.test.ts
import { describe, it, expect, beforeEach } from 'vitest';
import { addSchema } from '../../src/tools/schema-manage';

describe('schema-manage', () => {
  let spec: any;
  
  beforeEach(() => {
    spec = {
      openapi: '3.0.0',
      info: { title: 'Test', version: '1.0.0' },
      components: { schemas: {} }
    };
  });
  
  it('should add new schema to components', () => {
    const result = addSchema(spec, 'User', {
      type: 'object',
      properties: { name: { type: 'string' } }
    });
    
    expect(result.components.schemas.User).toBeDefined();
    expect(result.components.schemas.User.type).toBe('object');
  });
  
  it('should throw error if schema already exists', () => {
    spec.components.schemas.User = { type: 'object' };
    
    expect(() => {
      addSchema(spec, 'User', { type: 'object' });
    }).toThrow('Schema User already exists');
  });
});
```

**Integration tests**

```typescript
// tests/integration/mcp-server.test.ts
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { buildServer } from '../../src/server';
import { FastifyInstance } from 'fastify';

describe('MCP Server Integration', () => {
  let app: FastifyInstance;
  
  beforeAll(async () => {
    app = await buildServer();
    await app.ready();
  });
  
  afterAll(async () => {
    await app.close();
  });
  
  it('should list all specs', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/mcp',
      headers: { 'x-api-key': 'test-key' },
      payload: {
        jsonrpc: '2.0',
        id: 1,
        method: 'tools/call',
        params: {
          name: 'spec_read',
          arguments: { query_type: 'full_spec' }
        }
      }
    });
    
    expect(response.statusCode).toBe(200);
    const result = response.json();
    expect(result.result).toBeDefined();
  });
});
```

**Performance testing**

```typescript
describe('Performance', () => {
  it('should handle 100 concurrent spec reads', async () => {
    const requests = Array.from({ length: 100 }, (_, i) =>
      callTool('spec_read', { query_type: 'full_spec' })
    );
    
    const start = Date.now();
    await Promise.all(requests);
    const duration = Date.now() - start;
    
    expect(duration).toBeLessThan(5000); // 5 seconds for 100 requests
  });
});
```

## Production deployment guide

### Docker configuration

```dockerfile
# Multi-stage build for minimal image
FROM node:20-alpine AS builder

WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production

COPY . .
RUN npm run build

# Production image
FROM node:20-alpine

WORKDIR /app

# Copy built application
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY package*.json ./

# Create data directory
RUN mkdir -p /app/data

ENV NODE_ENV=production
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s \
  CMD node -e "require('http').get('http://localhost:3000/health', (r) => process.exit(r.statusCode === 200 ? 0 : 1))"

CMD ["node", "dist/server.js"]
```

### Monitoring and observability

**Structured logging with Pino**

```typescript
import pino from 'pino';

export const logger = pino({
  level: config.LOG_LEVEL,
  formatters: {
    level: (label) => ({ level: label.toUpperCase() })
  },
  redact: {
    paths: ['password', 'token', 'apiKey', '*.password', '*.token'],
    remove: true
  },
  transport: config.NODE_ENV === 'development' ? {
    target: 'pino-pretty',
    options: { colorize: true }
  } : undefined
});
```

**Metrics collection**

```typescript
import { Registry, Counter, Histogram } from 'prom-client';

const register = new Registry();

const toolCallDuration = new Histogram({
  name: 'mcp_tool_call_duration_seconds',
  help: 'Duration of MCP tool calls',
  labelNames: ['tool', 'status'],
  registers: [register]
});

const specOperations = new Counter({
  name: 'spec_operations_total',
  help: 'Total spec operations',
  labelNames: ['operation', 'api_id'],
  registers: [register]
});

// Export metrics endpoint
app.get('/metrics', async (req, reply) => {
  reply.type('text/plain');
  return register.metrics();
});
```

### Backup automation

```typescript
import { schedule } from 'node-cron';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

// Backup every hour
schedule('0 * * * *', async () => {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const backupPath = `${config.BACKUP_DIR}/backup-${timestamp}.tar.gz`;
  
  try {
    await execAsync(`tar -czf ${backupPath} ${config.DATA_DIR}`);
    logger.info({ backupPath }, 'Backup created successfully');
    
    // Keep only last 7 days of backups
    await cleanOldBackups(7);
  } catch (error) {
    logger.error({ error }, 'Backup failed');
  }
});
```

### Rate limiting

```typescript
import rateLimit from '@fastify/rate-limit';

await app.register(rateLimit, {
  max: 100,                    // 100 requests
  timeWindow: '15 minutes',
  cache: 10000,
  allowList: ['127.0.0.1'],
  keyGenerator: (req) => {
    return req.headers['x-api-key'] || req.ip;
  },
  errorResponseBuilder: (req, context) => ({
    statusCode: 429,
    error: 'Too Many Requests',
    message: `Rate limit exceeded, retry in ${context.ttl} seconds`
  })
});
```

## Complete implementation checklist

### Phase 1: Core functionality (Week 1-2)

- [ ] Initialize TypeScript project with Fastify
- [ ] Set up folder structure and configuration
- [ ] Implement file-based storage layer
- [ ] Create metadata schemas (JSON)
- [ ] Implement basic CRUD operations
- [ ] Add @apidevtools/swagger-parser integration
- [ ] Implement file locking for concurrent access
- [ ] Set up Pino logging
- [ ] Write unit tests for core functions

### Phase 2: MCP integration (Week 2-3)

- [ ] Install and configure @modelcontextprotocol/sdk
- [ ] Register fastify-mcp-server plugin
- [ ] Implement all 10 MCP tools
- [ ] Add Zod validation schemas for each tool
- [ ] Implement error handling patterns
- [ ] Add authentication (API key or OAuth)
- [ ] Write integration tests for MCP tools
- [ ] Test with MCP client

### Phase 3: Versioning and validation (Week 3-4)

- [ ] Implement version creation/management
- [ ] Add audit logging (JSON Lines format)
- [ ] Integrate Spectral for linting
- [ ] Add oasdiff for breaking change detection
- [ ] Implement version comparison/diff
- [ ] Add rollback functionality
- [ ] Write tests for versioning workflows

### Phase 4: Production readiness (Week 4-6)

- [ ] Add health check endpoints
- [ ] Implement metrics collection
- [ ] Set up automated backups
- [ ] Add rate limiting
- [ ] Create Docker configuration
- [ ] Write deployment documentation
- [ ] Implement graceful shutdown
- [ ] Performance testing and optimization
- [ ] Security audit
- [ ] Complete E2E testing

## Key architectural decisions summary

**Why file-based storage**: Simple, debuggable, sufficient performance for most use cases, Git-friendly, easy backup/restore, no database overhead.

**Why 10 MCP tools**: Research shows 8-12 tools is optimal for LLM performance. More tools create decision paralysis; fewer tools become too broad and difficult to validate.

**Why Fastify over Express**: Better TypeScript support, superior performance, modern plugin architecture, native async/await, built-in schema validation.

**Why @apidevtools/swagger-parser**: Most mature and battle-tested (2.5M weekly downloads), comprehensive feature set, supports all OpenAPI versions, excellent TypeScript types.

**Why Spectral for linting**: Industry standard, highly customizable, pre-built style guides, excellent documentation, CLI and JavaScript API.

**Why oasdiff for breaking changes**: Most comprehensive solution, multiple output formats, GitHub Actions integration, actively maintained.

**Why Pino for logging**: Fastest JSON logger for Node.js, redaction support, transport plugins, excellent ecosystem.

This specification provides everything needed to build a production-ready MCP server for OpenAPI management. The architecture balances simplicity (file-based storage), power (full LLM control), and safety (validation + versioning). Estimated development time: 2-3 weeks for MVP, 4-6 weeks for production-ready deployment with full testing and documentation.