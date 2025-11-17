/**
 * useApi Composable
 * 
 * @description Wrapper around $fetch with error handling and type safety.
 * Provides a consistent API for making HTTP requests to the backend.
 */

import type { ApiResponse } from '~/types/api'

export interface UseApiOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH'
  body?: any
  query?: Record<string, any>
  headers?: Record<string, string>
}

export function useApi() {
  const config = useRuntimeConfig()
  const baseURL = config.public.apiBase || '/api'

  /**
   * Makes an API request with error handling
   */
  async function request<T = any>(
    endpoint: string,
    options: UseApiOptions = {}
  ): Promise<T> {
    try {
      const response = await $fetch<T>(`${baseURL}${endpoint}`, {
        method: options.method || 'GET',
        body: options.body,
        query: options.query,
        headers: options.headers,
      })

      return response
    } catch (error: any) {
      console.error('API Error:', error)
      
      // Extract error message
      const errorMessage = error.data?.message || error.message || 'An error occurred'
      
      throw new Error(errorMessage)
    }
  }

  /**
   * GET request helper
   */
  function get<T = any>(endpoint: string, query?: Record<string, any>): Promise<T> {
    return request<T>(endpoint, { method: 'GET', query })
  }

  /**
   * POST request helper
   */
  function post<T = any>(endpoint: string, body: any): Promise<T> {
    return request<T>(endpoint, { method: 'POST', body })
  }

  /**
   * PUT request helper
   */
  function put<T = any>(endpoint: string, body: any): Promise<T> {
    return request<T>(endpoint, { method: 'PUT', body })
  }

  /**
   * DELETE request helper
   */
  function del<T = any>(endpoint: string): Promise<T> {
    return request<T>(endpoint, { method: 'DELETE' })
  }

  return {
    request,
    get,
    post,
    put,
    delete: del,
  }
}

