/**
 * Tests for AuditLogger
 */

import { AuditLogger } from '../../../src/services/audit-logger'
import { FileSystemStorage } from '../../../src/storage/file-system-storage'
import { createApiId, createVersionTag } from '../../../src/types/openapi'
import type { AuditEvent } from '../../../src/types/metadata'

// Mock the storage
jest.mock('../../../src/storage/file-system-storage')

describe('AuditLogger', () => {
  let auditLogger: AuditLogger
  let mockStorage: jest.Mocked<FileSystemStorage>

  const apiId = createApiId('test-api')
  const version = createVersionTag('v1.0.0')

  const sampleEvent: AuditEvent = {
    timestamp: '2024-01-15T10:00:00.000Z',
    event: 'endpoint_created',
    api_id: apiId,
    version: version,
    user: 'john@example.com',
    llm_reason: 'User requested new endpoint',
    details: {
      path: '/users',
      method: 'GET',
    },
  }

  beforeEach(() => {
    mockStorage = new FileSystemStorage({ basePath: '/data' }) as jest.Mocked<FileSystemStorage>
    auditLogger = new AuditLogger(mockStorage)
  })

  describe('logEvent', () => {
    it('should create new audit log if none exists', async () => {
      mockStorage.read.mockRejectedValue(new Error('File not found'))
      mockStorage.write.mockResolvedValue(undefined)

      await auditLogger.logEvent(sampleEvent)

      expect(mockStorage.write).toHaveBeenCalledWith(
        'test-api/audit.json',
        expect.stringContaining('"event": "endpoint_created"')
      )
    })

    it('should append to existing audit log', async () => {
      const existingLog = [
        {
          timestamp: '2024-01-14T10:00:00.000Z',
          event: 'version_created',
          api_id: apiId,
          version: version,
          user: 'jane@example.com',
        },
      ]
      mockStorage.read.mockResolvedValue(JSON.stringify(existingLog))
      mockStorage.write.mockResolvedValue(undefined)

      await auditLogger.logEvent(sampleEvent)

      const writeCall = mockStorage.write.mock.calls[0]
      const writtenData = JSON.parse(writeCall[1] as string)
      expect(writtenData).toHaveLength(2)
      expect(writtenData[1]).toMatchObject(sampleEvent)
    })

    it('should include all event fields', async () => {
      mockStorage.read.mockRejectedValue(new Error('File not found'))
      mockStorage.write.mockResolvedValue(undefined)

      await auditLogger.logEvent(sampleEvent)

      const writeCall = mockStorage.write.mock.calls[0]
      const writtenData = JSON.parse(writeCall[1] as string)
      expect(writtenData[0]).toHaveProperty('timestamp')
      expect(writtenData[0]).toHaveProperty('event')
      expect(writtenData[0]).toHaveProperty('api_id')
      expect(writtenData[0]).toHaveProperty('version')
      expect(writtenData[0]).toHaveProperty('user')
      expect(writtenData[0]).toHaveProperty('llm_reason')
      expect(writtenData[0]).toHaveProperty('details')
    })

    it('should throw error on storage failure', async () => {
      mockStorage.read.mockRejectedValue(new Error('File not found'))
      mockStorage.write.mockRejectedValue(new Error('Write failed'))

      await expect(auditLogger.logEvent(sampleEvent)).rejects.toThrow()
    })
  })

  describe('getAuditLog', () => {
    it('should return empty array if no log exists', async () => {
      mockStorage.read.mockRejectedValue(new Error('File not found'))

      const result = await auditLogger.getAuditLog(apiId)

      expect(result).toEqual([])
    })

    it('should return all events sorted by timestamp (newest first)', async () => {
      const events = [
        { ...sampleEvent, timestamp: '2024-01-14T10:00:00.000Z' },
        { ...sampleEvent, timestamp: '2024-01-16T10:00:00.000Z' },
        { ...sampleEvent, timestamp: '2024-01-15T10:00:00.000Z' },
      ]
      mockStorage.read.mockResolvedValue(JSON.stringify(events))

      const result = await auditLogger.getAuditLog(apiId)

      expect(result).toHaveLength(3)
      expect(result[0].timestamp).toBe('2024-01-16T10:00:00.000Z')
      expect(result[1].timestamp).toBe('2024-01-15T10:00:00.000Z')
      expect(result[2].timestamp).toBe('2024-01-14T10:00:00.000Z')
    })

    it('should respect limit parameter', async () => {
      const events = [
        { ...sampleEvent, timestamp: '2024-01-14T10:00:00.000Z' },
        { ...sampleEvent, timestamp: '2024-01-15T10:00:00.000Z' },
        { ...sampleEvent, timestamp: '2024-01-16T10:00:00.000Z' },
      ]
      mockStorage.read.mockResolvedValue(JSON.stringify(events))

      const result = await auditLogger.getAuditLog(apiId, 2)

      expect(result).toHaveLength(2)
      expect(result[0].timestamp).toBe('2024-01-16T10:00:00.000Z')
    })

    it('should throw error on read failure', async () => {
      mockStorage.read.mockRejectedValue(new Error('Permission denied'))

      await expect(auditLogger.getAuditLog(apiId)).rejects.toThrow()
    })
  })

  describe('getVersionAuditLog', () => {
    it('should return events for specific version only', async () => {
      const events = [
        { ...sampleEvent, version: 'v1.0.0' },
        { ...sampleEvent, version: 'v1.1.0' },
        { ...sampleEvent, version: 'v1.0.0' },
      ]
      mockStorage.read.mockResolvedValue(JSON.stringify(events))

      const result = await auditLogger.getVersionAuditLog(apiId, version)

      expect(result).toHaveLength(2)
      expect(result.every((e) => e.version === 'v1.0.0')).toBe(true)
    })

    it('should return empty array if no events for version', async () => {
      const events = [{ ...sampleEvent, version: 'v1.1.0' }]
      mockStorage.read.mockResolvedValue(JSON.stringify(events))

      const result = await auditLogger.getVersionAuditLog(apiId, version)

      expect(result).toEqual([])
    })
  })

  describe('getEventsByType', () => {
    it('should filter events by event type', async () => {
      const events: AuditEvent[] = [
        { ...sampleEvent, event: 'endpoint_created' },
        { ...sampleEvent, event: 'endpoint_updated' },
        { ...sampleEvent, event: 'endpoint_created' },
        { ...sampleEvent, event: 'endpoint_deleted' },
      ]
      mockStorage.read.mockResolvedValue(JSON.stringify(events))

      const result = await auditLogger.getEventsByType(apiId, 'endpoint_created')

      expect(result).toHaveLength(2)
      expect(result.every((e) => e.event === 'endpoint_created')).toBe(true)
    })

    it('should respect limit parameter', async () => {
      const events: AuditEvent[] = [
        { ...sampleEvent, event: 'endpoint_updated', timestamp: '2024-01-14T10:00:00.000Z' },
        { ...sampleEvent, event: 'endpoint_updated', timestamp: '2024-01-15T10:00:00.000Z' },
        { ...sampleEvent, event: 'endpoint_updated', timestamp: '2024-01-16T10:00:00.000Z' },
      ]
      mockStorage.read.mockResolvedValue(JSON.stringify(events))

      const result = await auditLogger.getEventsByType(apiId, 'endpoint_updated', 2)

      expect(result).toHaveLength(2)
    })
  })

  describe('getEventsByUser', () => {
    it('should filter events by user', async () => {
      const events = [
        { ...sampleEvent, user: 'john@example.com' },
        { ...sampleEvent, user: 'jane@example.com' },
        { ...sampleEvent, user: 'john@example.com' },
      ]
      mockStorage.read.mockResolvedValue(JSON.stringify(events))

      const result = await auditLogger.getEventsByUser(apiId, 'john@example.com')

      expect(result).toHaveLength(2)
      expect(result.every((e) => e.user === 'john@example.com')).toBe(true)
    })

    it('should respect limit parameter', async () => {
      const events = [
        { ...sampleEvent, user: 'john@example.com', timestamp: '2024-01-14T10:00:00.000Z' },
        { ...sampleEvent, user: 'john@example.com', timestamp: '2024-01-15T10:00:00.000Z' },
        { ...sampleEvent, user: 'john@example.com', timestamp: '2024-01-16T10:00:00.000Z' },
      ]
      mockStorage.read.mockResolvedValue(JSON.stringify(events))

      const result = await auditLogger.getEventsByUser(apiId, 'john@example.com', 1)

      expect(result).toHaveLength(1)
    })
  })

  describe('getEventsByTimeRange', () => {
    it('should filter events by time range', async () => {
      const events = [
        { ...sampleEvent, timestamp: '2024-01-14T10:00:00.000Z' },
        { ...sampleEvent, timestamp: '2024-01-15T10:00:00.000Z' },
        { ...sampleEvent, timestamp: '2024-01-16T10:00:00.000Z' },
        { ...sampleEvent, timestamp: '2024-01-17T10:00:00.000Z' },
      ]
      mockStorage.read.mockResolvedValue(JSON.stringify(events))

      const result = await auditLogger.getEventsByTimeRange(
        apiId,
        new Date('2024-01-15T00:00:00.000Z'),
        new Date('2024-01-16T23:59:59.999Z')
      )

      expect(result).toHaveLength(2)
      // Events should be sorted newest first
      expect(result[0].timestamp).toBe('2024-01-16T10:00:00.000Z')
      expect(result[1].timestamp).toBe('2024-01-15T10:00:00.000Z')
    })

    it('should return empty array if no events in range', async () => {
      const events = [{ ...sampleEvent, timestamp: '2024-01-14T10:00:00.000Z' }]
      mockStorage.read.mockResolvedValue(JSON.stringify(events))

      const result = await auditLogger.getEventsByTimeRange(
        apiId,
        new Date('2024-01-15T00:00:00.000Z'),
        new Date('2024-01-16T00:00:00.000Z')
      )

      expect(result).toEqual([])
    })
  })

  describe('clearAuditLog', () => {
    it('should delete audit log file', async () => {
      mockStorage.delete.mockResolvedValue(undefined)

      await auditLogger.clearAuditLog(apiId)

      expect(mockStorage.delete).toHaveBeenCalledWith('test-api/audit.json')
    })

    it('should throw error on delete failure', async () => {
      mockStorage.delete.mockRejectedValue(new Error('Delete failed'))

      await expect(auditLogger.clearAuditLog(apiId)).rejects.toThrow()
    })
  })

  describe('createEvent', () => {
    it('should create properly formatted event', () => {
      const event = auditLogger.createEvent({
        apiId: apiId,
        event: 'endpoint_updated',
        version: version,
        user: 'test@example.com',
        llmReason: 'User requested update',
        details: { source: 'mcp-tool' },
      })

      expect(event).toHaveProperty('timestamp')
      expect(event.event).toBe('endpoint_updated')
      expect(event.api_id).toBe(apiId)
      expect(event.version).toBe(version)
      expect(event.user).toBe('test@example.com')
      expect(event.llm_reason).toBe('User requested update')
      expect(event.details).toEqual({ source: 'mcp-tool' })
    })

    it('should use "system" as default user', () => {
      const event = auditLogger.createEvent({
        apiId: apiId,
        event: 'version_created',
      })

      expect(event.user).toBe('system')
    })

    it('should include valid ISO timestamp', () => {
      const event = auditLogger.createEvent({
        apiId: apiId,
        event: 'version_created',
      })

      expect(new Date(event.timestamp).toISOString()).toBe(event.timestamp)
    })
  })
})

