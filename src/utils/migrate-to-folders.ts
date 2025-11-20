/**
 * Migration Utility: Flat Structure to Folder-Based Organization
 *
 * @description Migrates existing specs from flat structure to folder-based organization.
 * Like Marie Kondo for your file system, but automated and less judgmental. 📦➡️📁
 *
 * @module utils/migrate-to-folders
 */

import type { BaseStorageProvider } from '../storage/base-storage-provider.js'
import type { FolderMetadata } from '../types/metadata.js'
import { logger } from './logger.js'

/**
 * Migration results
 * @description Tells you what happened during migration. The "after" photos.
 */
export interface MigrationResults {
  /** Whether migration was successful */
  success: boolean
  /** Number of specs migrated */
  specs_migrated: number
  /** Number of folders created */
  folders_created: number
  /** Specs that were migrated */
  migrated_specs: string[]
  /** Errors encountered during migration */
  errors: Array<{ spec: string; error: string }>
  /** Whether migration was skipped (already migrated) */
  skipped: boolean
}

/**
 * Checks if migration has already been performed
 * @param storage - Storage provider
 * @returns Promise resolving to true if already migrated
 * @description Detects if folders already exist. Prevents re-running migration.
 */
export async function isMigrated(storage: BaseStorageProvider): Promise<boolean> {
  try {
    // Check if 'active' and 'recycled' folders exist
    const activeFolderExists = await storage.exists('active/_folder.json')
    const recycledFolderExists = await storage.exists('recycled/_folder.json')
    
    return activeFolderExists && recycledFolderExists
  } catch (error) {
    logger.error({ error }, 'Failed to check migration status')
    return false
  }
}

/**
 * Creates default folders
 * @param storage - Storage provider
 * @returns Promise resolving to array of created folder names
 * @description Sets up 'active' and 'recycled' folders with metadata
 */
export async function createDefaultFolders(storage: BaseStorageProvider): Promise<string[]> {
  const folders: Array<{ name: string; metadata: FolderMetadata }> = [
    {
      name: 'active',
      metadata: {
        name: 'active',
        title: 'Active Projects',
        description: 'Currently active API specifications',
        color: '#10b981', // green
        icon: 'rocket',
        created_at: new Date().toISOString(),
        created_by: 'system:migration',
      },
    },
    {
      name: 'recycled',
      metadata: {
        name: 'recycled',
        title: 'Recycle Bin',
        description: 'Archived and deleted API specifications',
        color: '#ef4444', // red
        icon: 'trash',
        created_at: new Date().toISOString(),
        created_by: 'system:migration',
      },
    },
  ]

  const created: string[] = []

  for (const folder of folders) {
    try {
      const folderPath = `${folder.name}/_folder.json`
      
      // Check if folder already exists
      if (await storage.exists(folderPath)) {
        logger.info({ folder: folder.name }, 'Folder already exists, skipping')
        continue
      }

      // Create folder metadata
      await storage.write(folderPath, JSON.stringify(folder.metadata, null, 2))
      created.push(folder.name)
      
      logger.info({ folder: folder.name }, 'Created default folder')
    } catch (error) {
      logger.error({ error, folder: folder.name }, 'Failed to create default folder')
    }
  }

  return created
}

/**
 * Migrates existing specs to folder-based structure
 * @param storage - Storage provider
 * @param targetFolder - Folder to migrate specs into (defaults to 'active')
 * @returns Promise resolving to migration results
 * @description The main migration function. Moves all existing specs into folders.
 * This is the "let's organize this mess" button. 🎯
 */
