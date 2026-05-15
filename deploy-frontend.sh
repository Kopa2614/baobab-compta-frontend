#!/bin/bash
# ============================================================
# BAOBAB COMPTA - Premier déploiement du frontend
# A exécuter en root après deploy-backend.sh
# Usage : bash deploy-frontend.sh http://IP:8000/api/v1
# ============================================================

set -e
API_URL=${1:?"Usage: bash deploy-frontend.sh http://IP:8000/api/v1"}

RED='\033[0;31m'; GREEN='\033[0;32m'; BLUE='\033[0;34m'; NC='\033[0m'
info()    { echo -e "${BLUE}[INFO]${NC} $1"; }
success() { echo -e "${GREEN}[OK]${NC} $1"; }

SERVER_IP=$(curl -s ifconfig.me 2>/dev/null || hostname -I | awk '{print $1}')
APP_DIR="/var/www/baobab-compta-frontend"

info "Clonage du repository frontend..."
echo "Entrez l'URL de votre repo GitHub (ex: https://github.com/VOUS/baobab-compta-frontend.git) :"
read REPO_URL

sudo -u deploy git clone "$REPO_URL" "$APP_DIR" || {
  info "Dossier existant, mise à jour..."
  sudo -u deploy git -C "$APP_DIR" pull origin main
}

info "Création du fichier .env.local..."
cat > "$APP_DIR/.env.local" << ENV
NEXT_PUBLIC_API_URL=$API_URL
ENV
chown deploy:deploy "$APP_DIR/.env.local"

info "Installation des dépendances npm..."
sudo -u deploy npm ci --prefix "$APP_DIR"

info "Build Next.js (peut prendre 1-2 minutes)..."
sudo -u deploy npm run build --prefix "$APP_DIR"

info "Démarrage avec PM2..."
sudo -u deploy pm2 delete baobab-frontend 2>/dev/null || true
sudo -u deploy pm2 start npm --name baobab-frontend -- start --prefix "$APP_DIR"
sudo -u deploy pm2 save

success "Frontend déployé sur http://$SERVER_IP"
echo ""
echo "Vérifiez l'état : sudo -u deploy pm2 status"
echo "Logs           : sudo -u deploy pm2 logs baobab-frontend"
