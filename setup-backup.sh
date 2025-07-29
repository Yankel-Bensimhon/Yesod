#!/bin/bash

# 🕐 Configuration automatique du backup Yesod CRM

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BACKUP_SCRIPT="${SCRIPT_DIR}/backup.sh"

# Couleurs
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m'

log_info() {
    echo -e "${BLUE}ℹ️  [INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}✅ [SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}⚠️  [WARNING]${NC} $1"
}

echo "🕐 Configuration du backup automatique Yesod CRM"
echo "================================================"

# Vérifier si le script de backup existe
if [[ ! -f "$BACKUP_SCRIPT" ]]; then
    echo "❌ Script de backup non trouvé: $BACKUP_SCRIPT"
    exit 1
fi

# Proposer différentes fréquences
echo ""
echo "📅 Choisissez la fréquence de backup:"
echo "1) Quotidien à 2h du matin"
echo "2) Quotidien à 4h du matin"
echo "3) Deux fois par jour (2h et 14h)"
echo "4) Hebdomadaire (dimanche à 3h)"
echo "5) Configuration personnalisée"
echo "6) Voir les tâches cron actuelles"
echo "7) Supprimer les tâches cron existantes"

read -p "Votre choix (1-7): " choice

case $choice in
    1)
        CRON_SCHEDULE="0 2 * * *"
        DESCRIPTION="Quotidien à 2h"
        ;;
    2)
        CRON_SCHEDULE="0 4 * * *"
        DESCRIPTION="Quotidien à 4h"
        ;;
    3)
        CRON_SCHEDULE="0 2,14 * * *"
        DESCRIPTION="Deux fois par jour (2h et 14h)"
        ;;
    4)
        CRON_SCHEDULE="0 3 * * 0"
        DESCRIPTION="Hebdomadaire (dimanche à 3h)"
        ;;
    5)
        echo ""
        echo "📝 Format cron: minute heure jour mois jour_semaine"
        echo "Exemples:"
        echo "  0 3 * * *     = Chaque jour à 3h"
        echo "  30 2 * * 1-5  = Du lundi au vendredi à 2h30"
        echo "  0 0 1 * *     = Le 1er de chaque mois à minuit"
        read -p "Entrez votre schedule cron: " CRON_SCHEDULE
        DESCRIPTION="Personnalisé: $CRON_SCHEDULE"
        ;;
    6)
        echo ""
        log_info "Tâches cron actuelles pour Yesod:"
        crontab -l 2>/dev/null | grep -i yesod || echo "Aucune tâche cron Yesod trouvée"
        exit 0
        ;;
    7)
        echo ""
        log_warning "Suppression des tâches cron Yesod existantes..."
        (crontab -l 2>/dev/null | grep -v "yesod\|Yesod") | crontab -
        log_success "Tâches cron Yesod supprimées"
        exit 0
        ;;
    *)
        echo "❌ Choix invalide"
        exit 1
        ;;
esac

# Créer le job cron
CRON_JOB="$CRON_SCHEDULE cd $SCRIPT_DIR && ./backup.sh >> $SCRIPT_DIR/backup.log 2>&1 # Yesod CRM Backup"

echo ""
log_info "Configuration du backup automatique..."
echo "📋 Schedule: $DESCRIPTION"
echo "⏰ Cron: $CRON_SCHEDULE"
echo "📁 Script: $BACKUP_SCRIPT"
echo "📄 Log: $SCRIPT_DIR/backup.log"

# Confirmer
read -p "Confirmer la configuration? (y/N): " confirm
if [[ $confirm != [yY] ]]; then
    echo "❌ Configuration annulée"
    exit 0
fi

# Ajouter la tâche cron
(crontab -l 2>/dev/null | grep -v "yesod\|Yesod"; echo "$CRON_JOB") | crontab -

log_success "Backup automatique configuré!"

echo ""
echo "📊 Résumé:"
echo "✅ Tâche cron ajoutée: $DESCRIPTION"
echo "📄 Logs disponibles dans: $SCRIPT_DIR/backup.log"
echo "🔧 Pour modifier: crontab -e"
echo "👀 Pour voir les tâches: crontab -l"

# Créer un fichier de log initial
touch "$SCRIPT_DIR/backup.log"
echo "$(date): Backup automatique configuré - $DESCRIPTION" >> "$SCRIPT_DIR/backup.log"

echo ""
log_info "💡 Commandes utiles:"
echo "   Voir les logs:        tail -f $SCRIPT_DIR/backup.log"
echo "   Test manuel:          $BACKUP_SCRIPT"
echo "   Voir les backups:     ls -la $SCRIPT_DIR/backups/"
echo "   Modifier la config:   crontab -e"
