#!/bin/bash
set -e

# AWS EC2 Amazon Linux 2023 bootstrap script
# Run once on a fresh instance

echo "=== Agency CRM EC2 Setup ==="

# System packages
dnf update -y
dnf install -y git nginx

# Node.js 20 via NVM
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.0/install.sh | bash
export NVM_DIR="$HOME/.nvm"
source "$NVM_DIR/nvm.sh"
nvm install 20
nvm use 20
nvm alias default 20

# PM2
npm install -g pm2

# App directory
mkdir -p /var/app/crm
chown ec2-user:ec2-user /var/app/crm

# Clone repo (update URL)
git clone https://github.com/YOUR_ORG/agency-crm.git /var/app/crm
cd /var/app/crm

# Install deps
npm ci

# Build
npm run build

# Run migrations (DATABASE_URL must be set in environment)
npx prisma migrate deploy
npx prisma db seed

# Start with PM2
pm2 start infra/ecosystem.config.js
pm2 startup systemd -u ec2-user --hp /home/ec2-user
pm2 save

# Nginx
cp infra/nginx.conf /etc/nginx/conf.d/crm.conf
nginx -t && systemctl restart nginx
systemctl enable nginx

echo "=== Setup complete ==="
echo "Visit https://your-domain.com to access the CRM"
