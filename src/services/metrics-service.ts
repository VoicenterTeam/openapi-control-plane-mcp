/**
 * Metrics Service
 *
 * @description PM2 and Prometheus metrics integration for comprehensive monitoring.
 * Tracks HTTP requests, cache performance, file operations, exceptions, and more.
 *
 * @module services/metrics-service
 */

import * as promClient from 'prom-client'
import pmx from '@pm2/io'
import { logger } from '../utils/logger.js'

export interface MetricsConfig {
  enabled?: boolean
  prefix?: string
}

/**
 * Metrics Service for application monitoring
 */
export class MetricsService {
  private enabled: boolean
  private registry!: promClient.Registry
  
  // Counter metrics
  private httpRequestsTotal!: promClient.Counter
  private cacheHitsTotal!: promClient.Counter
  private cacheMissesTotal!: promClient.Counter
  private exceptionsTotal!: promClient.Counter
  private mcpToolExecutionsTotal!: promClient.Counter
  private auditEventsTotal!: promClient.Counter

  // Histogram metrics
  private httpRequestDuration!: promClient.Histogram
  private fileReadDuration!: promClient.Histogram
  private fileWriteDuration!: promClient.Histogram
  private cacheGetDuration!: promClient.Histogram

  // Gauge metrics
  private cacheSizeBytes!: promClient.Gauge
  private activeSpecsCount!: promClient.Gauge
  private memoryUsageBytes!: promClient.Gauge

  constructor(config: MetricsConfig = {}) {
    this.enabled = config.enabled !== false
    const prefix = config.prefix || 'openapi_mcp_'

    if (!this.enabled) {
      logger.info('Metrics disabled')
      return
    }

    // Create custom registry
    this.registry = new promClient.Registry()

    // Enable default metrics (memory, CPU, etc.)
    promClient.collectDefaultMetrics({
      register: this.registry,
      prefix,
    })

    // HTTP Request metrics
    this.httpRequestsTotal = new promClient.Counter({
      name: `${prefix}http_requests_total`,
      help: 'Total number of HTTP requests',
      labelNames: ['method', 'endpoint', 'status'],
      registers: [this.registry],
    })

    this.httpRequestDuration = new promClient.Histogram({
      name: `${prefix}http_request_duration_seconds`,
      help: 'HTTP request duration in seconds',
      labelNames: ['method', 'endpoint', 'status'],
      buckets: [0.001, 0.005, 0.01, 0.05, 0.1, 0.5, 1, 5, 10],
      registers: [this.registry],
    })

    // Cache metrics
    this.cacheHitsTotal = new promClient.Counter({
      name: `${prefix}cache_hits_total`,
      help: 'Total number of cache hits',
      labelNames: ['key_pattern'],
      registers: [this.registry],
    })

    this.cacheMissesTotal = new promClient.Counter({
      name: `${prefix}cache_misses_total`,
      help: 'Total number of cache misses',
      labelNames: ['key_pattern'],
      registers: [this.registry],
    })

    this.cacheSizeBytes = new promClient.Gauge({
      name: `${prefix}cache_size_bytes`,
      help: 'Current cache size in bytes',
      registers: [this.registry],
    })

    this.cacheGetDuration = new promClient.Histogram({
      name: `${prefix}cache_get_duration_seconds`,
      help: 'Cache get operation duration in seconds',
      labelNames: ['hit'],
      buckets: [0.0001, 0.0005, 0.001, 0.005, 0.01, 0.05, 0.1],
      registers: [this.registry],
    })

    // File operation metrics
    this.fileReadDuration = new promClient.Histogram({
      name: `${prefix}file_read_duration_seconds`,
      help: 'File read operation duration in seconds',
      buckets: [0.001, 0.005, 0.01, 0.05, 0.1, 0.5, 1],
      registers: [this.registry],
    })

    this.fileWriteDuration = new promClient.Histogram({
      name: `${prefix}file_write_duration_seconds`,
      help: 'File write operation duration in seconds',
      buckets: [0.001, 0.005, 0.01, 0.05, 0.1, 0.5, 1],
      registers: [this.registry],
    })

    // Exception metrics
    this.exceptionsTotal = new promClient.Counter({
      name: `${prefix}exceptions_total`,
      help: 'Total number of exceptions',
      labelNames: ['type', 'endpoint'],
      registers: [this.registry],
    })

    // MCP Tool metrics
    this.mcpToolExecutionsTotal = new promClient.Counter({
      name: `${prefix}mcp_tool_executions_total`,
      help: 'Total number of MCP tool executions',
      labelNames: ['tool', 'status'],
      registers: [this.registry],
    })

    // Audit metrics
    this.auditEventsTotal = new promClient.Counter({
      name: `${prefix}audit_events_total`,
      help: 'Total number of audit events',
      labelNames: ['event_type'],
      registers: [this.registry],
    })

    // Gauge metrics
    this.activeSpecsCount = new promClient.Gauge({
      name: `${prefix}active_specs_count`,
      help: 'Number of active API specifications',
      registers: [this.registry],
    })

    this.memoryUsageBytes = new promClient.Gauge({
      name: `${prefix}memory_usage_bytes`,
      help: 'Process memory usage in bytes',
      registers: [this.registry],
    })

    // PM2 metrics
    this.initPM2Metrics()

    // Update gauges periodically
    this.startPeriodicUpdates()

    logger.info('MetricsService initialized')
  }

