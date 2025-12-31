#!/bin/bash
# Update script for production server
# Run this script to pull latest changes and rebuild

set -e

echo "=== Updating Rojmel on Production Server ==="

cd /var/www/danev

# Pull latest changes from GitHub
echo "Pulling latest changes..."
git pull origin main

# Update server dependencies
echo "Installing server dependencies..."
cd server
npm install

# Update frontend dependencies and rebuild
echo "Building frontend..."
cd ../app
npm install
NODE_ENV=production npm run build

# Restart API server
echo "Restarting API server..."
pm2 restart rojmel-api
pm2 save

echo "=== Update complete! ==="
echo "App is live at: http://159.65.141.91/danev/"
