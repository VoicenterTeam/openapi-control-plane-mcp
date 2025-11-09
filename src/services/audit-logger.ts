/**
 * Audit Logger Service
 *
 * @description Tracks all changes to OpenAPI specifications for compliance and debugging.
 * Like a security camera for your API specs, but less creepy. 📹📝
 *
 * @module services/audit-logger
 */

import type { ApiId, VersionTag } from '../types/openapi.js'
import type { AuditEvent } from '../types/metadata.js'
import type { BaseStorageProvider } from '../storage/base-storage-provider.js'
import { logger } from '../utils/logger.js'
import { createStorageError } from '../utils/errors.js'

/**
 * Audit Logger Service
 * @description Records all changes to API specifications with full audit trail.
 * Because sometimes you need to know who broke what and when. 🔍
 */
export class AuditLogger {
  private storage: BaseStorageProvider

  /**
   * Creates a new audit logger
   * @param storage - Storage provider for audit logs
   * @description Sets up the audit logging system
   */
  constructor(storage: BaseStorageProvider) {
    this.storage = storage
  }

  /**
   * Logs an audit event
   * @param event - Audit event to log
   * @returns Promise resolving when event is logged
   * @description Records an event in the audit trail. The paper trail that never lies.
   */
  async logEvent(event: AuditEvent): Promise<void> {
    try {
      const auditPath = this.getAuditPath(event.api_id)

      // Load existing audit log or create new one
      let auditLog: AuditEvent[] = []
      try {
        const existingLog = await this.storage.read(auditPath)
        auditLog = JSON.parse(existingLog)
      } catch (error) {
        // File doesn't exist yet, start fresh
        logger.debug({ apiId: event.api_id }, 'Creating new audit log')
      }

      // Add new event
      auditLog.push(event)

      // Save updated log
      await this.storage.write(auditPath, JSON.stringify(auditLog, null, 2))

      logger.info(
        { apiId: event.api_id, event: event.event, version: event.version },
        'Audit event logged'
      )
    } catch (error) {
      logger.error({ error, event }, 'Failed to log audit event')
      throw createStorageError(
        `Failed to log audit event: ${(error as Error).message}`,
        this.getAuditPath(event.api_id),
        'write'
      )
    }
  }

  /**
   * Retrieves audit log for an API
   * @param apiId - API identifier
   * @param limit - Maximum number of events to return (most recent first)
   * @returns Promise resolving to array of audit events
   * @description Gets the audit trail. For when you need to play detective. 🕵️
   */
  async getAuditLog(apiId: ApiId, limit?: number): Promise<AuditEvent[]> {
    const auditPath = this.getAuditPath(apiId)

    try {
      const logData = await this.storage.read(auditPath)
      const auditLog: AuditEvent[] = JSON.parse(logData)

      // Return most recent first
      const sortedLog = auditLog.sort(
        (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      )

      return limit ? sortedLog.slice(0, limit) : sortedLog
    } catch (error) {
      // If file doesn't exist, return empty array (not an error)
      if ((error as any).code === 'ENOENT' || (error as Error).message.includes('not found')) {
        logger.debug({ apiId }, 'No audit log found')
        return []
      }
      // For any other error, throw
      logger.error({ error, apiId }, 'Failed to retrieve audit log')
      throw createStorageError(
        `Failed to retrieve audit log: ${(error as Error).message}`,
        auditPath,
        'read'
      )
    }
  }

  /**
   * Retrieves audit events for a specific version
   * @param apiId - API identifier
   * @param version - Version tag
   * @returns Promise resolving to array of audit events for that version
   * @description Gets events specific to one version. Targeted investigation.
   */
  async getVersionAuditLog(apiId: ApiId, version: VersionTag): Promise<AuditEvent[]> {
    const fullLog = await this.getAuditLog(apiId)
    return fullLog.filter((event) => event.version === version)
  }

  /**
   * Retrieves audit events by event type
   * @param apiId - API identifier
   * @param eventType - Event type to filter by
   * @param limit - Maximum number of events to return
   * @returns Promise resolving to filtered audit events
   * @description Filter by what happened. "Show me all the deletes."
   */
  async getEventsByType(
    apiId: ApiId,
    eventType: string,
    limit?: number
  ): Promise<AuditEvent[]> {
    const fullLog = await this.getAuditLog(apiId)
    const filtered = fullLog.filter((event) => event.event === eventType)
    return limit ? filtered.slice(0, limit) : filtered
  }

  /**
   * Retrieves audit events by user
   * @param apiId - API identifier
   * @param user - User identifier
   * @param limit - Maximum number of events to return
   * @returns Promise resolving to user's audit events
   * @description "What did Bob do?" Find out here.
   */
  async getEventsByUser(apiId: ApiId, user: string, limit?: number): Promise<AuditEvent[]> {
    const fullLog = await this.getAuditLog(apiId)
    const filtered = fullLog.filter((event) => event.user === user)
    return limit ? filtered.slice(0, limit) : filtered
  }

  /**
   * Retrieves audit events within a time range
   * @param apiId - API identifier
   * @param startDate - Start date
   * @param endDate - End date
   * @returns Promise resolving to events in time range
   * @description Time-based search. "What happened last Tuesday?"
   */
  async getEventsByTimeRange(
    apiId: ApiId,
    startDate: Date,
    endDate: Date
  ): Promise<AuditEvent[]> {
    const fullLog = await this.getAuditLog(apiId)
    return fullLog.filter((event) => {
      const eventDate = new Date(event.timestamp)
      return eventDate >= startDate && eventDate <= endDate
    })
  }

  /**
   * Gets the storage path for audit log
   * @param apiId - API identifier
   * @returns Audit log file path
   * @description Where we keep the receipts
   */
  private getAuditPath(apiId: ApiId): string {
    return `${apiId}/audit.json`
  }

  /**
   * Clears audit log for an API (use with caution!)
   * @param apiId - API identifier
   * @returns Promise resolving when log is cleared
   * @description Destroys the evidence. Only use for testing or with explicit user request!
   */
  async clearAuditLog(apiId: ApiId): Promise<void> {
    try {
      const auditPath = this.getAuditPath(apiId)
      await this.storage.delete(auditPath)
      logger.warn({ apiId }, 'Audit log cleared')
    } catch (error) {
      logger.error({ error, apiId }, 'Failed to clear audit log')
      throw createStorageError(
        `Failed to clear audit log: ${(error as Error).message}`,
        this.getAuditPath(apiId),
        'delete'
      )
    }
  }

  /**
   * Creates an audit event object
   * @param params - Event parameters
   * @returns Audit event object
   * @description Helper to create properly formatted audit events
   */
  createEvent(params: {
    apiId: ApiId
    event: string
    version?: VersionTag
    user?: string
    llmReason?: string
    details?: Record<string, unknown>
  }): AuditEvent {
    return {
      timestamp: new Date().toISOString(),
      event: params.event,
      api_id: params.apiId,
      version: params.version,
      user: params.user || 'system',
      llm_reason: params.llmReason,
      details: params.details,
    }
  }
}

