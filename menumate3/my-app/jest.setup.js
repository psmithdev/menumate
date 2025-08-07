// Optional: configure or set up a testing framework before each test.
// If you delete this file, remove `setupFilesAfterEnv` from `jest.config.js`

require('@testing-library/jest-dom')

// Global mocks
global.fetch = jest.fn()

// Mock File constructor for tests
global.File = class File {
  constructor(bits, name, options = {}) {
    this.name = name
    this.size = bits.reduce((acc, bit) => acc + (bit?.length || 0), 0)
    this.type = options?.type || ''
  }
}

// Mock URL.createObjectURL
global.URL = {
  createObjectURL: jest.fn(() => 'mock-url'),
  revokeObjectURL: jest.fn(),
}