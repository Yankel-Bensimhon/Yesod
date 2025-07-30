#!/bin/bash

echo "🔧 Configuration complète Supabase + Vercel"
echo "=========================================="

# Étape 1: Vérifier la configuration Supabase
echo ""
echo "📋 ÉTAPE 1: Informations Supabase nécessaires"
echo "----------------------------------------------"
echo "Allez sur https://app.supabase.com/project/xiybcaxsjafmqyxbocyi/settings/api"
echo ""
echo "Récupérez ces informations:"
echo "  ✓ Project URL: https://xiybcaxsjafmqyxbocyi.supabase.co"
echo "  ✓ anon/public key (commençant par eyJhbGciOiJIUzI1NiI...)"
echo "  ✓ service_role key (commençant par eyJhbGciOiJIUzI1NiI...)"
echo ""

# Étape 2: Configuration de la base de données
echo "📋 ÉTAPE 2: Configuration de la base de données"
echo "------------------------------------------------"
echo "Allez sur https://app.supabase.com/project/xiybcaxsjafmqyxbocyi/settings/database"
echo ""
echo "Récupérez la chaîne de connexion complète."
echo "⚠️  Important: Utilisez la chaîne POOLER (connection pooling) si disponible"
echo ""

# Étape 3: Configuration des variables d'environnement
echo "📋 ÉTAPE 3: Configuration locale"
echo "---------------------------------"

# Créer un fichier .env.example avec les bonnes variables
cat > .env.example << 'EOF'
# Database - Supabase
# Remplacez par votre vraie chaîne de connexion depuis le dashboard Supabase
DATABASE_URL="postgresql://postgres:YOUR_PASSWORD@db.YOUR_PROJECT_REF.supabase.co:5432/postgres"

# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL="https://YOUR_PROJECT_REF.supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="YOUR_ANON_KEY_HERE"
SUPABASE_SERVICE_ROLE_KEY="YOUR_SERVICE_ROLE_KEY_HERE"

# NextAuth
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="hCn8DfUOWSRslEtzEqJ1+xKClV6Zb4BZm3BfcNF375c="

# Node Environment
NODE_ENV="development"

# Google OAuth
GOOGLE_CLIENT_ID="991008648507-ge4mgcq11iint2era3o0gd4rh3bk9aa4.apps.googleusercontent.com"
GOOGLE_CLIENT_SECRET="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"
GOOGLE_PROJECT_ID="yesod-467310"
EOF

echo "✅ Fichier .env.example créé"
echo ""

# Étape 4: Instructions pour Vercel
echo "📋 ÉTAPE 4: Configuration Vercel"
echo "--------------------------------"
echo "1. Installez Vercel CLI: npm install -g vercel"
echo "2. Connectez-vous: vercel login"
echo "3. Liez votre projet: vercel link"
echo "4. Ajoutez les variables d'environnement:"
echo ""
echo "   vercel env add DATABASE_URL production"
echo "   vercel env add NEXT_PUBLIC_SUPABASE_URL production"
echo "   vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY production"
echo "   vercel env add SUPABASE_SERVICE_ROLE_KEY production"
echo "   vercel env add NEXTAUTH_SECRET production"
echo "   vercel env add NEXTAUTH_URL production"
echo "   vercel env add GOOGLE_CLIENT_ID production"
echo "   vercel env add GOOGLE_CLIENT_SECRET production"
echo ""
echo "5. Déployez: vercel --prod"
echo ""

# Étape 5: Test local
echo "📋 ÉTAPE 5: Test de votre configuration"
echo "---------------------------------------"
echo "Une fois vos variables configurées dans .env:"
echo "  npm run db:push    # Synchronise le schéma"
echo "  npm run dev        # Lance le serveur local"
echo ""

# Créer un script de test simple
cat > test-supabase-simple.js << 'EOF'
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
EOF

echo "📄 Fichiers créés:"
echo "   ✓ .env.example (modèle de configuration)"
echo "   ✓ test-supabase-simple.js (test de connexion)"
echo ""

echo "🎯 PROCHAINES ÉTAPES:"
echo "1. Copiez .env.example vers .env"
echo "2. Remplacez les valeurs par celles de votre dashboard Supabase"
echo "3. Testez avec: npm run db:push"
echo "4. Si ça marche, configurez Vercel avec les mêmes valeurs"
echo ""
echo "📚 Documentation complète: ./SUPABASE_VERCEL_SETUP.md"
