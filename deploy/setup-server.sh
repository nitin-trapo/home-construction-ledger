#!/bin/bash
# Server setup script for Digital Ocean
# Run this once on the server to set up the environment

set -e

echo "=== Setting up Rojmel on Digital Ocean ==="

# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js 20.x
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# Install build tools for native modules
sudo apt install -y build-essential python3

# Install PM2 globally
sudo npm install -g pm2

# Install nginx if not present
sudo apt install -y nginx

# Create app directory
sudo mkdir -p /var/www/danev
sudo chown -R $USER:$USER /var/www/danev

# Clone the repository
cd /var/www/danev
git clone https://github.com/nitin-trapo/home-construction-ledger.git .

# Install dependencies for server
cd /var/www/danev/server
npm install

# Install dependencies and build frontend
cd /var/www/danev/app
npm install
NODE_ENV=production npm run build

# Create PM2 ecosystem file
cat > /var/www/danev/ecosystem.config.js << 'EOF'
module.exports = {
  apps: [{
    name: 'rojmel-api',
    cwd: '/var/www/danev/server',
    script: 'index.js',
    env: {
      NODE_ENV: 'production',
      PORT: 3001,
      JWT_SECRET: 'your-secure-secret-key-change-this'
    },
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '500M'
  }]
}
EOF

# Start the API server with PM2
cd /var/www/danev
pm2 start ecosystem.config.js
pm2 save
pm2 startup

echo "=== Server setup complete ==="
echo "Now configure nginx with the provided nginx.conf"
