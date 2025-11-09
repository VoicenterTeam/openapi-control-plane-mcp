/**
 * MCP Tool Type Definitions
 *
 * @description Types for MCP tools, their results, and the BaseTool abstract class.
 * The blueprint for all tools to follow, like a style guide but more important. 📐
 *
 * @module types/mcp-tool
 */

import type { z } from 'zod'
import { ZodError } from 'zod'

/**
 * Result from a tool execution
 * @description What comes out when a tool does its job (successfully or not)
 */
export interface ToolResult {
  /** Array of content items to return */
  content: Array<{
    type: 'text' | 'image' | 'resource'
    text?: string
    data?: string
    mimeType?: string
  }>
  /** Whether this result represents an error */
  isError?: boolean
  /** Success flag for easier testing */
  success?: boolean
  /** Optional data payload for easier access */
  data?: unknown
}

/**
 * Tool description for MCP registration
 * @description How a tool introduces itself to the world
 */
export interface ToolDescription {
  /** Tool name (unique identifier) */
  name: string
  /** Human-readable description */
  description: string
  /** Input schema (Zod or JSON Schema) */
  inputSchema: z.ZodSchema | Record<string, unknown>
}

/**
 * Common parameters for all tools
 * @description The baseline params every tool gets, like a starter pack
 */
export interface BaseToolParams {
  /** Optional reasoning from LLM explaining why this action is being taken */
  llmReason?: string
}

/**
 * Abstract base class for all MCP tools
 * @description The parent class all tools inherit from. Like a template,
 * but one that actually enforces its rules. Extend this and implement
 * the abstract methods, or face the wrath of TypeScript. ⚔️
 *
 * @template TParams - The parameter type for this tool
 */
export abstract class BaseTool<TParams extends BaseToolParams = BaseToolParams> {
  /**
   * Executes the tool with given parameters
   * @param params - Tool-specific parameters
   * @returns Promise resolving to tool result
   * @description The main event. This is where the tool does its thing.
   */
  abstract execute(params: TParams): Promise<ToolResult>

  /**
   * Returns the tool description for MCP registration
   * @returns Tool description object
   * @description Tells the MCP server what this tool is and how to use it
   */
  abstract describe(): ToolDescription

  /**
   * Validates parameters using a Zod schema
   * @param params - Parameters to validate
   * @param schema - Zod schema to validate against
   * @throws ValidationError if validation fails
   * @description The gatekeeper that makes sure inputs are legit before proceeding
   */
  validate<T>(params: unknown, schema: z.ZodSchema<T>): T {
    try {
      return schema.parse(params)
    } catch (error) {
      if (error instanceof ZodError) {
        throw new Error(`Validation failed: ${JSON.stringify(error.errors)}`)
      }
      throw error
    }
  }

  /**
   * Creates a success result
   * @param message - Success message
   * @param data - Optional data to include
   * @returns Tool result indicating success
   * @description Helper to create a successful result. Because typing out the
   * whole structure every time gets old fast.
   */
  success(message: string, data?: unknown): ToolResult {
    const content = [{ type: 'text' as const, text: message }]
    if (data) {
      content.push({
        type: 'text' as const,
        text: JSON.stringify(data, null, 2),
      })
    }
    return { 
      content, 
      isError: false,
      success: true,
      data
    }
  }

  /**
   * Creates an error result
   * @param message - Error message
   * @param details - Optional error details
   * @returns Tool result indicating error
   * @description Helper to create an error result. For when things go sideways.
   */
  error(message: string, details?: unknown): ToolResult {
    const content = [{ type: 'text' as const, text: `Error: ${message}` }]
    if (details) {
      content.push({
        type: 'text' as const,
        text: JSON.stringify(details, null, 2),
      })
    }
    return { 
      content, 
      isError: true,
      success: false,
      data: details
    }
  }
}

