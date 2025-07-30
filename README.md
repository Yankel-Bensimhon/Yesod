# Yesod - Plateforme SaaS de Recouvrement de Créances

Cabinet Yesod est une plateforme SaaS moderne spécialisée dans le recouvrement amiable et judiciaire, développée spécifiquement pour les cabinets d'avocats d'affaires et leurs clients TPE/PME.

## 🎯 Fonctionnalités

### ✅ Fonctionnalités Implémentées

#### 🏠 Page d'Accueil Publique
- **Générateur de mise en demeure PDF** avec en-tête personnalisé du cabinet
- Formulaire complet pour créer des mises en demeure professionnelles
- Option d'envoi par email
- Design responsive et moderne
- Présentation des étapes du processus de recouvrement

#### 🔐 Système d'Authentification
- Connexion avec NextAuth (email/mot de passe + Google OAuth)
- Pages de connexion et inscription sécurisées
- Gestion des rôles (CLIENT, LAWYER, ADMIN)
- Interface utilisateur moderne et intuitive

#### 📊 Tableau de Bord Client
- Vue d'ensemble des dossiers personnels
- Statistiques détaillées (montants, statuts, échéances)
- Interface pour créer de nouveaux dossiers
- Suivi en temps réel de l'avancement des procédures

#### ⚖️ Backoffice Avocat
- Dashboard complet avec statistiques globales
- Gestion centralisée de tous les dossiers clients
- Filtres et recherche avancée
- Vision 360° de l'activité du cabinet
- Interface optimisée pour une gestion efficace

### 🚧 En Développement
- Système de messagerie sécurisée
- Génération automatique d'actes juridiques
- Gestion des échéances et notifications
- Module de facturation intégré

## 🛠 Technologies Utilisées

### Frontend
- **Next.js 15** avec App Router
- **TypeScript** pour la sécurité des types
- **TailwindCSS** pour le design
- **Lucide React** pour les icônes
- **NextAuth** pour l'authentification

### Backend
- **API Routes Next.js** 
- **Prisma ORM** avec PostgreSQL
- **pdf-lib** pour la génération de PDF
- **bcryptjs** pour le hashage des mots de passe

### Base de Données
- **PostgreSQL** avec modèles complets
- Schéma optimisé pour le recouvrement de créances
- Relations entre utilisateurs, dossiers, actions et documents

### Infrastructure
- **Docker Compose** pour le développement
- **Vercel** ready pour le déploiement
- Variables d'environnement sécurisées

## 🚀 Installation et Configuration

### Prérequis
- Node.js 18+ 
- Docker et Docker Compose
- npm ou yarn

### Installation Rapide

```bash
# Cloner le repository
git clone https://github.com/Yankel-Bensimhon/Yesod.git
cd Yesod

# Installation automatique (recommandé)
npm install
npm run setup

# OU installation manuelle
npm install
cp .env.example .env.local
# Éditer .env.local avec vos valeurs
docker-compose up -d postgres
npx prisma generate
npx prisma db push
npm run dev
```

### Scripts Disponibles

- `npm run setup` - Script de configuration automatique
- `npm run validate-env` - Valide votre configuration
- `npm run dev` - Démarre le serveur de développement
- `npm run build` - Build de production
- `npm run lint` - Vérification du code

### Guides de Configuration

📚 **Guides détaillés disponibles :**
- [Guide de Configuration Complète](./CONFIGURATION_GUIDE.md) - Configuration step-by-step
- [Configuration d'Authentification](./AUTHENTICATION_SETUP.md) - Setup NextAuth et OAuth

### Variables d'Environnement

```env
# Base de données
DATABASE_URL="postgresql://yesod:yesod_password@localhost:5432/yesod_db"

# NextAuth
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-nextauth-secret-key"

# OAuth Google (optionnel)
GOOGLE_CLIENT_ID="your-google-client-id"
GOOGLE_CLIENT_SECRET="your-google-client-secret"
```

## 📁 Structure du Projet

```
src/
├── app/                          # App Router Next.js
│   ├── api/                      # API Routes
│   │   ├── auth/                 # Authentification
│   │   ├── cases/                # Gestion des dossiers
│   │   └── generate-pdf/         # Génération PDF
│   ├── auth/                     # Pages d'authentification
│   ├── dashboard/                # Interface client
│   ├── backoffice/               # Interface avocat
│   └── globals.css               # Styles globaux
├── components/                   # Composants réutilisables
│   ├── ui/                       # Composants UI de base
│   ├── layout/                   # Navigation et layout
│   └── providers/                # Providers React
├── lib/                          # Utilitaires et configuration
└── types/                        # Types TypeScript

prisma/
└── schema.prisma                 # Schéma de base de données

docker-compose.yml                # Configuration Docker
```

## 🎨 Interface Utilisateur

### Design System
- **Couleurs principales** : Bleu professionnel (#2563eb) et nuances de gris
- **Typographie** : Système de polices moderne
- **Composants** : Basés sur Radix UI et TailwindCSS
- **Responsive** : Optimisé mobile-first

### Pages Principales
1. **Accueil** : Landing page avec générateur PDF
2. **Connexion/Inscription** : Formulaires sécurisés
3. **Dashboard Client** : Gestion personnelle des dossiers
4. **Backoffice Avocat** : Interface de gestion complète

## 🔒 Sécurité et Conformité

### Sécurité Implémentée
- Authentification sécurisée avec NextAuth
- Hashage des mots de passe avec bcryptjs
- Protection CSRF intégrée
- Validation des données côté client et serveur
- Gestion des rôles et permissions

### RGPD Ready
- Structure prête pour la gestion des consentements
- Modèles de données conformes
- Possibilité de suppression des comptes
- Logs d'accès et d'actions

## 📄 API Documentation

### Endpoints Principaux

#### Authentification
- `POST /api/auth/register` - Inscription
- `POST /api/auth/[...nextauth]` - NextAuth endpoints

#### Dossiers
- `GET /api/cases` - Liste des dossiers
- `POST /api/cases` - Créer un dossier
- `GET /api/cases/[id]` - Détails d'un dossier

#### PDF
- `POST /api/generate-pdf` - Générer une mise en demeure

## 🚀 Déploiement

### Vercel (Recommandé)
```bash
# Installer Vercel CLI
npm i -g vercel

# Déployer
vercel
```

### Docker Production
```bash
# Build de l'image
docker build -t yesod-app .

# Lancer avec Docker Compose
docker-compose up -d
```

## 🤝 Contribution

### Standards de Code
- TypeScript strict
- ESLint + Prettier
- Conventional Commits
- Tests unitaires (à venir)

### Workflow
1. Fork du repository
2. Créer une branche feature
3. Commit avec des messages clairs
4. Pull Request avec description détaillée

## 📧 Support

Pour toute question ou support :
- **Email** : contact@cabinet-yesod.fr
- **Issues** : GitHub Issues
- **Documentation** : Wiki du projet

## 📜 Licence

Ce projet est sous licence propriétaire. Tous droits réservés au Cabinet Yesod.

---

**Cabinet Yesod** - Recouvrement de Créances Professionnel & Efficace
# Trigger Vercel deployment
