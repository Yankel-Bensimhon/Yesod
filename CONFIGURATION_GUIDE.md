# 🔧 Guide de Configuration Yesod - Pas à Pas

Ce guide vous accompagne dans la configuration complète de la plateforme Yesod depuis zéro.

## 📋 Prérequis

Avant de commencer, assurez-vous d'avoir installé :
- **Node.js 18+** : [Télécharger Node.js](https://nodejs.org/)
- **Docker & Docker Compose** : [Installer Docker](https://docs.docker.com/get-docker/)
- **Git** : [Installer Git](https://git-scm.com/downloads)

## 🚀 Étape 1 : Installation du Projet

### 1.1 Cloner le Repository
```bash
git clone https://github.com/Yankel-Bensimhon/Yesod.git
cd Yesod
```

### 1.2 Installer les Dépendances
```bash
npm install
```

## 🔐 Étape 2 : Configuration des Variables d'Environnement

### 2.1 Créer le Fichier d'Environnement
```bash
cp .env.example .env.local
```

### 2.2 Configurer la Base de Données

#### Option A : Base de Données Locale avec Docker (Recommandé)
```bash
# Démarrer PostgreSQL avec Docker
docker-compose up -d postgres
```

Votre `DATABASE_URL` dans `.env.local` :
```env
DATABASE_URL="postgresql://yesod:yesod_password@localhost:5432/yesod_db"
```

#### Option B : Base de Données Externe
Si vous avez une base PostgreSQL externe, modifiez l'URL :
```env
DATABASE_URL="postgresql://username:password@host:port/database_name"
```

### 2.3 Configurer NextAuth

#### Générer une Clé Secrète Sécurisée
```bash
# Sur macOS/Linux
openssl rand -base64 32

# Sur Windows (PowerShell)
[System.Convert]::ToBase64String([System.Security.Cryptography.RandomNumberGenerator]::GetBytes(32))
```

#### Configurer dans .env.local
```env
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="votre-clé-générée-ci-dessus"
```

### 2.4 Configurer Google OAuth (Optionnel)

#### Créer un Projet Google Cloud
1. Allez sur [Google Cloud Console](https://console.developers.google.com/)
2. Créez un nouveau projet ou sélectionnez-en un existant
3. Activez l'API "Google+ API" ou "Google OAuth2 API"

#### Créer des Identifiants OAuth 2.0
1. Dans "APIs & Services" > "Credentials"
2. Cliquez "Create Credentials" > "OAuth 2.0 Client IDs"
3. Type d'application : "Web application"
4. **Origines autorisées** :
   - `http://localhost:3000` (pour le développement)
   - `https://votre-domaine.com` (pour la production)
5. **URIs de redirection autorisés** :
   - `http://localhost:3000/api/auth/callback/google`
   - `https://votre-domaine.com/api/auth/callback/google`

#### Configurer dans .env.local
```env
GOOGLE_CLIENT_ID="votre-client-id.apps.googleusercontent.com"
GOOGLE_CLIENT_SECRET="votre-client-secret"
```

## 🗄️ Étape 3 : Configuration de la Base de Données

### 3.1 Générer le Client Prisma
```bash
npx prisma generate
```

### 3.2 Appliquer le Schéma à la Base de Données
```bash
npx prisma db push
```

### 3.3 Vérifier la Connexion (Optionnel)
```bash
npx prisma studio
```
Cela ouvre un interface web pour explorer votre base de données.

## 🧪 Étape 4 : Test de la Configuration

### 4.1 Démarrer le Serveur de Développement
```bash
npm run dev
```

### 4.2 Vérifications à Effectuer

#### ✅ Base de Données
- [ ] L'application démarre sans erreur de connexion DB
- [ ] Aucun message d'erreur Prisma dans les logs

#### ✅ Authentification
- [ ] Page de connexion accessible : http://localhost:3000/auth/signin
- [ ] Bouton "Connexion avec Google" visible (si configuré)
- [ ] Connexion avec admin temporaire fonctionne :
  - Email : `YAdmin`
  - Mot de passe : `AZEqsd1234#`

#### ✅ Pages Principales
- [ ] Page d'accueil : http://localhost:3000
- [ ] Dashboard client : http://localhost:3000/dashboard
- [ ] Backoffice avocat : http://localhost:3000/backoffice

## 🚨 Résolution des Problèmes Courants

### Problème : "Prisma Client not found"
```bash
npx prisma generate
npm run dev
```

### Problème : "Database connection failed"
1. Vérifiez que PostgreSQL est démarré :
   ```bash
   docker-compose ps
   ```
2. Vérifiez votre `DATABASE_URL` dans `.env.local`
3. Testez la connexion :
   ```bash
   npx prisma db push
   ```

### Problème : "Google OAuth Server Error"
1. Vérifiez vos `GOOGLE_CLIENT_ID` et `GOOGLE_CLIENT_SECRET`
2. Vérifiez les URIs de redirection dans Google Cloud Console
3. Assurez-vous que l'API Google+ est activée

### Problème : "NextAuth Configuration Error"
1. Vérifiez que `NEXTAUTH_SECRET` est défini et suffisamment long
2. Vérifiez que `NEXTAUTH_URL` correspond à votre URL locale/de production

## 📁 Structure des Fichiers de Configuration

```
Yesod/
├── .env.example           # Template des variables d'environnement
├── .env.local            # Vos variables d'environnement (non versionné)
├── docker-compose.yml    # Configuration Docker
├── prisma/
│   └── schema.prisma     # Schéma de base de données
└── src/
    └── app/api/auth/
        └── [...nextauth]/
            └── route.ts  # Configuration NextAuth
```

## 🎯 Configuration pour la Production

### Variables d'Environnement Production
```env
NODE_ENV="production"
NEXTAUTH_URL="https://votre-domaine.com"
DATABASE_URL="postgresql://user:password@host:port/db"
NEXTAUTH_SECRET="clé-super-sécurisée-en-production"
```

### Déploiement Vercel
1. Connectez votre repo GitHub à Vercel
2. Ajoutez les variables d'environnement dans les settings Vercel
3. Déployez automatiquement

## 📞 Support

En cas de problème :
1. Consultez les logs de l'application
2. Vérifiez les logs Docker : `docker-compose logs postgres`
3. Consultez la [documentation NextAuth](https://next-auth.js.org/)
4. Consultez la [documentation Prisma](https://www.prisma.io/docs/)

---

**✨ Félicitations !** Votre plateforme Yesod est maintenant configurée et prête à l'emploi.