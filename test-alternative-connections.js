// Test de différentes URLs de connexion pour résoudre le problème IPv6
const { createClient } = require('@supabase/supabase-js');

console.log('🔧 Test de résolution du problème de connexion...\n');

// URLs alternatives à tester
const alternativeConnections = [
  // URL pooler (souvent disponible sur port 6543)
  'postgresql://postgres:FEWCyK5xQ5Hc!%40S@aws-0-eu-central-1.pooler.supabase.com:6543/postgres',
  
  // URL avec IPv4 forcé (si disponible)
  'postgresql://postgres:FEWCyK5xQ5Hc!%40S@54.93.208.157:5432/postgres',
  
  // URL direct avec session pooling
  'postgresql://postgres:FEWCyK5xQ5Hc!%40S@db.xiybcaxsjafmqyxbocyi.supabase.co:6543/postgres',
  
  // URL avec options de connexion
  'postgresql://postgres:FEWCyK5xQ5Hc!%40S@db.xiybcaxsjafmqyxbocyi.supabase.co:5432/postgres?sslmode=require&connect_timeout=10',
];

async function testPrismaConnection(connectionString, index) {
  console.log(`🔍 Test ${index + 1}: ${connectionString.replace(/:[^:]*@/, ':***@').substring(0, 80)}...`);
  
  try {
    // Simulation de ce que fait Prisma
    const { PrismaClient } = require('@prisma/client');
    
    // Temporairement changer DATABASE_URL
    const originalUrl = process.env.DATABASE_URL;
    process.env.DATABASE_URL = connectionString;
    
    const prisma = new PrismaClient({
      log: ['error'],
    });
    
    // Test simple
    await prisma.$queryRaw`SELECT 1 as test`;
    console.log('✅ Connexion Prisma réussie !');
    
    await prisma.$disconnect();
    process.env.DATABASE_URL = originalUrl;
    
    return connectionString;
  } catch (error) {
    console.log(`❌ Échec: ${error.message.substring(0, 100)}...`);
    process.env.DATABASE_URL = originalUrl;
    return null;
  }
}

async function findWorkingConnection() {
  console.log('🎯 Recherche d\'une URL de connexion qui fonctionne...\n');
  
  for (let i = 0; i < alternativeConnections.length; i++) {
    const workingUrl = await testPrismaConnection(alternativeConnections[i], i);
    
    if (workingUrl) {
      console.log('\n🎉 URL DE CONNEXION TROUVÉE !');
      console.log('📝 Mettez cette URL dans votre .env:');
      console.log(`DATABASE_URL="${workingUrl}"`);
      console.log('\n🚀 Puis testez: npm run db:push');
      return;
    }
    
    // Attendre entre les tests
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  console.log('\n⚠️  Aucune URL directe ne fonctionne.');
  console.log('💡 Solutions alternatives:');
  console.log('   1. Utilisez uniquement le client Supabase (qui fonctionne)');
  console.log('   2. Vérifiez dans votre dashboard Supabase la section "Connection pooling"');
  console.log('   3. Contactez le support Supabase si le problème persiste');
}

findWorkingConnection().catch(console.error);
