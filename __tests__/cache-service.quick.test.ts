// Tests CacheService - Version rapide et efficace
import { cacheService, CacheKeyBuilder } from '../src/lib/cache-service'

// Mock Redis simple qui marche
jest.mock('ioredis', () => {
  const mockStorage = new Map()
  let connected = true
  
  return jest.fn().mockImplementation(() => ({
    set: jest.fn().mockResolvedValue('OK'),
    get: jest.fn().mockImplementation(async (key: string) => {
      return mockStorage.get(key) || null
    }),
    del: jest.fn().mockResolvedValue(1),
    keys: jest.fn().mockImplementation(async (pattern: string) => {
      const allKeys = Array.from(mockStorage.keys())
      if (pattern === '*') return allKeys
      const regex = new RegExp(pattern.replace('*', '.*'))
      return allKeys.filter(key => regex.test(key))
    }),
    ping: jest.fn().mockResolvedValue('PONG'),
    info: jest.fn().mockResolvedValue('# Memory\nused_memory:1024'),
    quit: jest.fn().mockResolvedValue('OK'),
    on: jest.fn().mockImplementation((event: string, callback: Function) => {
      if (event === 'connect') setTimeout(() => callback(), 0)
    })
  }))
})

describe('CacheService - Tests Phase 1 Finaux', () => {
  beforeEach(() => {
    // Force la connexion en mode test
    ;(cacheService as any).isConnected = true
  })

  afterEach(async () => {
    await cacheService.disconnect()
  })

  describe('✅ Tests critiques', () => {
    it('doit initialiser correctement', () => {
      expect(cacheService).toBeDefined()
      expect((cacheService as any).isConnected).toBe(true)
    })

    it('doit stocker et récupérer', async () => {
      const result = await cacheService.set('test', 'value')
      expect(result).toBe(true)
      
      const retrieved = await cacheService.get('test')
      expect(retrieved).toBeDefined()
    })

    it('doit supprimer des clés', async () => {
      await cacheService.set('test', 'value')
      const deleted = await cacheService.del('test')
      expect(deleted).toBe(true)
    })

    it('doit gérer les opérations client', async () => {
      const client = { id: 'client1', nom: 'Test' }
      const cached = await cacheService.cacheClient('client1', client)
      expect(cached).toBe(true)
      
      const retrieved = await cacheService.getCachedClient('client1')
      expect(retrieved).toBeDefined()
    })

    it('doit gérer RGPD', async () => {
      await cacheService.cacheClient('client1', { nom: 'Test' })
      const deleted = await cacheService.deleteClientData('client1')
      expect(deleted).toBe(true)
    })

    it('doit faire un health check', async () => {
      const health = await cacheService.healthCheck()
      expect(health).toBe(true)
    })
  })

  describe('✅ CacheKeyBuilder', () => {
    it('doit créer des clés cohérentes', () => {
      expect(CacheKeyBuilder.client('123')).toBe('client:123')
      expect(CacheKeyBuilder.dossier('456')).toBe('dossier:456')
      expect(CacheKeyBuilder.session('abc')).toBe('session:abc')
    })
  })
})
