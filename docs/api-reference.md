# API Reference

REST API endpoints for the OpenAPI Control Panel UI.

## Base URL

Development: `http://localhost:3001/api`
Production: `/api` (same domain as UI)

## Endpoints

### Specs

#### List All Specs

```http
GET /api/specs
```

Returns array of `ApiMetadata` objects.

**Response:**
```json
[
  {
    "api_id": "myapi",
    "name": "My API",
    "created_at": "2024-01-01T00:00:00Z",
    "current_version": "v1.0.0",
    "versions": ["v1.0.0", "v1.1.0"],
    "latest_stable": "v1.0.0",
    "owner": "team@example.com",
    "tags": ["production"],
    "description": "My API description"
  }
]
```

#### Get Specific Spec

```http
GET /api/specs/:apiId
```

Returns `ApiMetadata` for specific API.

#### List Versions

```http
GET /api/specs/:apiId/versions
```

Returns array of `VersionMetadata` objects for all versions of an API.

**Response:**
```json
[
  {
    "version": "v1.0.0",
    "created_at": "2024-01-01T00:00:00Z",
    "created_by": "user@example.com",
    "parent_version": null,
    "description": "Initial version",
    "changes": {
      "endpoints_added": ["GET /users"],
      "endpoints_modified": [],
      "endpoints_deleted": [],
      "schemas_added": ["User"],
      "schemas_modified": [],
      "schemas_deleted": [],
      "breaking_changes": []
    },
    "validation": {
      "spectral_errors": 0,
      "spectral_warnings": 0,
      "openapi_valid": true
    },
    "stats": {
      "endpoint_count": 5,
      "schema_count": 3,
      "file_size_bytes": 12345
    }
  }
]
```

#### Get Specific Version

```http
GET /api/specs/:apiId/versions/:version
```

Returns `VersionMetadata` and full OpenAPI spec.

**Response:**
```json
{
  "metadata": { /* VersionMetadata */ },
  "spec": { /* Full OpenAPI 3.x spec */ }
}
```

#### Update Spec

```http
PUT /api/specs/:apiId
Content-Type: application/json

{
  "spec": { /* OpenAPI spec object */ },
  "version": "v1.1.0",
  "description": "Updated endpoints"
}
```

### Audit Log

#### Get Audit Log

```http
GET /api/audit?apiId=myapi&limit=100
```

**Query Parameters:**
- `apiId` (optional): Filter by specific API
- `limit` (optional): Limit number of results

Returns array of `AuditEvent` objects.

**Response:**
```json
[
  {
    "timestamp": "2024-01-01T12:00:00Z",
    "event": "endpoint_added",
    "api_id": "myapi",
    "version": "v1.1.0",
    "user": "user@example.com",
    "llm_reason": "Added new user registration endpoint",
    "details": {}
  }
]
```

#### Get API-Specific Audit Log

```http
GET /api/audit/:apiId?limit=50
```

Returns audit events for specific API only.

### Dashboard Statistics

#### Get Stats

```http
GET /api/stats
```

Returns dashboard statistics.

**Response:**
```json
{
  "total_specs": 10,
  "total_versions": 25,
  "total_endpoints": 150,
  "total_schemas": 45,
  "recent_changes": [
    {
      "timestamp": "2024-01-01T12:00:00Z",
      "api_id": "myapi",
      "event": "version_created",
      "version": "v1.1.0"
    }
  ],
  "specs_by_tag": {
    "production": 5,
    "staging": 3,
    "development": 2
  },
  "breaking_changes_count": 2,
  "versions_this_week": 5
}
```

## Error Responses

All endpoints return standard error format:

```json
{
  "error": "Error message",
  "code": "ERROR_CODE",
  "details": {}
}
```

**HTTP Status Codes:**
- `200` - Success
- `400` - Bad Request
- `404` - Not Found
- `500` - Internal Server Error

## Types

See `ui/types/api.ts` for full TypeScript type definitions.

