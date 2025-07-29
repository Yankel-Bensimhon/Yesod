#!/bin/bash

# 🗄️ Script de Backup Automatisé Yesod CRM
# Phase 1 - Fondations

set -euo pipefail

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BACKUP_DIR="${SCRIPT_DIR}/backups"
DATE=$(date +"%Y%m%d_%H%M%S")
RETENTION_DAYS=30

# Couleurs pour les logs
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Fonctions utilitaires
log_info() {
    echo -e "${BLUE}ℹ️  [INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}✅ [SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}⚠️  [WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}❌ [ERROR]${NC} $1"
}

# Vérification des prérequis
check_requirements() {
    log_info "Vérification des prérequis..."
    
    # Vérifier que Docker est en cours d'exécution
    if ! docker ps >/dev/null 2>&1; then
        log_error "Docker n'est pas accessible. Assurez-vous que Docker est démarré."
        exit 1
    fi
    
    # Vérifier que pg_dump est disponible
    if ! command -v pg_dump >/dev/null 2>&1; then
        log_warning "pg_dump non trouvé. Installation de postgresql-client..."
        if command -v apt-get >/dev/null 2>&1; then
            sudo apt-get update && sudo apt-get install -y postgresql-client
        elif command -v yum >/dev/null 2>&1; then
            sudo yum install -y postgresql
        else
            log_error "Impossible d'installer postgresql-client automatiquement."
            exit 1
        fi
    fi
    
    log_success "Prérequis vérifiés"
}

# Création du répertoire de backup
create_backup_dir() {
    log_info "Création du répertoire de backup..."
    mkdir -p "${BACKUP_DIR}"
    log_success "Répertoire de backup créé: ${BACKUP_DIR}"
}

# Backup de la base de données
backup_database() {
    log_info "Démarrage du backup de la base de données..."
    
    # Charger les variables d'environnement
    if [[ -f "${SCRIPT_DIR}/.env.local" ]]; then
        export $(grep -v '^#' "${SCRIPT_DIR}/.env.local" | xargs)
    fi
    
    # Vérifier que DATABASE_URL est définie
    if [[ -z "${DATABASE_URL:-}" ]]; then
        log_error "DATABASE_URL non définie. Vérifiez votre fichier .env.local"
        exit 1
    fi
    
    # Parser l'URL de la base de données
    # postgresql://user:password@host:port/database
    DB_USER=$(echo "$DATABASE_URL" | sed -n 's|postgresql://\([^:]*\):.*|\1|p')
    DB_PASSWORD=$(echo "$DATABASE_URL" | sed -n 's|postgresql://[^:]*:\([^@]*\)@.*|\1|p')
    DB_HOST=$(echo "$DATABASE_URL" | sed -n 's|postgresql://[^@]*@\([^:]*\):.*|\1|p')
    DB_PORT=$(echo "$DATABASE_URL" | sed -n 's|postgresql://[^@]*@[^:]*:\([^/]*\)/.*|\1|p')
    DB_NAME=$(echo "$DATABASE_URL" | sed -n 's|postgresql://[^/]*/\(.*\)|\1|p')
    
    BACKUP_FILE="${BACKUP_DIR}/yesod_backup_${DATE}.sql"
    
    log_info "Connexion à la base de données ${DB_NAME} sur ${DB_HOST}:${DB_PORT}..."
    
    # Créer le backup avec pg_dump
    PGPASSWORD="$DB_PASSWORD" pg_dump \
        -h "$DB_HOST" \
        -p "$DB_PORT" \
        -U "$DB_USER" \
        -d "$DB_NAME" \
        --no-password \
        --verbose \
        --clean \
        --create \
        --if-exists \
        --format=plain \
        --file="$BACKUP_FILE"
    
    if [[ $? -eq 0 ]]; then
        # Compresser le backup
        gzip "$BACKUP_FILE"
        BACKUP_FILE="${BACKUP_FILE}.gz"
        
        # Calculer la taille du fichier
        BACKUP_SIZE=$(du -h "$BACKUP_FILE" | cut -f1)
        
        log_success "Backup créé avec succès: $BACKUP_FILE (${BACKUP_SIZE})"
    else
        log_error "Échec du backup de la base de données"
        exit 1
    fi
}

