/**
 * BaseTool Tests
 */

import { BaseTool, ToolDescription, ToolResult, BaseToolParams } from '../../../src/types/mcp-tool'
import { z } from 'zod'

interface TestParams extends BaseToolParams {
  name: string
  age: number
}

// Concrete implementation for testing
class TestTool extends BaseTool<TestParams> {
  async execute(params: TestParams): Promise<ToolResult> {
    return this.success('Test executed', { name: params.name, age: params.age })
  }

  describe(): ToolDescription {
    return {
      name: 'test_tool',
      description: 'A tool for testing',
      inputSchema: {
        type: 'object',
        properties: {
          name: { type: 'string' },
          age: { type: 'number' },
        },
        required: ['name', 'age'],
      },
    }
  }
}

describe('BaseTool', () => {
  let tool: TestTool

  beforeEach(() => {
    tool = new TestTool()
  })

  describe('validate', () => {
    const schema = z.object({
      name: z.string(),
      age: z.number(),
    })

    it('should validate correct params', () => {
      const params = { name: 'Alice', age: 30 }
      const result = tool.validate(params, schema)

      expect(result).toEqual(params)
    })

    it('should throw on invalid params (Zod error)', () => {
      const params = { name: 'Bob', age: 'thirty' }

      expect(() => tool.validate(params, schema)).toThrow('Validation failed')
    })

    it('should rethrow non-Zod errors', () => {
      const mockSchema = {
        parse: jest.fn().mockImplementation(() => {
          throw new Error('Custom error')
        }),
      }

      expect(() => tool.validate({ name: 'test' }, mockSchema as any)).toThrow('Custom error')
    })
  })

  describe('success', () => {
    it('should create success result with message only', () => {
      const result = tool.success('Operation completed')

      expect(result.success).toBe(true)
      expect(result.isError).toBe(false)
      expect(result.content).toHaveLength(1)
      expect(result.content[0].text).toBe('Operation completed')
      expect(result.data).toBeUndefined()
    })

    it('should create success result with data', () => {
      const data = { id: 123, name: 'Test' }
      const result = tool.success('Operation completed', data)

      expect(result.success).toBe(true)
      expect(result.isError).toBe(false)
      expect(result.content).toHaveLength(2)
      expect(result.content[0].text).toBe('Operation completed')
      expect(result.content[1].text).toContain('"id": 123')
      expect(result.data).toEqual(data)
    })
  })

  describe('error', () => {
    it('should create error result with message only', () => {
      const result = tool.error('Something went wrong')

      expect(result.success).toBe(false)
      expect(result.isError).toBe(true)
      expect(result.content).toHaveLength(1)
      expect(result.content[0].text).toBe('Error: Something went wrong')
      expect(result.data).toBeUndefined()
    })

    it('should create error result with details', () => {
      const details = { code: 'ERR001', field: 'email' }
      const result = tool.error('Validation failed', details)

      expect(result.success).toBe(false)
      expect(result.isError).toBe(true)
      expect(result.content).toHaveLength(2)
      expect(result.content[0].text).toBe('Error: Validation failed')
      expect(result.content[1].text).toContain('"code": "ERR001"')
      expect(result.data).toEqual(details)
    })

    it('should handle complex nested error details', () => {
      const details = {
        error: 'Database error',
        nested: {
          query: 'SELECT * FROM users',
          params: [1, 2, 3],
        },
      }
      const result = tool.error('Query failed', details)

      expect(result.success).toBe(false)
      expect(result.content).toHaveLength(2)
      expect(result.content[1].text).toContain('Database error')
      expect(result.content[1].text).toContain('SELECT * FROM users')
    })
  })

  describe('execute', () => {
    it('should execute and return success', async () => {
      const result = await tool.execute({ name: 'Charlie', age: 25 })

      expect(result.success).toBe(true)
      expect(result.data).toEqual({ name: 'Charlie', age: 25 })
    })
  })

  describe('describe', () => {
    it('should return tool description', () => {
      const description = tool.describe()

      expect(description.name).toBe('test_tool')
      expect(description.description).toBe('A tool for testing')
      expect((description.inputSchema as any).required).toContain('name')
      expect((description.inputSchema as any).required).toContain('age')
    })
  })
})