export async function migrateToFolders(
  storage: BaseStorageProvider,
  targetFolder: string = 'active'
): Promise<MigrationResults> {
  const results: MigrationResults = {
    success: true,
    specs_migrated: 0,
    folders_created: 0,
    migrated_specs: [],
    errors: [],
    skipped: false,
  }

  try {
    // Check if already migrated
    if (await isMigrated(storage)) {
      logger.info('Migration already completed, skipping')
      results.skipped = true
      return results
    }

    logger.info('Starting migration to folder-based structure')

    // Step 1: Create default folders
    const createdFolders = await createDefaultFolders(storage)
    results.folders_created = createdFolders.length
    logger.info({ count: createdFolders.length, folders: createdFolders }, 'Created default folders')

    // Step 2: Find all existing specs in root directory
    const allItems = await storage.list('/')
    
    // Extract API IDs (top-level directories that have metadata.json)
    const apiIds: string[] = []
    const seenDirs = new Set<string>()

    for (const item of allItems) {
      const parts = item.split(/[/\\]/)
      const topDir = parts[0]

      // Skip if already seen, is a folder directory, or starts with _ or .
      if (
        seenDirs.has(topDir) ||
        topDir === 'active' ||
        topDir === 'recycled' ||
        topDir.startsWith('_') ||
        topDir.startsWith('.') ||
        topDir === 'specs' ||
        topDir === 'backups'
      ) {
        continue
      }

      seenDirs.add(topDir)

      // Check if this directory has a metadata.json (indicates it's an API)
      const metadataPath = `${topDir}/metadata.json`
      if (await storage.exists(metadataPath)) {
        apiIds.push(topDir)
      }
    }

    logger.info({ count: apiIds.length, apiIds }, 'Found specs to migrate')

    // Step 3: Migrate each spec
    for (const apiId of apiIds) {
      try {
        await migrateSpec(storage, apiId, targetFolder)
        results.specs_migrated++
        results.migrated_specs.push(apiId)
        logger.info({ apiId, targetFolder }, 'Migrated spec')
      } catch (error) {
        results.success = false
        results.errors.push({
          spec: apiId,
          error: (error as Error).message,
        })
        logger.error({ error, apiId }, 'Failed to migrate spec')
      }
    }

    logger.info(
      {
        specs_migrated: results.specs_migrated,
        folders_created: results.folders_created,
        errors: results.errors.length,
      },
      'Migration completed'
    )

    return results
  } catch (error) {
    logger.error({ error }, 'Migration failed')
    results.success = false
    results.errors.push({
      spec: 'migration',
      error: (error as Error).message,
    })
    return results
  }
}

/**
 * Migrates a single spec to a folder
 * @param storage - Storage provider
 * @param apiId - API identifier
 * @param targetFolder - Target folder name
 * @description Moves a spec and all its versions to the target folder
 */
async function migrateSpec(
  storage: BaseStorageProvider,
  apiId: string,
  targetFolder: string
): Promise<void> {
  // Get all files for this API
  const apiFiles = await storage.list(apiId)

  // Move each file
  for (const filePath of apiFiles) {
    // Skip if file is already in a folder structure
    if (filePath.startsWith(`${targetFolder}/`)) {
      continue
    }

    // Construct new path
    const relativePath = filePath.slice(apiId.length + 1) // Remove "apiId/" prefix
    const newPath = `${targetFolder}/${apiId}/${relativePath}`

    // Read original file
    const content = await storage.read(filePath)

    // Update metadata if it's metadata.json
    if (filePath.endsWith('/metadata.json')) {
      const metadata = JSON.parse(content)
      metadata.folder = targetFolder
      await storage.write(newPath, JSON.stringify(metadata, null, 2))
    } else {
      // Write to new location
      await storage.write(newPath, content)
    }

    // Delete original file
    await storage.delete(filePath)
  }

  logger.debug({ apiId, targetFolder, fileCount: apiFiles.length }, 'Spec migrated')
}

/**
 * Rolls back migration (moves specs back to root)
 * @param storage - Storage provider
 * @param folderName - Folder to roll back from
 * @returns Promise resolving to number of specs rolled back
 * @description Emergency undo button. Use if something goes wrong. ⏪
 * WARNING: This is a destructive operation!
 */
export async function rollbackMigration(
  storage: BaseStorageProvider,
  folderName: string = 'active'
): Promise<number> {
  logger.warn({ folderName }, 'Starting migration rollback - THIS IS DESTRUCTIVE')

  let rolledBack = 0

  try {
    // Get all items in the folder
    const allItems = await storage.list(folderName)

    // Extract API IDs
    const apiIds = [...new Set(
      allItems
        .filter((item) => {
          const parts = item.split(/[/\\]/)
          return parts[0] === folderName && parts[1] && !parts[1].startsWith('_')
        })
        .map((item) => {
          const parts = item.split(/[/\\]/)
          return parts[1]
        })
    )]

    // Move each spec back to root
    for (const apiId of apiIds) {
      const specFiles = await storage.list(`${folderName}/${apiId}`)

      for (const filePath of specFiles) {
        // Construct root path
        const relativePath = filePath.slice(`${folderName}/`.length)
        const rootPath = relativePath

        // Read file
        const content = await storage.read(filePath)

        // Update metadata if needed
        if (filePath.endsWith('/metadata.json')) {
          const metadata = JSON.parse(content)
          delete metadata.folder
          await storage.write(rootPath, JSON.stringify(metadata, null, 2))
        } else {
          await storage.write(rootPath, content)
        }

        // Delete from folder
        await storage.delete(filePath)
      }

      rolledBack++
      logger.info({ apiId }, 'Rolled back spec')
    }

    logger.info({ count: rolledBack }, 'Rollback completed')
    return rolledBack
  } catch (error) {
    logger.error({ error }, 'Rollback failed')
    throw error
  }
}

