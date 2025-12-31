# Deployment Guide - Digital Ocean

## Server Details
- **IP**: 159.65.141.91
- **URL**: http://159.65.141.91/danev
- **SSH Key**: D:\My\Trapo\Digital Ocean

## Quick Deploy Commands

### 1. Connect to Server
```powershell
ssh -i "D:\My\Trapo\Digital Ocean\your-key-file" root@159.65.141.91
```

### 2. First Time Setup (run once)
```bash
# On the server
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs build-essential python3 nginx
sudo npm install -g pm2

# Create app directory
sudo mkdir -p /var/www/danev
cd /var/www/danev

# Clone repo
git clone https://github.com/nitin-trapo/home-construction-ledger.git .

# Install server dependencies
cd server && npm install && cd ..

# Build frontend
cd app && npm install && NODE_ENV=production npm run build && cd ..

# Start API with PM2
pm2 start server/index.js --name rojmel-api
pm2 save
pm2 startup
```

### 3. Configure Nginx
```bash
sudo nano /etc/nginx/sites-available/default
```

Add inside the `server { }` block:
```nginx
location /danev {
    alias /var/www/danev/app/dist;
    index index.html;
    try_files $uri $uri/ /danev/index.html;
}

location /danev/api {
    proxy_pass http://127.0.0.1:3001/api;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection 'upgrade';
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_cache_bypass $http_upgrade;
}
```

Then:
```bash
sudo nginx -t
sudo systemctl restart nginx
```

### 4. Update Deployment (after changes)
```bash
cd /var/www/danev
git pull origin main
cd app && npm install && NODE_ENV=production npm run build && cd ..
cd server && npm install && cd ..
pm2 restart rojmel-api
```

## Troubleshooting

### Check API logs
```bash
pm2 logs rojmel-api
```

### Check nginx logs
```bash
sudo tail -f /var/log/nginx/error.log
```

### Restart services
```bash
pm2 restart rojmel-api
sudo systemctl restart nginx
```
