// Test de la nouvelle URL pooler
const postgres = require('postgres');

async function testPoolerConnection() {
  console.log('🔍 Test de la connexion pooler Supabase...\n');
  
  const connectionString = 'postgresql://postgres.xiybcaxsjafmqyxbocyi:FEWCyK5xQ5Hc!%40S@aws-0-eu-west-3.pooler.supabase.com:6543/postgres';
  
  try {
    const sql = postgres(connectionString, {
      connect_timeout: 10,
      idle_timeout: 60,
      max: 5, // Plus conservateur pour le pooler
    });
    
    console.log('🔌 Connexion au pooler...');
    const result = await sql`SELECT 
      NOW() as current_time, 
      version() as pg_version,
      current_database() as database_name,
      current_user as user_name
    `;
    
    console.log('✅ Connexion pooler réussie !');
    console.log(`   📅 Heure: ${result[0].current_time}`);
    console.log(`   🗃️  Base: ${result[0].database_name}`);
    console.log(`   👤 Utilisateur: ${result[0].user_name}`);
    console.log(`   🐘 PostgreSQL: ${result[0].pg_version.substring(0, 50)}...`);
    
    await sql.end();
    return true;
  } catch (error) {
    console.log('❌ Connexion pooler échouée:', error.message);
    return false;
  }
}

async function testPrismaWithPooler() {
  console.log('\n🔍 Test Prisma avec pooler...');
  
  try {
    const { PrismaClient } = require('@prisma/client');
    
    const prisma = new PrismaClient({
      log: ['error'],
    });
    
    await prisma.$queryRaw`SELECT 1 as test`;
    console.log('✅ Prisma avec pooler fonctionne !');
    
    await prisma.$disconnect();
    return true;
  } catch (error) {
    console.log('❌ Prisma avec pooler échoué:', error.message);
    return false;
  }
}

async function runPoolerTests() {
  const postgresOk = await testPoolerConnection();
  const prismaOk = await testPrismaWithPooler();
  
  console.log('\n📋 RÉSULTATS POOLER:');
  console.log(`   Postgres Direct: ${postgresOk ? '✅' : '❌'}`);
  console.log(`   Prisma ORM: ${prismaOk ? '✅' : '❌'}`);
  
  if (postgresOk && prismaOk) {
    console.log('\n🎉 PARFAIT ! Toutes les connexions fonctionnent avec le pooler !');
    console.log('🚀 Vous pouvez maintenant:');
    console.log('   1. Synchroniser le schéma: npm run db:push');
    console.log('   2. Démarrer votre app: npm run dev');
    console.log('   3. Déployer sur Vercel: npm run vercel:deploy');
  } else if (postgresOk || prismaOk) {
    console.log('\n⚠️  Une connexion fonctionne, mais pas l\'autre.');
    console.log('💡 Vous pouvez quand même utiliser celle qui marche.');
  } else {
    console.log('\n❌ Les connexions pooler ne fonctionnent pas non plus.');
    console.log('💡 Utilisez uniquement le client Supabase qui fonctionne.');
  }
}

runPoolerTests().catch(console.error);
