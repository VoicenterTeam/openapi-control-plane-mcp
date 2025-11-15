# OpenAPI Cursor Rules - Testing Guide

This document provides test scenarios to validate the two specialized OpenAPI Cursor rules work correctly.

## Overview

Two specialized Cursor rules have been created:
1. **`.cursorrules-openapi-new`** - For building new OpenAPI specs from scratch
2. **`.cursorrules-openapi-optimize`** - For optimizing existing OpenAPI specs

## How to Use These Rules

### Option 1: Add to Project-Level .cursorrules

Copy the content of either rule file into your project's `.cursorrules` file with conditional triggers:

```markdown
# In your .cursorrules file:

## When Creating New OpenAPI Specs
[Include content from .cursorrules-openapi-new when user mentions "create OpenAPI spec", "new API documentation", etc.]

## When Optimizing Existing OpenAPI Specs  
[Include content from .cursorrules-openapi-optimize when user mentions "optimize OpenAPI", "improve spec", etc.]
```

### Option 2: Use as Separate Rule Files

Keep them as separate files and reference them explicitly:
- "Use the OpenAPI new spec rules to create..."
- "Use the OpenAPI optimize rules to improve..."

### Option 3: Combine with Workspace Rules

Add these rules to your workspace configuration, making them available across all projects.

## Test Scenarios

### Test 1: Building a New E-Commerce Product API Spec

**Test the `.cursorrules-openapi-new` rule**

#### Test Input:
```
Create an OpenAPI spec for my e-commerce product management API from scratch.
```

#### Expected AI Behavior:

1. **Requirements Gathering Phase**:
   - AI should ask comprehensive questions about:
     - Authentication mechanism (OAuth2, API keys, JWT)
     - Product data model (properties, relationships)
     - Operations needed (CRUD, search, filtering)
     - Pagination strategy
     - Rate limiting
     - File uploads (product images)
     - Error handling patterns

2. **MCP Tools Usage**:
   - AI should use tools in this order:
     1. `metadata_update` - Set API info, contact, license
     2. `security_configure` - Define auth schemes
     3. `schema_manage` - Create Product schemas
     4. `endpoint_manage` - Add product endpoints
     5. `parameters_configure` - Add query/path params
     6. `responses_configure` - Define all responses (2xx, 4xx, 5xx)
     7. `spec_validate` - Validate with includeHints=true
     8. `version_control` - Create v1.0.0

3. **Quality Checks**:
   - [ ] API has 2-3 paragraph description
   - [ ] All schemas in components (no inline)
   - [ ] Every schema has description and example
   - [ ] All endpoints have comprehensive descriptions
   - [ ] All parameters documented with examples
   - [ ] Success responses: 200, 201, 204
   - [ ] Error responses: 400, 401, 403, 404, 500
   - [ ] Response headers documented (pagination, rate limits)
   - [ ] Security schemes defined and applied
   - [ ] Zero validation errors

