import postgres from 'postgres'

// Utilise l'URL pooler si disponible, sinon l'URL standard
const connectionString = process.env.DATABASE_POOLER_URL || process.env.DATABASE_URL

if (!connectionString) {
  throw new Error('DATABASE_URL or DATABASE_POOLER_URL environment variable is not set')
}

const sql = postgres(connectionString, {
  // Options pour la production avec pooler
  max: 10, // Nombre maximum de connexions
  idle_timeout: 60, // Timeout en secondes
  max_lifetime: 60 * 60, // Durée de vie maximale d'une connexion en secondes
  prepare: false, // Désactive les prepared statements pour compatibilité pooler
})

export default sql
