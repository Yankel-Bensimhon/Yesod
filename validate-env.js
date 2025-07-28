#!/usr/bin/env node

/**
 * 🔍 Script de Validation de l'Environnement Yesod
 * Ce script vérifie que toutes les variables d'environnement sont correctement configurées
 */

const fs = require('fs');
const path = require('path');

// Couleurs pour l'affichage console
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

function log(level, message) {
  const timestamp = new Date().toISOString();
  const color = colors[level] || colors.reset;
  console.log(`${color}[${level.toUpperCase()}]${colors.reset} ${message}`);
}

function checkEnvFile() {
  const envPath = path.join(process.cwd(), '.env.local');
  
  if (!fs.existsSync(envPath)) {
    log('red', '❌ Fichier .env.local non trouvé');
    log('yellow', '💡 Exécutez: cp .env.example .env.local');
    return false;
  }
  
  log('green', '✅ Fichier .env.local trouvé');
  return true;
}

function validateDatabaseUrl(url) {
  if (!url) {
    log('red', '❌ DATABASE_URL manquante');
    return false;
  }
  
  if (!url.startsWith('postgresql://')) {
    log('red', '❌ DATABASE_URL doit commencer par postgresql://');
    return false;
  }
  
  // Vérification du format basique
  const urlPattern = /^postgresql:\/\/[^:]+:[^@]+@[^:]+:\d+\/[^?]+/;
  if (!urlPattern.test(url)) {
    log('red', '❌ Format DATABASE_URL invalide');
    log('yellow', '💡 Format attendu: postgresql://username:password@host:port/database');
    return false;
  }
  
  log('green', '✅ DATABASE_URL correctement formatée');
  return true;
}

function validateNextAuthConfig() {
  let valid = true;
  
  const nextAuthUrl = process.env.NEXTAUTH_URL;
  const nextAuthSecret = process.env.NEXTAUTH_SECRET;
  
  // Validation NEXTAUTH_URL
  if (!nextAuthUrl) {
    log('red', '❌ NEXTAUTH_URL manquante');
    valid = false;
  } else if (!nextAuthUrl.startsWith('http://') && !nextAuthUrl.startsWith('https://')) {
    log('red', '❌ NEXTAUTH_URL doit commencer par http:// ou https://');
    valid = false;
  } else {
    log('green', '✅ NEXTAUTH_URL configurée');
  }
  
  // Validation NEXTAUTH_SECRET
  if (!nextAuthSecret) {
    log('red', '❌ NEXTAUTH_SECRET manquante');
    log('yellow', '💡 Générez une clé avec: openssl rand -base64 32');
    valid = false;
  } else if (nextAuthSecret === 'your-nextauth-secret-key') {
    log('red', '❌ NEXTAUTH_SECRET utilise la valeur par défaut');
    log('yellow', '💡 Générez une clé sécurisée avec: openssl rand -base64 32');
    valid = false;
  } else if (nextAuthSecret.length < 32) {
    log('yellow', '⚠️  NEXTAUTH_SECRET courte (recommandé: 32+ caractères)');
  } else {
    log('green', '✅ NEXTAUTH_SECRET configurée');
  }
  
  return valid;
}

function validateGoogleOAuth() {
  const googleClientId = process.env.GOOGLE_CLIENT_ID;
  const googleClientSecret = process.env.GOOGLE_CLIENT_SECRET;
  
  if (!googleClientId && !googleClientSecret) {
    log('cyan', 'ℹ️  Google OAuth non configuré (optionnel)');
    return true;
  }
  
  if (!googleClientId || googleClientId === 'your-google-client-id') {
    log('yellow', '⚠️  GOOGLE_CLIENT_ID manquante ou par défaut');
    return false;
  }
  
  if (!googleClientSecret || googleClientSecret === 'your-google-client-secret') {
    log('yellow', '⚠️  GOOGLE_CLIENT_SECRET manquante ou par défaut');
    return false;
  }
  
  if (!googleClientId.endsWith('.apps.googleusercontent.com')) {
    log('yellow', '⚠️  GOOGLE_CLIENT_ID format suspect (devrait finir par .apps.googleusercontent.com)');
  }
  
  log('green', '✅ Google OAuth configuré');
  return true;
}

async function testDatabaseConnection() {
  try {
    log('cyan', '🔄 Test de connexion à la base de données...');
    
    // Import dynamique pour éviter les erreurs si Prisma n'est pas configuré
    const { PrismaClient } = require('@prisma/client');
    const prisma = new PrismaClient();
    
    await prisma.$connect();
    await prisma.$disconnect();
    
    log('green', '✅ Connexion à la base de données réussie');
    return true;
  } catch (error) {
    log('red', '❌ Erreur de connexion à la base de données');
    log('yellow', `💡 Erreur: ${error.message}`);
    
    if (error.message.includes('ECONNREFUSED')) {
      log('yellow', '💡 Vérifiez que PostgreSQL est démarré');
      log('yellow', '💡 Exécutez: docker-compose up -d postgres');
    }
    
    return false;
  }
}

function generateReport(results) {
  console.log('\n' + '='.repeat(60));
  console.log('📊 RAPPORT DE VALIDATION ENVIRONNEMENT');
  console.log('='.repeat(60));
  
  const totalChecks = Object.keys(results).length;
  const passedChecks = Object.values(results).filter(Boolean).length;
  
  console.log(`\n📈 Résultats: ${passedChecks}/${totalChecks} vérifications passées\n`);
  
  Object.entries(results).forEach(([check, passed]) => {
    const icon = passed ? '✅' : '❌';
    console.log(`${icon} ${check}`);
  });
  
  if (passedChecks === totalChecks) {
    log('green', '\n🎉 Environnement correctement configuré !');
    log('cyan', '💡 Vous pouvez démarrer l\'application avec: npm run dev');
  } else {
    log('yellow', '\n⚠️  Configuration incomplète');
    log('cyan', '💡 Consultez le guide: CONFIGURATION_GUIDE.md');
  }
  
  console.log(''); // Ligne vide finale
}

async function main() {
  console.log('🔍 Validation de l\'environnement Yesod...\n');
  
  // Charger les variables d'environnement depuis .env.local
  if (checkEnvFile()) {
    require('dotenv').config({ path: '.env.local' });
  }
  
  const results = {
    'Fichier .env.local': checkEnvFile(),
    'DATABASE_URL': validateDatabaseUrl(process.env.DATABASE_URL),
    'Configuration NextAuth': validateNextAuthConfig(),
    'Configuration Google OAuth': validateGoogleOAuth(),
  };
  
  // Test de connexion DB (si les variables sont valides)
  if (results['DATABASE_URL']) {
    results['Connexion base de données'] = await testDatabaseConnection();
  }
  
  generateReport(results);
}

// Gestion des erreurs
process.on('unhandledRejection', (error) => {
  log('red', `❌ Erreur non gérée: ${error.message}`);
  process.exit(1);
});

process.on('uncaughtException', (error) => {
  log('red', `❌ Exception non gérée: ${error.message}`);
  process.exit(1);
});

// Exécution
main().catch((error) => {
  log('red', `❌ Erreur lors de la validation: ${error.message}`);
  process.exit(1);
});