#### Sample Expected Output Structure:
```yaml
openapi: 3.0.0
info:
  title: E-Commerce Product Management API
  description: |
    Comprehensive API for managing product catalog in an e-commerce platform.
    
    This API provides complete CRUD operations for products, including inventory
    management, category assignment, and image uploads. Designed for use by both
    internal services and external partners with OAuth2 authentication.
    
    Key features include advanced filtering, full-text search, pagination,
    and comprehensive error handling.
  version: 1.0.0
  contact:
    name: API Support
    email: api-support@example.com
  license:
    name: MIT
    
components:
  securitySchemes:
    oauth2:
      type: oauth2
      description: OAuth2 authentication with client credentials flow
      flows:
        clientCredentials:
          tokenUrl: https://auth.example.com/oauth/token
          scopes:
            read:products: Read product information
            write:products: Create and update products
            delete:products: Delete products
            
  schemas:
    Product:
      type: object
      description: |
        Represents a product in the e-commerce catalog with complete
        information including pricing, inventory, and categorization.
      required: [id, name, sku, price]
      properties:
        id:
          type: integer
          description: Unique product identifier assigned by the system
          example: 12345
        name:
          type: string
          description: Product display name shown to customers
          minLength: 1
          maxLength: 200
          example: "Wireless Bluetooth Headphones"
        sku:
          type: string
          description: Stock Keeping Unit for inventory tracking
          pattern: '^[A-Z0-9-]+$'
          example: "WBH-001-BLK"
        price:
          type: number
          format: float
          description: Current product price in USD
          minimum: 0
          example: 79.99
        # ... more properties

paths:
  /products:
    get:
      summary: List all products with filtering and pagination
      description: |
        Retrieves a paginated list of products from the catalog.
        
        Supports advanced filtering by category, price range, availability,
        and full-text search. Results include pagination metadata in response
        headers for easy navigation.
        
        **Use Cases:**
        - Display product listings on storefront
        - Admin product management dashboard
        - Inventory reporting
        
        **Performance:**
        - Maximum 100 items per page
        - Results cached for 5 minutes
        - Rate limited to 100 requests/minute
      operationId: listProducts
      tags: [Products]
      security:
        - oauth2: [read:products]
      parameters:
        - name: page
          in: query
          description: Page number for pagination (1-indexed)
          schema:
            type: integer
            minimum: 1
            default: 1
          example: 1
        - name: limit
          in: query
          description: Number of items per page (max 100)
          schema:
            type: integer
            minimum: 1
            maximum: 100
            default: 20
          example: 20
      responses:
        '200':
          description: Successfully retrieved product list
          headers:
            X-Total-Count:
              description: Total number of products matching filters
              schema:
                type: integer
            X-Page:
              description: Current page number
              schema:
                type: integer
            X-RateLimit-Limit:
              description: Requests allowed per hour
              schema:
                type: integer
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/ProductListResponse'
        '400':
          description: Invalid query parameters
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/ErrorResponse'
        '401':
          description: Authentication required
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/ErrorResponse'
        '500':
          description: Internal server error
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/ErrorResponse'
```

---

### Test 2: Optimizing an Existing User Management API

**Test the `.cursorrules-openapi-optimize` rule**

#### Test Setup:
Create a basic/incomplete OpenAPI spec first (simulating existing spec):

```yaml
openapi: 3.0.0
info:
  title: User API
  version: 1.0.0
paths:
  /users:
    get:
      summary: Get users
      responses:
        '200':
          description: Success
          content:
            application/json:
              schema:
                type: array
                items:
                  type: object
                  properties:
                    id:
                      type: integer
                    name:
                      type: string
  /users/{id}:
    get:
      parameters:
        - name: id
          in: path
          required: true
          schema:
            type: integer
      responses:
        '200':
          description: Success
```

#### Test Input:
```
Optimize my existing user management OpenAPI spec. It's very basic and needs comprehensive improvements.
```

#### Expected AI Behavior:

1. **Analysis Phase**:
   - AI should use `spec_read` with queryType="full"
   - AI should use `spec_validate` with includeHints=true
   - AI should identify issues:
     - Missing API description
     - No contact/license info
     - No security configuration
     - Inline schemas (should be in components)
     - Missing operation descriptions
     - Missing parameter descriptions
     - Missing error responses (400, 401, 404, 500)
     - No examples
     - Missing response headers
     - Vague descriptions ("Get users" vs detailed explanation)

2. **Backup Phase**:
   - AI should use `version_control` to create backup version

3. **Optimization Phase** (in order):
   1. `metadata_update` - Add comprehensive description, contact, license
   2. `security_configure` - Add OAuth2/API key schemes
   3. `schema_manage` - Extract inline schemas to components, add descriptions/examples
   4. `endpoint_manage` - Enhance operation descriptions
   5. `parameters_configure` - Add comprehensive parameter docs
   6. `responses_configure` - Add all missing responses (400, 401, 404, 500)
   7. `spec_validate` - Re-validate
   8. `version_control` - Compare versions, create new version

4. **Quality Improvements**:
   - [ ] API description expanded to 2-3 paragraphs
   - [ ] Contact and license added
   - [ ] Security schemes defined
   - [ ] Schemas extracted to components
   - [ ] All schemas have descriptions and examples
   - [ ] Operation descriptions are comprehensive
   - [ ] All parameters fully documented
   - [ ] Error responses added (400, 401, 404, 500)
   - [ ] Response headers added
   - [ ] Validation errors: before > 0, after = 0
   - [ ] Warnings reduced significantly

