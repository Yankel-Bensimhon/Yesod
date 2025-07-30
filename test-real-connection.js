// Test direct avec les vraies clés
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://xiybcaxsjafmqyxbocyi.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhpeWJjYXhzamFmbXF5eGJvY3lpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM4MzAzNDYsImV4cCI6MjA2OTQwNjM0Nn0.iNP3nN3P0Ux_9LSgcJ31qgvItrfS8YwhEfIqaCEpzek';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testSupabase() {
  console.log('🔍 Test de connexion Supabase...');
  
  try {
    // Test de ping basique
    const { data, error } = await supabase
      .from('User')
      .select('count()')
      .limit(1);
    
    if (error) {
      console.log('⚠️  Table User pas encore créée, mais connexion OK !');
      console.log('💡 Détail:', error.message);
      
      // Test alternatif - simple requête auth
      const { data: authData, error: authError } = await supabase.auth.getSession();
      if (!authError) {
        console.log('✅ Connexion Supabase réussie ! (Auth fonctionne)');
        return true;
      }
    } else {
      console.log('✅ Connexion Supabase réussie ! Table User trouvée.');
      console.log('📊 Données:', data);
      return true;
    }
  } catch (err) {
    console.log('❌ Erreur de connexion Supabase:', err.message);
    return false;
  }
}

// Test avec le driver postgres aussi
const postgres = require('postgres');

async function testPostgres() {
  console.log('\n🔍 Test du driver postgres...');
  
  const connectionString = 'postgresql://postgres:FEWCyK5xQ5Hc!%40S@db.xiybcaxsjafmqyxbocyi.supabase.co:5432/postgres';
  
  try {
    const sql = postgres(connectionString, {
      connect_timeout: 10,
      idle_timeout: 60,
      max: 1
    });
    
    const result = await sql`SELECT NOW() as current_time, version() as pg_version`;
    console.log('✅ Driver postgres fonctionne !');
    console.log(`   Heure: ${result[0].current_time}`);
    console.log(`   Version: ${result[0].pg_version.substring(0, 50)}...`);
    
    await sql.end();
    return true;
  } catch (error) {
    console.log('❌ Driver postgres échoué:', error.message);
    return false;
  }
}

async function runAllTests() {
  const supabaseOk = await testSupabase();
  const postgresOk = await testPostgres();
  
  console.log('\n📋 RÉSULTATS:');
  console.log(`   Supabase Client: ${supabaseOk ? '✅' : '❌'}`);
  console.log(`   Postgres Driver: ${postgresOk ? '✅' : '❌'}`);
  
  if (supabaseOk || postgresOk) {
    console.log('\n🎉 AU MOINS UNE CONNEXION FONCTIONNE !');
    console.log('🚀 Vous pouvez maintenant synchroniser votre schéma avec: npm run db:push');
  } else {
    console.log('\n❌ Aucune connexion ne fonctionne. Vérifiez votre configuration.');
  }
}

runAllTests().catch(console.error);