# Backup des fichiers de configuration
backup_config() {
    log_info "Backup des fichiers de configuration..."
    
    CONFIG_BACKUP="${BACKUP_DIR}/config_backup_${DATE}.tar.gz"
    
    # Créer une archive des fichiers importants
    tar -czf "$CONFIG_BACKUP" \
        --exclude=node_modules \
        --exclude=.next \
        --exclude=.git \
        --exclude=backups \
        -C "$SCRIPT_DIR" \
        prisma/ \
        src/ \
        package.json \
        package-lock.json \
        next.config.ts \
        tsconfig.json \
        tailwind.config.ts \
        postcss.config.mjs \
        jest.config.js \
        jest.setup.js \
        .env.example \
        docker-compose.yml \
        Dockerfile \
        README.md
    
    if [[ $? -eq 0 ]]; then
        CONFIG_SIZE=$(du -h "$CONFIG_BACKUP" | cut -f1)
        log_success "Backup de configuration créé: $CONFIG_BACKUP (${CONFIG_SIZE})"
    else
        log_error "Échec du backup de configuration"
        exit 1
    fi
}

# Nettoyage des anciens backups
cleanup_old_backups() {
    log_info "Nettoyage des backups anciens (> ${RETENTION_DAYS} jours)..."
    
    DELETED_COUNT=0
    
    # Supprimer les fichiers SQL anciens
    while IFS= read -r -d '' file; do
        rm "$file"
        ((DELETED_COUNT++))
        log_info "Supprimé: $(basename "$file")"
    done < <(find "$BACKUP_DIR" -name "*.sql.gz" -type f -mtime +$RETENTION_DAYS -print0 2>/dev/null || true)
    
    # Supprimer les fichiers de config anciens
    while IFS= read -r -d '' file; do
        rm "$file"
        ((DELETED_COUNT++))
        log_info "Supprimé: $(basename "$file")"
    done < <(find "$BACKUP_DIR" -name "config_backup_*.tar.gz" -type f -mtime +$RETENTION_DAYS -print0 2>/dev/null || true)
    
    if [[ $DELETED_COUNT -gt 0 ]]; then
        log_success "Nettoyage terminé: $DELETED_COUNT fichiers supprimés"
    else
        log_info "Aucun fichier ancien à supprimer"
    fi
}

# Upload vers le cloud (optionnel)
upload_to_cloud() {
    if [[ -n "${AWS_S3_BUCKET:-}" ]] && command -v aws >/dev/null 2>&1; then
        log_info "Upload vers AWS S3..."
        
        # Upload du backup DB
        aws s3 cp "${BACKUP_DIR}/yesod_backup_${DATE}.sql.gz" \
            "s3://${AWS_S3_BUCKET}/backups/database/" \
            --storage-class STANDARD_IA
        
        # Upload du backup config
        aws s3 cp "${BACKUP_DIR}/config_backup_${DATE}.tar.gz" \
            "s3://${AWS_S3_BUCKET}/backups/config/"
        
        log_success "Backups uploadés vers S3"
    else
        log_warning "AWS CLI non configuré ou S3_BUCKET non défini. Skip upload cloud."
    fi
}

# Fonction principale
main() {
    log_info "🚀 Démarrage du backup Yesod CRM - $(date)"
    
    check_requirements
    create_backup_dir
    backup_database
    backup_config
    cleanup_old_backups
    upload_to_cloud
    
    log_success "🎉 Backup terminé avec succès - $(date)"
    
    # Afficher un résumé
    echo ""
    echo "📊 Résumé du backup:"
    echo "📁 Répertoire: $BACKUP_DIR"
    echo "📄 Fichiers créés:"
    ls -lh "${BACKUP_DIR}"/*"${DATE}"* 2>/dev/null || true
    echo "💾 Espace disque utilisé:"
    du -sh "$BACKUP_DIR"
}

# Gestion des signaux pour nettoyage en cas d'interruption
trap 'log_error "Backup interrompu"; exit 1' INT TERM

# Exécution
main "$@"
