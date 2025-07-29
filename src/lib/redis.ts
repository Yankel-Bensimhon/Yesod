import { Redis } from '@upstash/redis'
import { createClient } from 'redis'

// Configuration Redis pour le cache haute performance
const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379'
const UPSTASH_REDIS_REST_URL = process.env.UPSTASH_REDIS_REST_URL
const UPSTASH_REDIS_REST_TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN

// Client Redis pour le développement local
let redisClient: any = null

// Client Upstash Redis pour la production (serverless)
let upstashClient: Redis | null = null

if (UPSTASH_REDIS_REST_URL && UPSTASH_REDIS_REST_TOKEN) {
  upstashClient = new Redis({
    url: UPSTASH_REDIS_REST_URL,
    token: UPSTASH_REDIS_REST_TOKEN,
  })
} else if (process.env.NODE_ENV === 'development') {
  redisClient = createClient({
    url: REDIS_URL,
  })
  
  redisClient.on('error', (err: any) => {
    console.log('Redis Client Error', err)
  })
}

// Interface unifiée pour le cache
export class CacheService {
  private static instance: CacheService
  
  public static getInstance(): CacheService {
    if (!CacheService.instance) {
      CacheService.instance = new CacheService()
    }
    return CacheService.instance
  }

  async connect() {
    if (redisClient && !redisClient.isOpen) {
      await redisClient.connect()
    }
  }

  async disconnect() {
    if (redisClient && redisClient.isOpen) {
      await redisClient.disconnect()
    }
  }

  // Méthodes de cache unifiées
  async get(key: string): Promise<string | null> {
    try {
      if (upstashClient) {
        return await upstashClient.get(key)
      } else if (redisClient) {
        await this.connect()
        return await redisClient.get(key)
      }
      return null
    } catch (error) {
      console.error('Cache get error:', error)
      return null
    }
  }

  async set(key: string, value: string, ttlSeconds?: number): Promise<boolean> {
    try {
      if (upstashClient) {
        if (ttlSeconds) {
          await upstashClient.setex(key, ttlSeconds, value)
        } else {
          await upstashClient.set(key, value)
        }
        return true
      } else if (redisClient) {
        await this.connect()
        if (ttlSeconds) {
          await redisClient.setEx(key, ttlSeconds, value)
        } else {
          await redisClient.set(key, value)
        }
        return true
      }
      return false
    } catch (error) {
      console.error('Cache set error:', error)
      return false
    }
  }

  async del(key: string): Promise<boolean> {
    try {
      if (upstashClient) {
        await upstashClient.del(key)
        return true
      } else if (redisClient) {
        await this.connect()
        await redisClient.del(key)
        return true
      }
      return false
    } catch (error) {
      console.error('Cache delete error:', error)
      return false
    }
  }

  async exists(key: string): Promise<boolean> {
    try {
      if (upstashClient) {
        const result = await upstashClient.exists(key)
        return result === 1
      } else if (redisClient) {
        await this.connect()
        const result = await redisClient.exists(key)
        return result === 1
      }
      return false
    } catch (error) {
      console.error('Cache exists error:', error)
      return false
    }
  }

  // Cache pour les objets JSON
  async getJSON<T>(key: string): Promise<T | null> {
    try {
      const value = await this.get(key)
      return value ? JSON.parse(value) : null
    } catch (error) {
      console.error('Cache getJSON error:', error)
      return null
    }
  }

  async setJSON<T>(key: string, value: T, ttlSeconds?: number): Promise<boolean> {
    try {
      return await this.set(key, JSON.stringify(value), ttlSeconds)
    } catch (error) {
      console.error('Cache setJSON error:', error)
      return false
    }
  }

  // Génération de clés de cache spécialisées
  static generateCacheKey(type: string, id: string | number, params?: Record<string, any>): string {
    const baseKey = `yesod:${type}:${id}`
    if (params) {
      const paramString = Object.entries(params)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([key, value]) => `${key}=${value}`)
        .join('&')
      return `${baseKey}:${paramString}`
    }
    return baseKey
  }
}

// Décorateur pour mettre en cache les résultats de méthodes
export function Cached(ttlSeconds: number = 300) {
  return function (target: any, propertyName: string, descriptor: PropertyDescriptor) {
    const method = descriptor.value
    
    descriptor.value = async function (...args: any[]) {
      const cache = CacheService.getInstance()
      const cacheKey = CacheService.generateCacheKey(
        `${target.constructor.name}.${propertyName}`,
        JSON.stringify(args)
      )
      
      // Essayer de récupérer depuis le cache
      const cached = await cache.getJSON(cacheKey)
      if (cached !== null) {
        return cached
      }
      
      // Exécuter la méthode et mettre en cache
      const result = await method.apply(this, args)
      await cache.setJSON(cacheKey, result, ttlSeconds)
      
      return result
    }
  }
}

export const cache = CacheService.getInstance()
