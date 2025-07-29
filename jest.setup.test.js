// Configuration globale Jest pour les tests Phase 1
global.console = {
  ...console,
  log: jest.fn(),
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
}

// Mock Redis sophistiqué pour les tests
jest.mock('ioredis', () => {
  const mockData = new Map()
  
  return jest.fn().mockImplementation(() => {
    const mockRedis = {
      get: jest.fn().mockImplementation(async (key) => {
        return mockData.get(key) || null
      }),
      set: jest.fn().mockImplementation(async (key, value) => {
        mockData.set(key, value)
        return 'OK'
      }),
      setex: jest.fn().mockImplementation(async (key, ttl, value) => {
        mockData.set(key, value)
        // Simuler l'expiration après TTL
        setTimeout(() => mockData.delete(key), ttl * 1000)
        return 'OK'
      }),
      del: jest.fn().mockImplementation(async (key) => {
        const existed = mockData.has(key)
        mockData.delete(key)
        return existed ? 1 : 0
      }),
      exists: jest.fn().mockImplementation(async (key) => {
        return mockData.has(key) ? 1 : 0
      }),
      expire: jest.fn().mockImplementation(async (key, ttl) => {
        if (mockData.has(key)) {
          setTimeout(() => mockData.delete(key), ttl * 1000)
          return 1
        }
        return 0
      }),
      ping: jest.fn().mockResolvedValue('PONG'),
      quit: jest.fn().mockResolvedValue('OK'),
      on: jest.fn().mockImplementation((event, callback) => {
        // Simuler la connexion immédiatement
        if (event === 'connect') {
          setTimeout(() => callback(), 0)
        }
      }),
      keys: jest.fn().mockImplementation(async (pattern) => {
        const allKeys = Array.from(mockData.keys())
        if (pattern === '*') return allKeys
        // Simulation simple de pattern matching
        const regex = new RegExp(pattern.replace('*', '.*'))
        return allKeys.filter(key => regex.test(key))
      }),
      flushall: jest.fn().mockImplementation(async () => {
        mockData.clear()
        return 'OK'
      })
    }
    
    return mockRedis
  })
})

// Mock Sentry pour les tests
jest.mock('@sentry/nextjs', () => ({
  init: jest.fn(),
  captureException: jest.fn(),
  captureMessage: jest.fn(),
  addBreadcrumb: jest.fn(),
  withScope: jest.fn((callback) => callback({ 
    setExtra: jest.fn(), 
    setLevel: jest.fn(), 
    setTag: jest.fn() 
  })),
  startSpan: jest.fn((options, callback) => callback({ 
    setStatus: jest.fn() 
  })),
}))

// Setup global test environment
process.env.NODE_ENV = 'test'
process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test_db'
process.env.REDIS_URL = 'redis://localhost:6379'
process.env.REDIS_HOST = 'localhost'
process.env.REDIS_PORT = '6379'
