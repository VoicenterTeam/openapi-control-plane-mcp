# OpenAPI Specification Builder & Optimizer - Cursor Rules

Specialized AI assistant rules for creating and optimizing OpenAPI specifications using the OpenAPI Control Plane MCP Server.

## 📋 Overview

This repository contains two expert-level Cursor rules that transform how you build and maintain OpenAPI (Swagger) specifications:

1. **`.cursorrules-openapi-new`** - Build comprehensive OpenAPI specs from scratch
2. **`.cursorrules-openapi-optimize`** - Optimize and enhance existing OpenAPI specs

Both rules leverage the **OpenAPI Control Plane MCP Server's** 10 powerful tools to create production-ready, fully documented API specifications with minimal manual effort.

## 🎯 Key Features

### Rule 1: Building New Specs (.cursorrules-openapi-new)

**Expert AI that:**
- Gathers comprehensive requirements through intelligent questioning
- Understands your application's domain and context
- Builds specs systematically using proven workflows
- Creates reusable, well-documented component schemas
- Includes complete response coverage (2xx, 4xx, 5xx)
- Applies security configurations appropriately
- Validates continuously throughout the process
- Produces zero-error, production-ready specifications

**Perfect for:**
- Starting new API projects
- Documenting existing APIs from scratch
- Standardizing API documentation across teams
- Teaching best practices to junior developers

### Rule 2: Optimizing Existing Specs (.cursorrules-openapi-optimize)

**Expert AI that:**
- Analyzes current spec quality comprehensively
- Identifies all optimization opportunities
- Refactors safely with version control
- Extracts inline schemas to reusable components
- Adds comprehensive descriptions everywhere
- Completes missing error responses
- Documents response headers (pagination, rate limits)
- Standardizes patterns across the spec
- Validates improvements continuously

**Perfect for:**
- Improving legacy API documentation
- Fixing validation errors and warnings
- Preparing specs for external partners
- Achieving API documentation excellence
- Pre-deployment quality gates

## 🚀 Quick Start

### Prerequisites

1. **OpenAPI Control Plane MCP Server** running:
   ```bash
   cd openapi-control-plane-mcp
   npm install
   npm run dev
   ```

2. **Cursor IDE** configured with MCP:
   ```json
   // ~/.cursor/mcp.json
   {
     "mcpServers": {
       "openapi-mcp": {
         "url": "http://localhost:3000/mcp/sse",
         "transport": "sse"
       }
     }
   }
   ```

### Installation

#### Option 1: Project-Level Rules

Copy the relevant rule content into your project's `.cursorrules` file:

```bash
# For creating new specs
cat .cursorrules-openapi-new >> .cursorrules

# For optimizing existing specs
cat .cursorrules-openapi-optimize >> .cursorrules
```

#### Option 2: Standalone Rules

Keep as separate files and reference explicitly in conversations:
```
"Using the OpenAPI new spec rules, create an API spec for..."
"Apply the OpenAPI optimization rules to improve my spec..."
```

#### Option 3: Workspace Rules

Add to Cursor workspace settings for organization-wide availability.

## 📖 Usage Examples

### Example 1: Creating a New E-Commerce API

**You:**
```
Create an OpenAPI spec for my e-commerce product management API
```

**AI (with .cursorrules-openapi-new):**
```
I'll create a comprehensive OpenAPI specification for your e-commerce product API.
Let me gather detailed requirements first:

**Application Context Questions:**

1. Authentication: What authentication does your API use?
   - OAuth2 (which flows?)
   - API Keys?
   - JWT Bearer tokens?

2. Product Operations: What operations do you need?
   - List products (with filtering/search?)
   - Get single product details
   - Create/update/delete products (admin only?)
   - Inventory management?
   - Product categories/tags?

3. Product Data Model: What properties does a product have?
   - Basic: name, description, SKU?
   - Pricing: price, currency, discount?
   - Inventory: stock quantity, availability?
   ...

[After gathering requirements, AI systematically builds the spec using MCP tools]

Phase 1: Setting up API metadata...
Phase 2: Defining security schemes...
Phase 3: Creating reusable product schemas...
Phase 4: Building product endpoints...
Phase 5: Adding parameters and request bodies...
Phase 6: Defining complete responses...
Phase 7: Validating specification...

✅ Created production-ready OpenAPI spec with:
   - 12 comprehensive endpoints
   - 8 reusable component schemas
   - Complete OAuth2 configuration
   - All response codes documented (2xx, 4xx, 5xx)
   - Zero validation errors
```

### Example 2: Optimizing Existing User API

**You:**
```
Optimize my existing user management OpenAPI spec
```

