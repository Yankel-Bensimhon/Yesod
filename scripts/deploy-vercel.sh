#!/bin/bash

echo "🚀 Déploiement Vercel avec Supabase..."

# Vérifier que Vercel CLI est installé
if ! command -v vercel &> /dev/null; then
    echo "📦 Installation de Vercel CLI..."
    npm install -g vercel
fi

# Login Vercel (si nécessaire)
echo "🔐 Vérification de l'authentification Vercel..."
vercel whoami || vercel login

# Configurer les variables d'environnement Vercel
echo "⚙️ Configuration des variables d'environnement..."

# Variables de base
vercel env add DATABASE_URL production
vercel env add NEXTAUTH_SECRET production
vercel env add NEXTAUTH_URL production
vercel env add GOOGLE_CLIENT_ID production
vercel env add GOOGLE_CLIENT_SECRET production

# Variables Supabase
vercel env add NEXT_PUBLIC_SUPABASE_URL production
vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY production
vercel env add SUPABASE_SERVICE_ROLE_KEY production

# Variables optionnelles
vercel env add UPSTASH_REDIS_REST_URL production
vercel env add UPSTASH_REDIS_REST_TOKEN production
vercel env add NEXT_PUBLIC_SENTRY_DSN production

echo "✅ Variables d'environnement configurées"

# Déploiement
echo "🚀 Déploiement en cours..."
vercel --prod

echo "🎉 Déploiement terminé !"
echo "📋 N'oubliez pas de:"
echo "   1. Configurer votre domaine custom dans Vercel"
echo "   2. Mettre à jour NEXTAUTH_URL avec votre domaine"
echo "   3. Configurer les redirections OAuth avec votre nouveau domaine"
