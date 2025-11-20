# Workspace Management

## Overview

The OpenAPI Control Panel includes a comprehensive multi-workspace organization system that allows you to organize your API specifications into logical groups (workspaces/folders) for better project management and team collaboration.

## Features

### Default Workspaces

Two default workspaces are created automatically on first run:

1. **Active Projects** (`active`)
   - Color: Green (#10b981)
   - Icon: rocket
   - Description: Currently active API specifications
   - New specs are created here by default

2. **Recycle Bin** (`recycled`)
   - Color: Red (#F52222)
   - Icon: trash
   - Description: Deleted or archived API specifications
   - For soft-delete functionality

### Custom Workspaces

You can create unlimited custom workspaces with:
- **Name**: Unique identifier (kebab-case)
- **Title**: Human-readable name
- **Description**: Optional description
- **Color**: Hex color code for visual identification
- **Icon**: Optional icon name

## Usage

### Backend (MCP)

The workspace functionality is not directly exposed as MCP tools, but is integrated into the existing tools through folder-aware operations.

### REST API

#### List All Folders

```http
GET /api/folders
```

Response:
```json
[
  {
    "name": "active",
    "title": "Active Projects",
    "description": "Currently active API specifications",
    "color": "#10b981",
    "icon": "rocket",
    "created_at": "2025-01-01T00:00:00.000Z",
    "updated_at": "2025-01-01T00:00:00.000Z"
  }
]
```

#### Create Folder

```http
POST /api/folders
Content-Type: application/json

{
  "name": "frontend",
  "title": "Frontend APIs",
  "description": "Frontend-related API specifications",
  "color": "#3b82f6",
  "icon": "desktop"
}
```

#### Get Folder Metadata

```http
GET /api/folders/frontend
```

#### Update Folder Metadata

```http
PUT /api/folders/frontend
Content-Type: application/json

{
  "title": "Frontend Services",
  "color": "#2563eb"
}
```

#### Delete Empty Folder

```http
DELETE /api/folders/frontend
```

Note: Folder must be empty (no specs) to be deleted.

#### List Specs in Folder

```http
GET /api/folders/frontend/specs
```

#### Move Spec to Different Folder

```http
POST /api/folders/active/move-spec
Content-Type: application/json

{
  "apiId": "my-api",
  "targetFolder": "frontend"
}
```

This preserves all version history when moving specs.

### Frontend UI

#### Folder Sidebar

The left sidebar (`FolderSidebar.vue`) displays:
- List of all folders with color indicators
- Active folder highlighting
- Create new folder button
- Click to switch between folders

#### Creating Folders

1. Click "Create Folder" button in sidebar
2. Fill in the modal form:
   - Name (required, kebab-case)
   - Title (required)
   - Description (optional)
   - Color (color picker)
   - Icon (optional)
3. Click "Create"

#### Moving Specs

1. Find the spec card in the list
2. Click the "⋮" menu button (top-right of card)
3. Select "Move to Folder"
4. Choose destination folder from dropdown
5. Confirm

The spec will be moved with all its version history intact.

#### LocalStorage Persistence

The application remembers your last viewed workspace using browser LocalStorage:
- Key: `openapi-control-panel:last-folder`
- Automatically restored on page load
- Works across browser sessions

## Architecture

### Storage Structure

Specs are stored in a folder-based file system:

```
specs/
├── active/
│   ├── _folder.json          # Folder metadata
│   ├── my-api/
│   │   ├── metadata.json     # API metadata
│   │   ├── v1.0.0/
│   │   │   ├── spec.yaml
│   │   │   └── metadata.json
│   │   └── v1.1.0/
│   │       ├── spec.yaml
│   │       └── metadata.json
│   └── another-api/
│       └── ...
├── frontend/
│   ├── _folder.json
│   └── ...
└── recycled/
    ├── _folder.json
    └── ...
```

### Backend Services

#### FolderManager (`src/services/folder-manager.ts`)

Handles all folder-related operations:
- `createFolder()` - Create new folder with metadata
- `getFolderMetadata()` - Read folder metadata
- `updateFolderMetadata()` - Update folder properties
- `listFolders()` - Get all folders
- `deleteFolder()` - Delete empty folder
- `moveApiToFolder()` - Move spec between folders
- `listApisInFolder()` - List specs in folder

#### VersionManager Updates

Updated to be folder-aware:
- All version operations accept optional `folder` parameter
- `findApiFolder()` - Locate which folder contains an API
- `moveApiFolder()` - Move API's entire folder structure

#### SpecManager Updates

Updated to be folder-aware:
- All spec operations accept optional `folder` parameter
- Auto-discovery of API's current folder
- Defaults to `active` folder for new specs

### Frontend Components

#### FolderSidebar.vue

- Lists all folders
- Handles folder selection
- Persists selection to LocalStorage
- Emits `folderSelected` event

#### FolderCreateModal.vue

- Form for creating new folders
- Validation (name must be kebab-case)
- Color picker integration
- Emits `created` event on success

#### SpecMoveDialog.vue

- Modal for moving specs
- Dropdown of available folders
- Filters out current folder
- Handles move operation and refresh

### Frontend Composables

#### useFolders.ts

- `fetchFolders()` - Load all folders
- `createFolder()` - Create new folder
- `updateFolder()` - Update folder metadata
- `deleteFolder()` - Delete empty folder
- `moveSpecToFolder()` - Move spec between folders
- `currentFolder` - Reactive current folder state
- `setCurrentFolder()` - Update current folder with LocalStorage persistence

#### useSpecs.ts (Updated)

- `fetchSpecs(folderName)` - Load specs from specific folder
- `currentFolder` - Current folder context

## Migration

### Automatic Migration

On first server start with the new version:

1. `createDefaultFolders()` creates "active" and "recycled" folders
2. `migrateExistingApis()` moves all root-level specs to "active" folder
3. Folder metadata is created automatically
4. Original file structure is preserved within folders

### Manual Migration

If you have a custom storage structure:

1. Create target folders via API or UI
2. Use `POST /api/folders/:folderName/move-spec` to move each spec
3. Or manually move directories and update `_folder.json` files

## Best Practices

### Folder Organization

- **By Team**: `frontend`, `backend`, `mobile`
- **By Project**: `project-alpha`, `project-beta`
- **By Status**: `active`, `in-development`, `deprecated`, `recycled`
- **By Domain**: `auth`, `payments`, `users`, `products`

### Naming Conventions

- Use **kebab-case** for folder names
- Keep names short but descriptive
- Use meaningful colors (e.g., red for recycled, green for active)
- Choose appropriate icons from your icon library

### Workflow

1. Create project/team-specific folders upfront
2. Create new specs in appropriate folders
3. Move specs between folders as projects evolve
4. Archive old specs to `recycled` folder
5. Periodically clean up `recycled` folder

## Troubleshooting

### Spec Not Appearing

- Check if you're viewing the correct folder
- Use "All Specs" view to search across folders
- Check browser LocalStorage if wrong folder loads

### Cannot Delete Folder

- Ensure folder is empty (no specs)
- Move or delete all specs first
- Cannot delete default folders (`active`, `recycled`)

### Move Operation Failed

- Check if target folder exists
- Verify spec exists in source folder
- Check server logs for detailed error

### LocalStorage Not Working

- Check browser settings (LocalStorage enabled)
- Clear browser cache and reload
- Check browser console for errors

## Future Enhancements

Planned features:
- [ ] Folder permissions (multi-user)
- [ ] Folder-level tags/labels
- [ ] Drag-and-drop spec moving
- [ ] Bulk spec operations
- [ ] Folder search and filtering
- [ ] Nested folders/hierarchy
- [ ] Folder templates
- [ ] Export/import folders

## API Reference

See [API Endpoints](../README.md#-api-endpoints) section in main README for complete API reference.

## Examples

### CLI Examples (curl)

```bash
# List all folders
curl http://localhost:3001/api/folders

# Create folder
curl -X POST http://localhost:3001/api/folders \
  -H "Content-Type: application/json" \
  -d '{
    "name": "mobile",
    "title": "Mobile APIs",
    "description": "Mobile app API specifications",
    "color": "#8b5cf6"
  }'

# Move spec
curl -X POST http://localhost:3001/api/folders/active/move-spec \
  -H "Content-Type: application/json" \
  -d '{
    "apiId": "my-api",
    "targetFolder": "mobile"
  }'

# List specs in folder
curl http://localhost:3001/api/folders/mobile/specs
```

### JavaScript Examples

```javascript
// Fetch folders
const folders = await fetch('/api/folders').then(r => r.json())

// Create folder
await fetch('/api/folders', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    name: 'mobile',
    title: 'Mobile APIs',
    color: '#8b5cf6'
  })
})

// Move spec
await fetch('/api/folders/active/move-spec', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    apiId: 'my-api',
    targetFolder: 'mobile'
  })
})
```

## See Also

- [AGENTS.md](AGENTS.md) - Developer guide
- [Architecture](architecture/README.md) - System design
- Main [README.md](../README.md) - General documentation