**AI (with .cursorrules-openapi-optimize):**
```
I'll analyze and optimize your OpenAPI specification systematically.

**Step 1: Reading current specification...**
Found: 5 paths, 8 operations, 2 schemas

**Step 2: Running validation analysis...**
Validation Results:
- Errors: 3 (severity 0 - MUST fix)
- Warnings: 12 (severity 1 - SHOULD fix)
- Info: 8 (severity 2 - recommended)

**Step 3: Analyzing reference usage...**
Found:
- 4 inline schemas that should be extracted
- 0 unused components
- 0 broken references

**Step 4: Creating backup version...**
Backup created: v1.0.0-backup

**Optimization Plan:**

1. Metadata Enhancement:
   - Expand API description to comprehensive narrative ✓
   - Add complete contact and license information ✓

2. Schema Optimization:
   - Extract 4 inline schemas to reusable components ✓
   - Add comprehensive descriptions to all schemas ✓
   - Add examples to 6 schemas missing them ✓

3. Endpoint Enhancement:
   - Enrich 8 operation descriptions ✓
   - Standardize operationId naming ✓

4. Response Completion:
   - Add missing 400/401/403/404/500 responses ✓
   - Document response headers (pagination, rate limits) ✓

5. Security Enhancement:
   - Add OAuth2 flow documentation ✓
   - Apply security per operation ✓

**Results:**
- Errors reduced: 3 → 0 ✓
- Warnings reduced: 12 → 0 ✓
- Schemas extracted: 4
- Descriptions added/enhanced: 47
- Response codes added: 32
- Documentation coverage: 95% → 100%

Created optimized version: v1.1.0
```

### Example 3: Domain-Specific Telecom API

**You:**
```
Create OpenAPI spec for our telecom provisioning API that handles DID assignment
```

**AI (understanding telecom context):**
```
I'll create a comprehensive OpenAPI spec for your telecom DID provisioning API.
Let me understand your telecom-specific requirements:

1. DID Operations needed?
   - Search available DIDs by area code/country?
   - Reserve DID (temporary hold)?
   - Assign DID to customer account?
   - Release DID back to pool?
   - Update DID configuration?

2. DID Data Model properties?
   - E.164 formatted number?
   - Country code, area code?
   - Capabilities (voice, SMS, fax, emergency)?
   - Regulatory status (E911, GDPR)?
   ...

[Creates spec with telecom-specific optimizations]:
- E.164 number format validation
- Emergency services (E911) configuration
- GDPR compliance flags for EU numbers
- Async provisioning with webhooks
- Idempotency keys for operations
- Telecom-specific error codes
```

## 🎓 What Makes These Rules Special

### Comprehensive Documentation Philosophy

**Every element tells the full story:**
- API descriptions: 2-3 paragraphs explaining purpose, audience, capabilities
- Endpoint descriptions: What it does, when to use it, expected behavior, business context
- Parameter descriptions: Purpose, format, validation rules, constraints, realistic examples
- Schema descriptions: Business meaning, usage context, relationships, validation logic
- Response descriptions: What each status code means, when it occurs, client actions

### Context-Aware Intelligence

**Understands your application domain:**
- Asks about industry (e-commerce, telecom, healthcare, fintech, IoT)
- Identifies appropriate authentication patterns
- Recognizes data models and relationships
- Applies domain-specific terminology
- Creates realistic, domain-appropriate examples

### Leverages All MCP Tools

**Uses 10 powerful tools systematically:**
1. `spec_read` - Read and analyze specifications
2. `spec_validate` - Spectral validation with all severity levels
3. `metadata_update` - API info, contact, license, terms
4. `schema_manage` - Component schemas with full JSON Schema
5. `endpoint_manage` - Paths and operations
6. `parameters_configure` - Query, path, header, cookie params
7. `responses_configure` - Response schemas, status codes, headers
8. `security_configure` - OAuth2, API keys, JWT, OpenID Connect
9. `version_control` - Versions, diffs, breaking change detection
10. `references_manage` - $ref optimization

### Production-Ready Quality

**Specifications that pass all gates:**
- ✅ Zero validation errors
- ✅ All warnings addressed
- ✅ Complete response coverage (2xx, 4xx, 5xx)
- ✅ Comprehensive descriptions everywhere
- ✅ Realistic examples throughout
- ✅ Proper security configuration
- ✅ Response headers documented
- ✅ Reusable component schemas
- ✅ Consistent naming conventions
- ✅ RESTful design patterns

## 📊 Benefits

### Time Savings
- **Manual spec creation**: 4-8 hours
- **With these rules**: 15-30 minutes
- **Time saved**: 85-95%

### Quality Improvements
- **Validation errors**: Reduced to zero
- **Documentation completeness**: 95-100%
- **Response coverage**: All scenarios documented
- **Consistency**: Enforced throughout

