#!/bin/bash

# Script de configuration Supabase
echo "🔧 Configuration de Supabase..."

# Vérifier que les variables d'environnement sont définies
if [ -z "$DATABASE_URL" ]; then
    echo "❌ DATABASE_URL non définie dans .env"
    exit 1
fi

echo "✅ DATABASE_URL configurée"

# Générer le schéma Prisma vers Supabase
echo "📊 Génération du schéma Prisma..."
npx prisma db push

# Vérifier la connexion à la base de données
echo "🔍 Test de connexion à Supabase..."
node -e "
const { sql } = require('./src/lib/database.ts');
sql\`SELECT NOW() as current_time\`.then(result => {
    console.log('✅ Connexion Supabase réussie:', result[0].current_time);
    process.exit(0);
}).catch(err => {
    console.error('❌ Erreur de connexion Supabase:', err.message);
    process.exit(1);
});
"

echo "🎉 Configuration Supabase terminée !"