  /**
   * Initialize PM2 custom metrics
   */
  private initPM2Metrics(): void {
    try {
      // Track cache hits/miss for PM2 dashboard
      let cacheHits = 0
      let cacheMisses = 0
      
      // Create simple metrics tracker
      pmx.metric({
        name: 'Cache Hit Rate %',
        value: () => {
          const total = cacheHits + cacheMisses
          return total > 0 ? Math.round((cacheHits / total) * 100) : 0
        },
      })

      pmx.metric({
        name: 'Active Specs',
        value: () => 0, // Will be updated via recordActiveSpecs
      })

      logger.debug('PM2 metrics initialized')
    } catch (error) {
      logger.error({ error }, 'Failed to initialize PM2 metrics')
    }
  }

  /**
   * Start periodic gauge updates
   */
  private startPeriodicUpdates(): void {
    setInterval(() => {
      try {
        const mem = process.memoryUsage()
        this.memoryUsageBytes.set(mem.heapUsed)
      } catch (error) {
        logger.error({ error }, 'Failed to update metrics')
      }
    }, 10000) // Update every 10 seconds
  }

  /**
   * Record HTTP request
   */
  recordRequest(endpoint: string, method: string, status: number, duration: number): void {
    if (!this.enabled) return

    try {
      this.httpRequestsTotal.inc({ method, endpoint, status })
      this.httpRequestDuration.observe({ method, endpoint, status }, duration / 1000)
    } catch (error) {
      logger.error({ error }, 'Failed to record request metric')
    }
  }

  /**
   * Record cache hit
   */
  recordCacheHit(key: string): void {
    if (!this.enabled) return

    try {
      const pattern = this.extractKeyPattern(key)
      this.cacheHitsTotal.inc({ key_pattern: pattern })
    } catch (error) {
      logger.error({ error }, 'Failed to record cache hit')
    }
  }

  /**
   * Record cache miss
   */
  recordCacheMiss(key: string): void {
    if (!this.enabled) return

    try {
      const pattern = this.extractKeyPattern(key)
      this.cacheMissesTotal.inc({ key_pattern: pattern })
    } catch (error) {
      logger.error({ error }, 'Failed to record cache miss')
    }
  }

  /**
   * Record cache operation duration
   */
  recordCacheGet(duration: number, hit: boolean): void {
    if (!this.enabled) return

    try {
      this.cacheGetDuration.observe({ hit: hit.toString() }, duration / 1000)
    } catch (error) {
      logger.error({ error }, 'Failed to record cache get duration')
    }
  }

  /**
   * Update cache size
   */
  updateCacheSize(sizeBytes: number): void {
    if (!this.enabled) return

    try {
      this.cacheSizeBytes.set(sizeBytes)
    } catch (error) {
      logger.error({ error }, 'Failed to update cache size')
    }
  }

  /**
   * Record file operation
   */
  recordFileOperation(operation: 'read' | 'write', duration: number): void {
    if (!this.enabled) return

    try {
      if (operation === 'read') {
        this.fileReadDuration.observe(duration / 1000)
      } else {
        this.fileWriteDuration.observe(duration / 1000)
      }
    } catch (error) {
      logger.error({ error }, 'Failed to record file operation')
    }
  }

  /**
   * Record exception
   */
  recordException(type: string, endpoint: string, error: Error): void {
    if (!this.enabled) return

    try {
      this.exceptionsTotal.inc({ type, endpoint })
      logger.error({ type, endpoint, error: error.message, stack: error.stack }, 'Exception recorded')
    } catch (err) {
      logger.error({ error: err }, 'Failed to record exception')
    }
  }

  /**
   * Record MCP tool execution
   */
  recordMCPToolExecution(tool: string, status: 'success' | 'error'): void {
    if (!this.enabled) return

    try {
      this.mcpToolExecutionsTotal.inc({ tool, status })
    } catch (error) {
      logger.error({ error }, 'Failed to record MCP tool execution')
    }
  }

  /**
   * Record audit event
   */
  recordAuditEvent(eventType: string): void {
    if (!this.enabled) return

    try {
      this.auditEventsTotal.inc({ event_type: eventType })
    } catch (error) {
      logger.error({ error }, 'Failed to record audit event')
    }
  }

  /**
   * Update active specs count
   */
  updateActiveSpecsCount(count: number): void {
    if (!this.enabled) return

    try {
      this.activeSpecsCount.set(count)
    } catch (error) {
      logger.error({ error }, 'Failed to update active specs count')
    }
  }

  /**
   * Get Prometheus metrics
   */
  async getMetrics(): Promise<string> {
    if (!this.enabled) {
      return '# Metrics disabled\n'
    }

    try {
      return await this.registry.metrics()
    } catch (error) {
      logger.error({ error }, 'Failed to get metrics')
      return '# Error retrieving metrics\n'
    }
  }

  /**
   * Extract key pattern from cache key for metrics
   * @param key - Cache key
   * @returns Pattern (e.g., "specs:*", "folders:*")
   */
  private extractKeyPattern(key: string): string {
    const parts = key.split(':')
    if (parts.length >= 2) {
      return `${parts[0]}:*`
    }
    return key
  }
}

