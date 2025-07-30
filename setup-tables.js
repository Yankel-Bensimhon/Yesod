// Script pour créer les tables via le client Supabase
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://xiybcaxsjafmqyxbocyi.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhpeWJjYXhzamFmbXF5eGJvY3lpIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MzgzMDM0NiwiZXhwIjoyMDY5NDA2MzQ2fQ.8auwEvQDqjW--NMf6JrGzjwEpXWEll66ML9M0zWXqIs';

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function createTables() {
  console.log('🔧 Création des tables via Supabase...\n');

  try {
    // Créer la table User
    const { data, error } = await supabase.rpc('exec_sql', {
      sql: `
        -- Table User
        CREATE TABLE IF NOT EXISTS "User" (
          id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
          email TEXT UNIQUE NOT NULL,
          name TEXT,
          password TEXT,
          role TEXT NOT NULL DEFAULT 'CLIENT',
          "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );

        -- Index pour les performances
        CREATE INDEX IF NOT EXISTS "User_email_idx" ON "User"(email);
        CREATE INDEX IF NOT EXISTS "User_role_idx" ON "User"(role);

        -- Trigger pour updatedAt
        CREATE OR REPLACE FUNCTION update_updated_at_column()
        RETURNS TRIGGER AS $$
        BEGIN
          NEW."updatedAt" = NOW();
          RETURN NEW;
        END;
        $$ language 'plpgsql';

        CREATE TRIGGER update_user_updated_at 
          BEFORE UPDATE ON "User" 
          FOR EACH ROW 
          EXECUTE FUNCTION update_updated_at_column();
      `
    });

    if (error) {
      console.log('⚠️  Tentative avec SQL direct...');
      
      // Méthode alternative avec requêtes SQL directes
      await createUserTable();
      
    } else {
      console.log('✅ Tables créées avec succès via RPC !');
    }

  } catch (error) {
    console.log('⚠️  RPC non disponible, utilisation des requêtes SQL directes...');
    await createUserTable();
  }
}

async function createUserTable() {
  try {
    // Utiliser le driver postgres avec le pooler
    const postgres = require('postgres');
    const sql = postgres('postgresql://postgres.xiybcaxsjafmqyxbocyi:FEWCyK5xQ5Hc!%40S@aws-0-eu-west-3.pooler.supabase.com:6543/postgres', {
      prepare: false,
      max: 1
    });

    console.log('🔨 Création de la table User...');
    
    await sql`
      CREATE TABLE IF NOT EXISTS "User" (
        id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
        email TEXT UNIQUE NOT NULL,
        name TEXT,
        password TEXT,
        role TEXT NOT NULL DEFAULT 'CLIENT',
        "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )
    `;

    console.log('📊 Création des index...');
    
    await sql`CREATE INDEX IF NOT EXISTS "User_email_idx" ON "User"(email)`;
    await sql`CREATE INDEX IF NOT EXISTS "User_role_idx" ON "User"(role)`;

    console.log('⚡ Création du trigger pour updatedAt...');
    
    await sql`
      CREATE OR REPLACE FUNCTION update_updated_at_column()
      RETURNS TRIGGER AS $$
      BEGIN
        NEW."updatedAt" = NOW();
        RETURN NEW;
      END;
      $$ language 'plpgsql'
    `;

    await sql`
      DROP TRIGGER IF EXISTS update_user_updated_at ON "User";
      CREATE TRIGGER update_user_updated_at 
        BEFORE UPDATE ON "User" 
        FOR EACH ROW 
        EXECUTE FUNCTION update_updated_at_column()
    `;

    console.log('✅ Table User créée avec succès !');

    // Test de la table
    const result = await sql`SELECT COUNT(*) as count FROM "User"`;
    console.log(`📋 Table User: ${result[0].count} enregistrements`);

    await sql.end();

  } catch (error) {
    console.log('❌ Erreur lors de la création:', error.message);
  }
}

async function testConnection() {
  console.log('\n🧪 Test de connexion final...');
  
  try {
    const postgres = require('postgres');
    const sql = postgres('postgresql://postgres.xiybcaxsjafmqyxbocyi:FEWCyK5xQ5Hc!%40S@aws-0-eu-west-3.pooler.supabase.com:6543/postgres', {
      prepare: false,
      max: 1
    });

    const result = await sql`SELECT tablename FROM pg_tables WHERE schemaname = 'public'`;
    console.log('✅ Tables disponibles:', result.map(r => r.tablename).join(', '));

    await sql.end();

    console.log('\n🎉 CONFIGURATION TERMINÉE !');
    console.log('🚀 Vous pouvez maintenant:');
    console.log('   1. Démarrer votre app: npm run dev');
    console.log('   2. Tester les fonctionnalités');
    console.log('   3. Déployer sur Vercel');

  } catch (error) {
    console.log('❌ Test final échoué:', error.message);
  }
}

createTables()
  .then(() => testConnection())
  .catch(console.error);
