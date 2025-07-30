# Configuration Supabase + Vercel - Guide Complet

## 🎯 Objectif
Ce guide vous aide à configurer correctement Supabase avec votre application Next.js et la déployer sur Vercel.

## 📋 Prérequis

1. **Compte Supabase** créé et projet configuré
2. **Compte Vercel** créé
3. **Projet Git** pushé sur GitHub/GitLab

## 🔧 Configuration Supabase

### 1. Récupérer les informations Supabase

Dans votre dashboard Supabase (https://app.supabase.com):
1. Allez dans **Settings > API**
2. Notez:
   - **Project URL**: `https://xiybcaxsjafmqyxbocyi.supabase.co`
   - **anon/public key**: Votre clé publique
   - **service_role key**: Votre clé privée (⚠️ SENSIBLE)

### 2. Récupérer la chaîne de connexion

Dans **Settings > Database**:
- **Connection String**: `postgresql://postgres:[PASSWORD]@db.xiybcaxsjafmqyxbocyi.supabase.co:5432/postgres`

### 3. Configurer vos variables d'environnement

Mettez à jour le fichier `.env`:

```bash
# Database - Supabase
DATABASE_URL="postgresql://postgres:FEWCyK5xQ5Hc!@S@db.xiybcaxsjafmqyxbocyi.supabase.co:5432/postgres"

# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL="https://xiybcaxsjafmqyxbocyi.supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="votre_anon_key_ici"
SUPABASE_SERVICE_ROLE_KEY="votre_service_role_key_ici"
```

## 🚀 Configuration Vercel

### 1. Installation et login

```bash
npm install -g vercel
vercel login
```

### 2. Lier votre projet

```bash
vercel link
```

### 3. Configurer les variables d'environnement

```bash
# Variables essentielles
vercel env add DATABASE_URL production
vercel env add NEXTAUTH_SECRET production
vercel env add NEXTAUTH_URL production

# Variables Supabase
vercel env add NEXT_PUBLIC_SUPABASE_URL production
vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY production
vercel env add SUPABASE_SERVICE_ROLE_KEY production

# Variables OAuth
vercel env add GOOGLE_CLIENT_ID production
vercel env add GOOGLE_CLIENT_SECRET production
```

### 4. Déployer

```bash
npm run vercel:deploy
# ou
vercel --prod
```

## 🔄 Workflow de développement

### 1. Développement local

```bash
# Démarrer le serveur de développement
npm run dev

# Tester la connexion Supabase
npm run supabase:setup
```

### 2. Synchroniser le schéma

```bash
# Pousser le schéma Prisma vers Supabase
npm run db:push
```

### 3. Déploiement

```bash
# Déploiement automatique
npm run vercel:deploy
```

## 📚 Utilisation dans le code

### Approche hybride (recommandée)

```typescript
import { prisma, sql } from '@/lib/database'

// Opérations complexes avec Prisma
const users = await prisma.user.findMany({
  include: { profile: true }
})

// Requêtes optimisées avec postgres direct
const stats = await sql`
  SELECT COUNT(*) as total FROM "User"
`
```

### Import direct Supabase

```typescript
import sql from '@/lib/supabase'

const result = await sql`SELECT * FROM "User" LIMIT 10`
```

## 🔍 Dépannage

### Erreur de connexion
1. Vérifiez vos variables d'environnement
2. Testez avec: `npm run supabase:setup`
3. Vérifiez les logs Vercel

### Problème de déploiement
1. Vérifiez que toutes les variables sont configurées dans Vercel
2. Assurez-vous que le build passe localement
3. Consultez les logs de déploiement Vercel

### Erreur Prisma
1. Exécutez `prisma generate`
2. Vérifiez que le schéma est synchronisé: `npm run db:push`

## 📝 Checklist de déploiement

- [ ] Variables d'environnement Supabase configurées
- [ ] Variables d'environnement Vercel configurées
- [ ] Schéma de base de données synchronisé
- [ ] Tests locaux passent
- [ ] Build local réussi
- [ ] Domaine configuré dans Vercel
- [ ] URLs de redirection OAuth mises à jour

## 🎉 Prochaines étapes

1. Configurer un domaine personnalisé
2. Mettre en place la surveillance (Sentry)
3. Configurer Redis pour le cache
4. Optimiser les performances

---

**Support**: En cas de problème, consultez les logs Vercel et Supabase pour plus de détails.