#### Sample Expected Optimizations:

**Before:**
```yaml
get:
  summary: Get users
```

**After:**
```yaml
get:
  summary: Retrieve paginated list of user accounts
  description: |
    Fetches a paginated list of all user accounts in the system with support
    for filtering and sorting.
    
    Returns user profiles including account status, registration date, and
    contact information. Requires authentication with read:users scope.
    Administrators can view all users; regular users can only list users
    within their organization.
    
    **Use Cases:**
    - Admin user management dashboard
    - User directory/search functionality
    - Team member selection interfaces
    
    **Performance:**
    - Results cached for 2 minutes
    - Maximum 100 users per page
    - Rate limited to 200 requests/hour
    
    **Related Operations:**
    - Use getUserById to fetch detailed user information
    - Use createUser to add new users
  operationId: listUsers
  tags: [Users]
  security:
    - oauth2: [read:users]
```

**Before:**
```yaml
schema:
  type: object
  properties:
    id:
      type: integer
    name:
      type: string
```

**After:**
```yaml
components:
  schemas:
    User:
      type: object
      description: |
        Represents a user account in the system with authentication credentials
        and profile information. Users can have different roles and permissions.
      required: [id, email, name, status]
      properties:
        id:
          type: integer
          description: |
            Unique user identifier assigned automatically upon account creation.
            Used in all user-related API operations.
          example: 42
        name:
          type: string
          description: |
            User's full display name shown in the UI. Can be updated by the user
            or administrators. Must be between 1 and 100 characters.
          minLength: 1
          maxLength: 100
          example: "Jane Doe"
        email:
          type: string
          format: email
          description: |
            User's primary email address used for login and system notifications.
            Must be unique across all users. Validated against RFC 5322 standard.
          example: "jane.doe@example.com"
          maxLength: 255
        status:
          type: string
          enum: [active, inactive, pending, suspended]
          description: |
            Current account status:
            - active: User has full access to the system
            - inactive: Account deactivated by user
            - pending: Awaiting email verification
            - suspended: Administratively disabled
          example: "active"
```

**Response improvements:**
```yaml
responses:
  '200':
    description: Successfully retrieved user list
    headers:
      X-Total-Count:
        description: Total number of users across all pages
        schema:
          type: integer
        example: 1523
      X-Page:
        description: Current page number (1-indexed)
        schema:
          type: integer
        example: 1
      X-RateLimit-Remaining:
        description: Remaining requests in current hour
        schema:
          type: integer
        example: 195
    content:
      application/json:
        schema:
          $ref: '#/components/schemas/UserListResponse'
  '400':
    description: Invalid query parameters provided
    content:
      application/json:
        schema:
          $ref: '#/components/schemas/ErrorResponse'
        example:
          error: "INVALID_PARAMETER"
          message: "Page number must be a positive integer"
          status: 400
  '401':
    description: Authentication required or token expired
    content:
      application/json:
        schema:
          $ref: '#/components/schemas/ErrorResponse'
  '403':
    description: Insufficient permissions to list users
    content:
      application/json:
        schema:
          $ref: '#/components/schemas/ErrorResponse'
  '500':
    description: Internal server error occurred
    content:
      application/json:
        schema:
          $ref: '#/components/schemas/ErrorResponse'
```

---

### Test 3: Context-Aware Optimization for Telecom Provisioning API

**Test the `.cursorrules-openapi-new` rule with domain-specific context**

#### Test Input:
```
Create an OpenAPI spec for our telecom provisioning API that handles DID (phone number) 
assignment to customer accounts.
```

#### Expected AI Behavior:

1. **Domain Understanding Questions**:
   - What DID operations are needed? (assign, release, search availability)
   - What's the DID data model? (number, country code, area code, status, capabilities)
   - Authentication for telecom systems? (likely API keys or mTLS)
   - Rate limiting for provisioning operations?
   - Webhook callbacks for async provisioning?
   - Compliance requirements? (GDPR for EU numbers, E911 for US)

