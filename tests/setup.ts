/**
 * Jest setup file - runs before all tests
 * 
 * @description This file initializes the test environment,
 * sets up global mocks, and configures testing utilities.
 * Think of it as the bouncer who checks everyone's ID before
 * they enter the test party. 🎉
 */

// Suppress console output during tests unless explicitly testing logging
global.console = {
  ...console,
  log: jest.fn(),
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  // Keep error for debugging failed tests
  error: console.error,
}

// Set test timeout
jest.setTimeout(10000)

// Clean up after each test
afterEach(() => {
  jest.clearAllMocks()
})

