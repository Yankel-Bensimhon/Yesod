// Test rapide de votre configuration Supabase
const postgres = require('postgres');
const { createClient } = require('@supabase/supabase-js');

async function testConfiguration() {
  console.log('🧪 TEST DE VOTRE CONFIGURATION SUPABASE');
  console.log('======================================');
  
  let postgresOK = false;
  let supabaseOK = false;

  // Test 1: Driver postgres
  console.log('\n1️⃣ Test driver postgres...');
  try {
    const sql = postgres(process.env.DATABASE_URL, {
      prepare: false,
      max: 1
    });
    
    const result = await sql`SELECT NOW() as time`;
    console.log('✅ Driver postgres: SUCCÈS');
    console.log(`   ⏰ Heure serveur: ${result[0].time}`);
    postgresOK = true;
    
    await sql.end();
  } catch (error) {
    console.log('❌ Driver postgres: ÉCHEC');
    console.log(`   💥 Erreur: ${error.message}`);
  }

  // Test 2: Client Supabase
  console.log('\n2️⃣ Test client Supabase...');
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    );
    
    const { error } = await supabase.auth.getSession();
    console.log('✅ Client Supabase: SUCCÈS');
    console.log('   🔐 Système d\'auth: Opérationnel');
    supabaseOK = true;
  } catch (error) {
    console.log('❌ Client Supabase: ÉCHEC');
    console.log(`   💥 Erreur: ${error.message}`);
  }

  // Résultat final
  console.log('\n🎯 RÉSULTAT FINAL:');
  console.log('==================');
  
  if (postgresOK && supabaseOK) {
    console.log('🎉 PARFAIT ! Votre configuration Supabase fonctionne à 100% !');
    console.log('');
    console.log('✅ Vous pouvez maintenant:');
    console.log('   • Utiliser sql`SELECT ...` pour les requêtes');
    console.log('   • Utiliser supabase.auth pour l\'authentification');
    console.log('   • Déployer sur Vercel en toute confiance');
  } else if (postgresOK || supabaseOK) {
    console.log('⚠️  Configuration partiellement fonctionnelle');
    console.log(`   Driver postgres: ${postgresOK ? '✅' : '❌'}`);
    console.log(`   Client Supabase: ${supabaseOK ? '✅' : '❌'}`);
  } else {
    console.log('❌ Configuration non fonctionnelle');
    console.log('   Vérifiez vos variables d\'environnement dans .env');
  }
}

testConfiguration().catch(console.error);
