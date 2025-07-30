const postgres = require('postgres');

// Test de différentes chaînes de connexion
const connectionStrings = [
  // Version 1: avec caractères spéciaux encodés
  "postgresql://postgres:FEWCyK5xQ5Hc!%40S@db.xiybcaxsjafmqyxbocyi.supabase.co:5432/postgres",
  
  // Version 2: en utilisant le port direct
  "postgresql://postgres:FEWCyK5xQ5Hc!%40S@db.xiybcaxsjafmqyxbocyi.supabase.co:6543/postgres",
  
  // Version 3: encodage différent
  "postgresql://postgres:FEWCyK5xQ5Hc%21%40S@db.xiybcaxsjafmqyxbocyi.supabase.co:5432/postgres",
];

async function testConnection(connectionString, index) {
  console.log(`\n🔍 Test ${index + 1}: ${connectionString.replace(/:[^:]*@/, ':***@')}`);
  
  try {
    const sql = postgres(connectionString, {
      connect_timeout: 10,
      idle_timeout: 60,
      max: 1
    });
    
    const result = await sql`SELECT NOW() as current_time, version() as pg_version`;
    console.log(`✅ Connexion réussie !`);
    console.log(`   Heure: ${result[0].current_time}`);
    console.log(`   Version PG: ${result[0].pg_version.substring(0, 50)}...`);
    
    await sql.end();
    return true;
  } catch (error) {
    console.log(`❌ Échec: ${error.message}`);
    return false;
  }
}

async function runTests() {
  console.log('🚀 Test de connexion Supabase...\n');
  
  for (let i = 0; i < connectionStrings.length; i++) {
    const success = await testConnection(connectionStrings[i], i);
    if (success) {
      console.log(`\n🎉 Connexion trouvée ! Utilisez cette chaîne dans votre .env:`);
      console.log(`DATABASE_URL="${connectionStrings[i]}"`);
      process.exit(0);
    }
    
    // Attendre un peu entre les tests
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  console.log('\n❌ Aucune connexion n\'a fonctionné. Vérifiez:');
  console.log('   1. Que votre projet Supabase est actif');
  console.log('   2. Le mot de passe dans la dashboard Supabase');
  console.log('   3. Les paramètres de connexion dans Settings > Database');
}

runTests().catch(console.error);