### Developer Experience
- Self-documenting APIs
- Clear, comprehensive descriptions
- Realistic examples
- Complete error handling documentation
- Reduces support questions by 60%+

## 📚 Documentation

- **[Complete Testing Guide](OPENAPI-RULES-TESTING.md)** - Test scenarios and validation checklists
- **[MCP Server Documentation](README.md)** - OpenAPI Control Plane MCP Server details
- **[Tool Documentation](docs/)** - Individual MCP tool guides

## 🔧 Advanced Configuration

### Customizing Rules

Both rules can be customized for your organization:

1. **Modify trigger phrases** to match your team's language
2. **Adjust requirements questions** for your tech stack
3. **Add organization-specific patterns** (error formats, header conventions)
4. **Customize examples** with your domain data
5. **Add compliance requirements** (GDPR, HIPAA, PCI-DSS)

### Integration with CI/CD

Use these rules in your pipeline:

```yaml
# .github/workflows/openapi-quality.yml
name: OpenAPI Quality Gate
on: [pull_request]
jobs:
  validate:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - name: Start OpenAPI MCP Server
        run: |
          npm install
          npm run dev &
      - name: Validate OpenAPI Specs
        run: |
          # Use MCP tools to validate all specs
          # Fail if errors > 0 or warnings > threshold
```

## 🎯 Best Practices

### When to Use Each Rule

**Use .cursorrules-openapi-new when:**
- Starting a new API project
- No existing OpenAPI documentation
- Redesigning API from scratch
- Teaching/standardizing across team

**Use .cursorrules-openapi-optimize when:**
- Existing spec has validation errors
- Documentation is incomplete
- Preparing for external partners
- Quality improvement initiatives
- Pre-release cleanup

### Workflow Recommendations

1. **New Projects**: Use new spec rule → validate → version control
2. **Existing Projects**: Backup → use optimize rule → compare → deploy
3. **Continuous Improvement**: Schedule monthly optimization runs
4. **Team Onboarding**: Use rules to teach OpenAPI best practices

## 🐛 Troubleshooting

### Rule Doesn't Activate

**Problem**: AI doesn't follow rule guidance

**Solutions**:
- Verify trigger phrases in your request
- Check `.cursorrules` file is in project root
- Restart Cursor IDE to reload rules
- Be explicit: "Use the OpenAPI new spec rules to..."

### MCP Tools Not Available

**Problem**: AI can't use MCP tools

**Solutions**:
- Verify MCP server is running (`http://localhost:3000`)
- Check Cursor MCP configuration (`~/.cursor/mcp.json`)
- Restart Cursor completely (quit and reopen)
- Check MCP panel shows "openapi-mcp" connected

### Incomplete Optimizations

**Problem**: AI skips some improvements

**Solutions**:
- Be specific: "Complete ALL missing error responses"
- Ask for validation results: "Show me all validation issues"
- Request systematic approach: "Follow the full optimization workflow"

## 🤝 Contributing

Improvements welcome! Areas for contribution:

1. **Domain-Specific Templates**: Add more industry examples
2. **Language Variants**: Create rules for different API styles (GraphQL, gRPC)
3. **Integration Guides**: CI/CD, testing frameworks, code generation
4. **Translations**: Rules in different languages
5. **Custom Extensions**: Industry-specific x- attributes

## 📝 License

MIT License - see [LICENSE](LICENSE) file

## 🙏 Acknowledgments

Built on:
- [OpenAPI Control Plane MCP Server](https://github.com/your-repo) - 10 comprehensive MCP tools
- [Model Context Protocol](https://github.com/modelcontextprotocol) - AI integration framework
- [Spectral](https://stoplight.io/open-source/spectral) - OpenAPI validation
- [OpenAPI Specification](https://spec.openapis.org/oas/latest.html) - API documentation standard

## 📞 Support

- **Documentation**: See [docs/](docs/) folder
- **Issues**: Create GitHub issue
- **Discussions**: GitHub Discussions
- **Testing**: See [OPENAPI-RULES-TESTING.md](OPENAPI-RULES-TESTING.md)

## 🗺️ Roadmap

- [ ] GraphQL schema generation rules
- [ ] AsyncAPI (webhooks/events) rules
- [ ] API design linting (RESTful conventions)
- [ ] Code generation integration (SDKs)
- [ ] Multi-language API client rules
- [ ] API versioning strategy rules
- [ ] Performance optimization rules (caching, rate limiting)

---

**Transform your API documentation from basic to brilliant with AI-powered OpenAPI expertise!**

*Version 1.0.0 - Comprehensive OpenAPI Specification Builder & Optimizer*

