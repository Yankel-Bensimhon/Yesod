import { PrismaClient } from '@prisma/client'
import postgres from 'postgres'

// Prisma Client (pour les opérations ORM complexes)
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: ['query', 'error', 'warn'],
  })

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma

// Client postgres direct (pour les requêtes SQL optimisées)
// Utilise l'URL pooler si disponible, sinon l'URL standard
const connectionString = process.env.DATABASE_POOLER_URL || process.env.DATABASE_URL

if (!connectionString) {
  throw new Error('DATABASE_URL or DATABASE_POOLER_URL environment variable is not set')
}

export const sql = postgres(connectionString, {
  max: 10,
  idle_timeout: 60,
  max_lifetime: 60 * 60,
  // Configuration optimisée pour le pooler
  prepare: false, // Désactive les prepared statements pour le pooler
  transform: postgres.camel, // Transforme snake_case en camelCase
})

// Fonction utilitaire pour fermer les connexions proprement
export async function closeConnections() {
  await prisma.$disconnect()
  await sql.end()
}
