#!/bin/bash
# Script de configuration du serveur OVH pour Baobab Compta - Frontend
# A exécuter UNE SEULE FOIS en tant que root sur le VPS (après setup-server.sh du backend)
# Usage : bash setup-server.sh

set -e

echo "=== Installation Node.js 20 ==="
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt install -y nodejs

echo "=== Installation PM2 ==="
npm install -g pm2
pm2 startup systemd -u deploy --hp /home/deploy

echo "=== Clonage du projet frontend ==="
mkdir -p /var/www/baobab-compta-frontend
chown deploy:deploy /var/www/baobab-compta-frontend
# A faire manuellement : sudo -u deploy git clone https://github.com/VOTRE_USER/baobab-compta-frontend.git /var/www/baobab-compta-frontend

echo "=== Configuration Nginx frontend ==="
cat > /etc/nginx/sites-available/baobab-frontend << 'NGINX'
server {
    listen 80;
    server_name _;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_cache_bypass $http_upgrade;
    }
}
NGINX

# Désactiver le site par défaut si présent
rm -f /etc/nginx/sites-enabled/default
ln -sf /etc/nginx/sites-available/baobab-frontend /etc/nginx/sites-enabled/
nginx -t && systemctl reload nginx

echo ""
echo "=== PROCHAINES ÉTAPES (à faire manuellement) ==="
echo ""
echo "1. Cloner le repo frontend :"
echo "   sudo -u deploy git clone https://github.com/VOTRE_USER/baobab-compta-frontend.git /var/www/baobab-compta-frontend"
echo ""
echo "2. Configurer le .env.local :"
echo "   cd /var/www/baobab-compta-frontend"
echo "   sudo -u deploy cp .env.example .env.local"
echo "   sudo -u deploy nano .env.local   # mettre l'IP du serveur"
echo ""
echo "3. Build et démarrage :"
echo "   sudo -u deploy npm ci"
echo "   sudo -u deploy npm run build"
echo "   sudo -u deploy pm2 start npm --name baobab-frontend -- start"
echo "   sudo -u deploy pm2 save"
echo ""
echo "Frontend accessible sur : http://VOTRE_IP"
echo "Backend accessible sur  : http://VOTRE_IP:8000"
