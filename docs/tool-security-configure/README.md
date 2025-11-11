# Security Configure Tool

## Overview

Manages API security configurations including security schemes (API keys, OAuth2, JWT) and global security requirements in OpenAPI specifications.

## Features

- ✅ List security schemes
- ✅ Add security schemes
- ✅ Delete security schemes
- ✅ Set global security requirements
- ✅ Support for API keys, HTTP auth, OAuth2, OpenID Connect

## Usage

### List Security Schemes

```typescript
await securityConfigureTool.execute({
  apiId: 'my-api',
  version: 'v1.0.0',
  operation: 'list_schemes',
})
```

### Add API Key Security

```typescript
await securityConfigureTool.execute({
  apiId: 'my-api',
  version: 'v1.0.0',
  operation: 'add_scheme',
  schemeName: 'apiKey',
  scheme: {
    type: 'apiKey',
    in: 'header',
    name: 'X-API-Key',
    description: 'API key for authentication'
  }
})
```

### Add Bearer Token (JWT)

```typescript
await securityConfigureTool.execute({
  apiId: 'my-api',
  version: 'v1.0.0',
  operation: 'add_scheme',
  schemeName: 'bearerAuth',
  scheme: {
    type: 'http',
    scheme: 'bearer',
    bearerFormat: 'JWT',
    description: 'JWT token authentication'
  }
})
```

### Add OAuth2

```typescript
await securityConfigureTool.execute({
  apiId: 'my-api',
  version: 'v1.0.0',
  operation: 'add_scheme',
  schemeName: 'oauth2',
  scheme: {
    type: 'oauth2',
    flows: {
      authorizationCode: {
        authorizationUrl: 'https://auth.example.com/oauth/authorize',
        tokenUrl: 'https://auth.example.com/oauth/token',
        scopes: {
          'read:users': 'Read user information',
          'write:users': 'Modify user information',
          'admin': 'Admin access'
        }
      }
    }
  }
})
```

### Add OpenID Connect

```typescript
await securityConfigureTool.execute({
  apiId: 'my-api',
  version: 'v1.0.0',
  operation: 'add_scheme',
  schemeName: 'openId',
  scheme: {
    type: 'openIdConnect',
    openIdConnectUrl: 'https://auth.example.com/.well-known/openid-configuration'
  }
})
```

### Set Global Security

```typescript
await securityConfigureTool.execute({
  apiId: 'my-api',
  version: 'v1.0.0',
  operation: 'set_global',
  security: [
    { apiKey: [] },
    { bearerAuth: [] }
  ]
})
```

### Delete Security Scheme

```typescript
await securityConfigureTool.execute({
  apiId: 'my-api',
  version: 'v1.0.0',
  operation: 'delete_scheme',
  schemeName: 'deprecatedAuth',
})
```

## Parameters

| Parameter | Required For | Type | Description |
|-----------|--------------|------|-------------|
| **apiId** | all | string | API identifier |
| **version** | all | string | Version tag |
| **operation** | all | enum | `list_schemes`, `add_scheme`, `delete_scheme`, `set_global` |
| **schemeName** | add_scheme, delete_scheme | string | Security scheme name |
| **scheme** | add_scheme | object | Security scheme definition |
| **security** | set_global | array | Global security requirements |

## Security Scheme Types

### API Key

```typescript
{
  type: 'apiKey',
  in: 'header' | 'query' | 'cookie',
  name: 'X-API-Key',  // Header/query/cookie name
  description: 'API key authentication'
}
```

### HTTP Authentication

```typescript
{
  type: 'http',
  scheme: 'basic' | 'bearer' | 'digest',
  bearerFormat: 'JWT',  // Optional for bearer
  description: 'HTTP authentication'
}
```

### OAuth 2.0

```typescript
{
  type: 'oauth2',
  flows: {
    implicit: {
      authorizationUrl: 'https://...',
      scopes: { 'scope': 'description' }
    },
    password: {
      tokenUrl: 'https://...',
      scopes: {...}
    },
    clientCredentials: {
      tokenUrl: 'https://...',
      scopes: {...}
    },
    authorizationCode: {
      authorizationUrl: 'https://...',
      tokenUrl: 'https://...',
      refreshUrl: 'https://...',  // Optional
      scopes: {...}
    }
  }
}
```

### OpenID Connect

```typescript
{
  type: 'openIdConnect',
  openIdConnectUrl: 'https://.../.well-known/openid-configuration'
}
```

## Global vs Operation-Level Security

### Global Security
Applied to all operations unless overridden:

```typescript
security: [
  { apiKey: [] },           // OR
  { bearerAuth: [] }        // OR
]
```

### Operation-Level Security
Override global security for specific operations (configured via endpoint metadata).

## OAuth2 Scopes

```typescript
scopes: {
  'read:users': 'Read user data',
  'write:users': 'Modify user data',
  'delete:users': 'Delete users',
  'admin': 'Full administrative access'
}
```

## Best Practices

1. **Use HTTPS** - Always use secure connections for authentication
2. **Multiple schemes** - Support fallback authentication methods
3. **Descriptive names** - Use clear security scheme names
4. **Document scopes** - Clearly describe OAuth2 scope purposes
5. **Bearer format** - Specify JWT for JWT tokens
6. **Global security** - Set sensible defaults globally

## Common Security Patterns

### API Key + JWT

```typescript
// Add both schemes
await securityConfigureTool.execute({ operation: 'add_scheme', schemeName: 'apiKey', ... })
await securityConfigureTool.execute({ operation: 'add_scheme', schemeName: 'jwt', ... })

// Set global security (either is accepted)
await securityConfigureTool.execute({
  operation: 'set_global',
  security: [
    { apiKey: [] },
    { jwt: [] }
  ]
})
```

### OAuth2 with Multiple Flows

```typescript
scheme: {
  type: 'oauth2',
  flows: {
    authorizationCode: {  // For web apps
      authorizationUrl: '...',
      tokenUrl: '...',
      scopes: {...}
    },
    clientCredentials: {  // For service-to-service
      tokenUrl: '...',
      scopes: {...}
    }
  }
}
```

## Related Documentation

- [Endpoint Manage Tool](../tool-endpoint-manage/README.md)
- [Spec Read Tool](../tool-spec-read/README.md)

