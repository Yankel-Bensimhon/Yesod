# Configuration de l'Authentification

## Problèmes Identifiés

### 1. Google OAuth "Server error"
**Erreur:** "There is a problem with the server configuration"

**Cause:** Variables d'environnement manquantes ou incorrectes pour Google OAuth.

**Solution:**
1. Créer un projet sur [Google Cloud Console](https://console.developers.google.com/)
2. Activer l'API Google+ ou Google OAuth
3. Créer des identifiants OAuth 2.0
4. Configurer les URIs autorisées:
   - **Origins autorisés:** `http://localhost:3000` (dev) et votre domaine de production
   - **URIs de redirection:** `http://localhost:3000/api/auth/callback/google`

### 2. Connexion/Inscription manuelle
**Problème:** Erreurs lors de la connexion avec email/mot de passe

**Causes possibles:**
- Base de données non configurée (Prisma)
- Variables d'environnement manquantes
- Schéma de base de données non appliqué

## Variables d'Environnement Requises

Créer un fichier `.env.local` avec:

```env
# Base de données PostgreSQL
DATABASE_URL="postgresql://username:password@localhost:5432/database_name"

# NextAuth - OBLIGATOIRE
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="votre-clé-secrète-très-longue-et-sécurisée-au-moins-32-caractères"

# Google OAuth - OBLIGATOIRE pour la connexion Google
GOOGLE_CLIENT_ID="votre-google-client-id.apps.googleusercontent.com"
GOOGLE_CLIENT_SECRET="votre-google-client-secret"
```

## Étapes de Configuration

1. **Copier le fichier d'exemple:**
   ```bash
   cp .env.example .env.local
   ```

2. **Configurer la base de données:**
   ```bash
   docker-compose up -d postgres
   npx prisma generate
   npx prisma db push
   ```

3. **Générer un secret NextAuth:**
   ```bash
   openssl rand -base64 32
   ```

4. **Tester la configuration:**
   ```bash
   npm run dev
   ```

## Vérification du Fonctionnement

- ✅ La page de connexion charge sans erreur
- ✅ Le bouton Google affiche la popup OAuth
- ✅ L'inscription manuelle crée un utilisateur
- ✅ La connexion manuelle fonctionne avec les bons identifiants

## Support

En cas de problème persistant:
1. Vérifier les logs dans la console du navigateur
2. Vérifier les logs du serveur Next.js
3. Tester avec `curl` les endpoints d'API
4. Vérifier la connectivité à la base de données