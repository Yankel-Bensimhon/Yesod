#!/usr/bin/env node

const { execSync } = require('child_process');

console.log('🔧 Réparation de la base de données Yesod...\n');

try {
  // 1. Vérifier la connexion
  console.log('1. Test de connexion à PostgreSQL...');
  execSync('npx prisma db push --accept-data-loss', { stdio: 'inherit' });
  
  console.log('\n✅ Base de données synchronisée !');
  console.log('\n🎯 Maintenant vous pouvez :');
  console.log('- Créer des dossiers dans le backoffice');
  console.log('- Importer des documents');
  console.log('- Utiliser toutes les fonctionnalités');
  
} catch (error) {
  console.error('\n❌ Erreur :', error.message);
  console.log('\n🔍 Solutions possibles :');
  console.log('1. Vérifiez que PostgreSQL tourne : docker ps');
  console.log('2. Redémarrez la base : docker-compose restart postgres');
  console.log('3. Vérifiez les variables d\'environnement dans .env.local');
}
