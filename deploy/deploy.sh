#!/bin/bash
# Deployment script - run this to update the app
# Usage: ./deploy.sh

set -e

echo "=== Deploying Rojmel Update ==="

cd /var/www/danev

# Pull latest changes
git pull origin main

# Update server dependencies
cd /var/www/danev/server
npm install

# Update frontend and rebuild
cd /var/www/danev/app
npm install
NODE_ENV=production npm run build

# Restart API server
pm2 restart rojmel-api

echo "=== Deployment complete ==="
