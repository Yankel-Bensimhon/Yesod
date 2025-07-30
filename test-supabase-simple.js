// Test simple de connexion Supabase
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.log('❌ Variables Supabase manquantes. Configurez:');
  console.log('   NEXT_PUBLIC_SUPABASE_URL');
  console.log('   NEXT_PUBLIC_SUPABASE_ANON_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testSupabase() {
  try {
    const { data, error } = await supabase.from('User').select('count(*)').limit(1);
    
    if (error) {
      console.log('⚠️  Erreur Supabase:', error.message);
      console.log('💡 Vérifiez que votre schéma est synchronisé avec: npm run db:push');
    } else {
      console.log('✅ Connexion Supabase réussie !');
    }
  } catch (err) {
    console.log('❌ Erreur de connexion:', err.message);
  }
}

testSupabase();
