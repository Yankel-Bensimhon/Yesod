// Configuration finale optimale - Supabase + Postgres direct
import { createClient } from '@supabase/supabase-js'
import postgres from 'postgres'

// Configuration Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Variables Supabase manquantes. Vérifiez NEXT_PUBLIC_SUPABASE_URL et NEXT_PUBLIC_SUPABASE_ANON_KEY')
}

// Client Supabase public (pour le frontend et auth)
export const supabase = createClient(supabaseUrl, supabaseKey)

// Client Supabase admin (pour les opérations backend sensibles)
export const supabaseAdmin = supabaseServiceKey 
  ? createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    })
  : null

// Client postgres direct (pour les requêtes SQL optimisées avec le pooler)
const connectionString = process.env.DATABASE_URL

export const sql = connectionString 
  ? postgres(connectionString, {
      max: 10,
      idle_timeout: 60,
      max_lifetime: 60 * 60,
      prepare: false, // Important pour le pooler
      transform: postgres.camel, // Transforme snake_case en camelCase
    })
  : null

// Fonction de test de santé complète
export async function healthCheck() {
  const checks = {
    supabase: false,
    supabaseAdmin: false,
    postgres: false,
  }

  try {
    // Test Supabase client
    const { error } = await supabase.auth.getSession()
    checks.supabase = !error
  } catch (error) {
    console.warn('Test Supabase client échoué:', error)
  }

  try {
    // Test Supabase admin
    if (supabaseAdmin) {
      const { data, error } = await supabaseAdmin.from('User').select('count()').limit(1)
      checks.supabaseAdmin = !error || error.message.includes('does not exist') // Table pas encore créée = OK
    }
  } catch (error) {
    console.warn('Test Supabase admin échoué:', error)
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

// Fonction utilitaire pour fermer les connexions
export async function closeConnections() {
  try {
    if (sql) await sql.end()
  } catch (error) {
    console.error('Erreur lors de la fermeture des connexions:', error)
  }
}

// Fonctions utilitaires pour les opérations courantes
export async function createUser(userData: any) {
  if (!supabaseAdmin) {
    throw new Error('Supabase admin client not available')
  }
  
  return supabaseAdmin.from('User').insert(userData).select().single()
}

export async function getUserById(id: string) {
  return supabase.from('User').select('*').eq('id', id).single()
}

export async function getUserStats() {
  if (!sql) {
    throw new Error('Postgres client not available')
  }
  
  return sql`
    SELECT 
      COUNT(*) as total_users,
      COUNT(CASE WHEN role = 'CLIENT' THEN 1 END) as clients,
      COUNT(CASE WHEN role = 'LAWYER' THEN 1 END) as lawyers,
      COUNT(CASE WHEN role = 'ADMIN' THEN 1 END) as admins
    FROM "User"
  `
}
