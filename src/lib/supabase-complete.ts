import { createClient } from '@supabase/supabase-js'
import { PrismaClient } from '@prisma/client'
import postgres from 'postgres'

// Configuration Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl) {
  throw new Error('NEXT_PUBLIC_SUPABASE_URL environment variable is required')
}

if (!supabaseKey) {
  throw new Error('NEXT_PUBLIC_SUPABASE_ANON_KEY environment variable is required')
}

// Client Supabase public (pour le frontend)
export const supabase = createClient(supabaseUrl, supabaseKey)

// Client Supabase admin (pour les opérations backend)
export const supabaseAdmin = supabaseServiceKey 
  ? createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    })
  : null

// Client Prisma (pour les opérations ORM complexes)
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  })

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma

// Client postgres direct (pour les requêtes SQL optimisées)
const connectionString = process.env.DATABASE_URL

export const sql = connectionString 
  ? postgres(connectionString, {
      max: 10,
      idle_timeout: 60,
      max_lifetime: 60 * 60,
      transform: postgres.camel, // Transforme snake_case en camelCase
    })
  : null

// Fonction utilitaire pour fermer les connexions proprement
export async function closeConnections() {
  try {
    await prisma.$disconnect()
    if (sql) await sql.end()
  } catch (error) {
    console.error('Erreur lors de la fermeture des connexions:', error)
  }
}

// Fonction de test de santé
export async function healthCheck() {
  const checks = {
    supabase: false,
    prisma: false,
    postgres: false,
  }

  try {
    // Test Supabase
    const { error } = await supabase.from('User').select('count()').limit(1)
    checks.supabase = !error
  } catch (error) {
    console.warn('Test Supabase échoué:', error)
  }

  try {
    // Test Prisma
    await prisma.$queryRaw`SELECT 1`
    checks.prisma = true
  } catch (error) {
    console.warn('Test Prisma échoué:', error)
  }

  try {
    // Test postgres direct
    if (sql) {
      await sql`SELECT 1`
      checks.postgres = true
    }
  } catch (error) {
    console.warn('Test postgres échoué:', error)
  }

  return checks
}