2. **Telecom-Specific Optimizations**:
   - Schema should include telecom-specific fields:
     - `e164Number`: Full E.164 formatted number
     - `countryCode`: ISO country code
     - `capabilities`: voice, SMS, fax, emergency services
     - `regulatoryStatus`: E911 registered, GDPR compliant
   - Operations should include:
     - Search available DIDs by area code/country
     - Reserve DID (hold for X minutes)
     - Assign DID to customer account
     - Release DID back to pool
     - Update DID configuration (forwarding, emergency address)
   - Response times documented (provisioning may take 1-30 seconds)
   - Webhook callbacks for async operations
   - Idempotency keys for provisioning operations

3. **Expected Spec Quality**:
   - Descriptions use telecom terminology correctly
   - Examples use realistic phone numbers
   - Error codes specific to provisioning (DID_NOT_AVAILABLE, ALREADY_ASSIGNED)
   - Rate limiting appropriate for provisioning (lower than standard APIs)

---

## Validation Checklist

After testing each rule, verify:

### For New Spec Rule (.cursorrules-openapi-new):
- [ ] AI asks comprehensive requirements questions
- [ ] AI understands application domain context
- [ ] AI uses all 10 MCP tools appropriately
- [ ] Schemas created before endpoints
- [ ] Security configured early
- [ ] All descriptions are comprehensive (2+ sentences minimum)
- [ ] Examples are realistic and domain-appropriate
- [ ] All response codes included (2xx, 4xx, 5xx)
- [ ] Response headers documented
- [ ] Validation passes with zero errors
- [ ] Initial version created

### For Optimize Rule (.cursorrules-openapi-optimize):
- [ ] AI reads and analyzes spec first
- [ ] AI runs validation before changes
- [ ] AI creates backup version
- [ ] AI identifies all optimization opportunities
- [ ] AI extracts inline schemas
- [ ] AI adds comprehensive descriptions
- [ ] AI completes missing responses
- [ ] AI documents headers
- [ ] AI re-validates after changes
- [ ] AI compares versions
- [ ] Breaking changes detected/avoided

### For Both Rules:
- [ ] Comprehensive descriptions everywhere
- [ ] No inline schemas (all in components)
- [ ] Consistent naming conventions
- [ ] All examples are realistic
- [ ] Security properly configured
- [ ] Error responses standardized
- [ ] Response headers documented
- [ ] Validation errors = 0
- [ ] Context-aware recommendations

## Integration Testing

Test both rules in sequence:

1. **Use new spec rule** to create initial API spec
2. **Intentionally degrade** the spec (remove descriptions, inline some schemas)
3. **Use optimize rule** to restore and enhance
4. **Compare** results - should match or exceed original quality

## Performance Expectations

- New spec creation: 5-15 minutes of AI interaction (questions + implementation)
- Optimization: 3-10 minutes (analysis + improvements)
- Number of MCP tool calls:
  - New spec: 15-30 tool calls
  - Optimization: 20-40 tool calls (depends on issues found)

## Common Issues to Watch For

1. **Rule doesn't activate**: Check trigger phrases match user input
2. **Incomplete requirements gathering**: Ensure all 10 questions asked
3. **Skipped validation**: AI must validate after changes
4. **No backup before optimization**: AI must create backup version
5. **Inline schemas not extracted**: Check schema_manage usage
6. **Missing error responses**: Verify responses_configure calls
7. **Generic descriptions**: Should be domain-specific and detailed
8. **No examples**: Every schema needs examples
9. **Breaking changes**: Verify version_control comparison used

## Success Criteria

Both rules are successful if:
- ✅ They produce production-ready OpenAPI specs
- ✅ Zero validation errors
- ✅ Comprehensive documentation throughout
- ✅ Context-aware and domain-appropriate
- ✅ All MCP tools used correctly
- ✅ Consistent with OpenAPI best practices
- ✅ Developer-friendly and self-documenting

## Next Steps

After testing:
1. Integrate successful rules into your team's workflow
2. Document usage patterns in team wiki
3. Create templates for common API types
4. Train team on using rules effectively
5. Gather feedback and iterate on rules

## Feedback and Iteration

Track these metrics:
- Time saved vs manual OpenAPI creation
- Validation error rates (before/after using rules)
- Developer satisfaction with generated specs
- Number of iterations needed to reach production quality

Use feedback to enhance rules over time.

