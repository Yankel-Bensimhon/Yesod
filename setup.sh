#!/bin/bash

# 🔧 Script de Configuration Automatique Yesod
# Ce script aide à configurer rapidement l'environnement de développement

set -e

echo "🚀 Configuration de Yesod - Plateforme SaaS de Recouvrement"
echo "============================================================="

# Couleurs pour l'affichage
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Fonction pour afficher les messages
print_step() {
    echo -e "${BLUE}[ÉTAPE]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCÈS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[ATTENTION]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERREUR]${NC} $1"
}

# Vérification des prérequis
print_step "Vérification des prérequis..."

# Vérifier Node.js
if ! command -v node &> /dev/null; then
    print_error "Node.js n'est pas installé. Veuillez l'installer depuis https://nodejs.org/"
    exit 1
fi

NODE_VERSION=$(node --version | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    print_error "Node.js version 18+ requise. Version actuelle: $(node --version)"
    exit 1
fi

print_success "Node.js $(node --version) ✓"

# Vérifier npm
if ! command -v npm &> /dev/null; then
    print_error "npm n'est pas installé."
    exit 1
fi

print_success "npm $(npm --version) ✓"

# Vérifier Docker
if ! command -v docker &> /dev/null; then
    print_warning "Docker n'est pas installé. Certaines fonctionnalités seront limitées."
    DOCKER_AVAILABLE=false
else
    print_success "Docker $(docker --version | cut -d' ' -f3 | cut -d',' -f1) ✓"
    DOCKER_AVAILABLE=true
fi

# Vérifier Docker Compose
if ! command -v docker-compose &> /dev/null && ! command -v docker compose &> /dev/null; then
    if [ "$DOCKER_AVAILABLE" = true ]; then
        print_warning "Docker Compose n'est pas disponible."
    fi
    DOCKER_COMPOSE_AVAILABLE=false
else
    print_success "Docker Compose ✓"
    DOCKER_COMPOSE_AVAILABLE=true
fi

echo ""

# Installation des dépendances
print_step "Installation des dépendances npm..."
npm install
print_success "Dépendances installées ✓"

echo ""

# Configuration des variables d'environnement
print_step "Configuration des variables d'environnement..."

if [ ! -f ".env.local" ]; then
    if [ -f ".env.example" ]; then
        cp .env.example .env.local
        print_success "Fichier .env.local créé depuis .env.example ✓"
    else
        print_error "Fichier .env.example non trouvé."
        exit 1
    fi
else
    print_warning "Le fichier .env.local existe déjà. Sauvegarde en .env.local.backup"
    cp .env.local .env.local.backup
fi

echo ""

# Génération de la clé secrète NextAuth
print_step "Génération de la clé secrète NextAuth..."

if command -v openssl &> /dev/null; then
    NEXTAUTH_SECRET=$(openssl rand -base64 32)
    
    # Remplacer la clé dans .env.local
    if [[ "$OSTYPE" == "darwin"* ]]; then
        # macOS
        sed -i '' "s/NEXTAUTH_SECRET=\"your-nextauth-secret-key\"/NEXTAUTH_SECRET=\"$NEXTAUTH_SECRET\"/" .env.local
    else
        # Linux
        sed -i "s/NEXTAUTH_SECRET=\"your-nextauth-secret-key\"/NEXTAUTH_SECRET=\"$NEXTAUTH_SECRET\"/" .env.local
    fi
    
    print_success "Clé secrète NextAuth générée et configurée ✓"
else
    print_warning "OpenSSL non disponible. Veuillez configurer manuellement NEXTAUTH_SECRET dans .env.local"
fi

echo ""

# Configuration de la base de données
if [ "$DOCKER_COMPOSE_AVAILABLE" = true ]; then
    print_step "Configuration de la base de données PostgreSQL..."
    
    read -p "Souhaitez-vous démarrer PostgreSQL avec Docker? (y/N): " -n 1 -r
    echo ""
    
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        print_step "Démarrage de PostgreSQL avec Docker Compose..."
        docker-compose up -d postgres
        
        # Attendre que PostgreSQL soit prêt
        print_step "Attente du démarrage de PostgreSQL..."
        sleep 10
        
        print_success "PostgreSQL démarré ✓"
    else
        print_warning "Veuillez configurer manuellement DATABASE_URL dans .env.local"
    fi
else
    print_warning "Docker Compose non disponible. Veuillez configurer manuellement la base de données."
fi

echo ""

# Configuration de Prisma
print_step "Configuration de Prisma..."

# Générer le client Prisma
npx prisma generate
print_success "Client Prisma généré ✓"

# Appliquer le schéma (si la base de données est disponible)
if [ "$DOCKER_COMPOSE_AVAILABLE" = true ] && [[ $REPLY =~ ^[Yy]$ ]]; then
    print_step "Application du schéma de base de données..."
    
    # Attendre un peu plus pour s'assurer que PostgreSQL est complètement prêt
    sleep 5
    
    if npx prisma db push 2>/dev/null; then
        print_success "Schéma de base de données appliqué ✓"
    else
        print_warning "Erreur lors de l'application du schéma. Vérifiez la connexion à la base de données."
    fi
fi

echo ""

# Test de la configuration
print_step "Test de la configuration..."

# Vérifier que l'application peut démarrer
print_step "Vérification du build de l'application..."
if timeout 30 npm run build 2>/dev/null; then
    print_success "Build de l'application réussi ✓"
else
    print_warning "Le build a échoué ou a pris trop de temps. Vérifiez les erreurs manuellement."
fi

echo ""
echo "🎉 Configuration terminée !"
echo "=========================="
echo ""
echo "📝 Prochaines étapes :"
echo "1. Vérifiez le fichier .env.local et ajustez les valeurs si nécessaire"
echo "2. Pour Google OAuth, configurez GOOGLE_CLIENT_ID et GOOGLE_CLIENT_SECRET"
echo "3. Démarrez l'application avec: npm run dev"
echo "4. Accédez à http://localhost:3000"
echo ""
echo "📚 Guides disponibles :"
echo "- Configuration détaillée : CONFIGURATION_GUIDE.md"
echo "- Setup d'authentification : AUTHENTICATION_SETUP.md"
echo ""
echo "🔐 Compte admin temporaire :"
echo "- Email: YAdmin"
echo "- Mot de passe: AZEqsd1234#"
echo ""

read -p "Souhaitez-vous démarrer l'application maintenant? (y/N): " -n 1 -r
echo ""

if [[ $REPLY =~ ^[Yy]$ ]]; then
    print_step "Démarrage de l'application..."
    npm run dev
fi