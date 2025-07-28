#!/bin/bash

# 🚀 Script de Démarrage Rapide Yesod
# Ce script configure rapidement l'environnement sans dépendances externes

set -e

echo "🚀 Démarrage Rapide Yesod"
echo "========================="

# Couleurs
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

print_step() {
    echo -e "${BLUE}[ÉTAPE]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCÈS]${NC} $1"
}

print_info() {
    echo -e "${YELLOW}[INFO]${NC} $1"
}

# 1. Créer .env.local si nécessaire
print_step "Configuration des variables d'environnement..."

if [ ! -f ".env.local" ]; then
    cp .env.example .env.local
    print_success "Fichier .env.local créé ✓"
else
    print_info ".env.local existe déjà"
fi

# 2. Générer une clé secrète NextAuth
print_step "Génération de la clé secrète NextAuth..."

if command -v openssl &> /dev/null; then
    NEXTAUTH_SECRET=$(openssl rand -base64 32)
    
    # Remplacer dans .env.local
    if [[ "$OSTYPE" == "darwin"* ]]; then
        sed -i '' "s/NEXTAUTH_SECRET=\"your-nextauth-secret-key\"/NEXTAUTH_SECRET=\"$NEXTAUTH_SECRET\"/" .env.local
    else
        sed -i "s/NEXTAUTH_SECRET=\"your-nextauth-secret-key\"/NEXTAUTH_SECRET=\"$NEXTAUTH_SECRET\"/" .env.local
    fi
    
    print_success "Clé secrète générée et configurée ✓"
else
    print_info "OpenSSL non disponible - configurez manuellement NEXTAUTH_SECRET"
fi

# 3. Instructions pour la suite
echo ""
echo "✅ Configuration de base terminée !"
echo ""
echo "📝 Prochaines étapes :"
echo "1. Configurez votre base de données dans .env.local"
echo "2. Pour Google OAuth, ajoutez GOOGLE_CLIENT_ID et GOOGLE_CLIENT_SECRET"
echo "3. Démarrez PostgreSQL: docker-compose up -d postgres"
echo "4. Générez Prisma: npx prisma generate"
echo "5. Appliquez le schéma: npx prisma db push"
echo "6. Démarrez l'app: npm run dev"
echo ""
echo "📚 Pour un guide complet: consultez CONFIGURATION_GUIDE.md"
echo ""

# Proposer de démarrer immédiatement si possible
read -p "Voulez-vous essayer de démarrer l'application maintenant? (y/N): " -n 1 -r
echo ""

if [[ $REPLY =~ ^[Yy]$ ]]; then
    print_step "Tentative de démarrage..."
    npm run dev
fi