# 🚨 Guide de Dépannage Vercel - Connexion Backoffice

## ❌ Problème Identifié
Erreur serveur lors de l'accès au backoffice : "There is a problem with the server configuration."

## 🔍 Causes Possibles

### 1. Variables d'Environnement Manquantes sur Vercel
Les variables d'environnement configurées localement ne sont **PAS** automatiquement transférées sur Vercel.

### 2. NEXTAUTH_URL Incorrecte
L'URL doit correspondre au domaine Vercel de production.

### 3. Base de Données Non Accessible
La base de données locale (`localhost:5432`) n'est pas accessible depuis Vercel.

## ✅ Solutions Immédiates

### Étape 1: Configurer les Variables d'Environnement sur Vercel

**Dans le Dashboard Vercel :**
1. Allez dans `Settings` > `Environment Variables`
2. Ajoutez les variables suivantes :

```bash
# Base de données (CRITIQUE - à configurer avec votre DB de production)
DATABASE_URL=postgresql://username:password@your-production-db-host:5432/database_name

# NextAuth (CRITIQUE - remplacer par votre domaine Vercel)
NEXTAUTH_URL=https://your-app-name.vercel.app
NEXTAUTH_SECRET=hCn8DfUOWSRslEtzEqJ1+xKClV6Zb4BZm3BfcNF375c=

# Google OAuth (optionnel mais recommandé)
GOOGLE_CLIENT_ID=991008648507-ge4mgcq11iint2era3o0gd4rh3bk9aa4.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=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

# Environment
NODE_ENV=production
```

### Étape 2: Base de Données de Production

**Options recommandées :**

1. **Supabase (Gratuit)** :
   ```bash
   DATABASE_URL=postgresql://postgres:password@db.xyz.supabase.co:5432/postgres
   ```

2. **Neon (Gratuit)** :
   ```bash
   DATABASE_URL=postgresql://username:password@ep-xyz.us-east-1.aws.neon.tech/neondb
   ```

3. **Railway (Gratuit)** :
   ```bash
   DATABASE_URL=postgresql://postgres:password@containers-us-west-xyz.railway.app:5432/railway
   ```

### Étape 3: Mettre à Jour Google OAuth

**Dans Google Cloud Console :**
1. Allez dans `APIs & Services` > `Credentials`
2. Éditez vos OAuth 2.0 Client IDs
3. Ajoutez vos URLs Vercel dans "Authorized redirect URIs" :
   ```
   https://your-app-name.vercel.app/api/auth/callback/google
   ```

### Étape 4: Redéployer

Après avoir configuré les variables d'environnement :
1. Allez dans l'onglet `Deployments`
2. Cliquez sur `Redeploy` sur le dernier déploiement
3. Cochez "Use existing Build Cache" puis `Redeploy`

## 🔧 Diagnostic Rapide

### Test 1: Vérifier les Variables d'Environnement
Accédez à : `https://your-app.vercel.app/api/health`

Si cela fonctionne, les variables de base sont OK.

### Test 2: Vérifier NextAuth
Accédez à : `https://your-app.vercel.app/api/auth/signin`

Si vous obtenez une page de connexion, NextAuth fonctionne.

### Test 3: Vérifier la Base de Données
Créez un endpoint de test temporaire :

```typescript
// src/app/api/test-db/route.ts
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    await prisma.$connect()
    return NextResponse.json({ status: 'Database connected' })
  } catch (error) {
    return NextResponse.json({ error: 'Database connection failed', details: error.message }, { status: 500 })
  }
}
```

## 🆘 Si le Problème Persiste

1. **Vérifiez les logs Vercel** : `Functions` tab dans votre dashboard
2. **Vérifiez les logs en temps réel** : `View Function Logs`
3. **Redéployez complètement** : Push un nouveau commit

## 📞 Actions Immédiates Recommandées

1. **Configurez une base de données de production** (Supabase/Neon)
2. **Ajoutez toutes les variables d'environnement sur Vercel**
3. **Mettez à jour NEXTAUTH_URL avec votre domaine Vercel**
4. **Redéployez l'application**

## ⚡ Solution Rapide (5 minutes)

Si vous voulez tester rapidement :

1. Créez un compte Supabase (gratuit)
2. Créez un nouveau projet
3. Copiez la `DATABASE_URL` de Supabase
4. Ajoutez-la dans les variables d'environnement Vercel
5. Redéployez

**C'est la solution la plus rapide pour résoudre le problème !**
