#!/bin/bash
set -e

# Update EC2_HOST before running
EC2_HOST="${EC2_HOST:-ec2-user@your-ec2-ip}"
REMOTE_DIR="/var/app/crm"

echo "Building..."
npm run build

echo "Syncing to $EC2_HOST:$REMOTE_DIR..."
rsync -avz --delete \
  .next/standalone/ \
  "$EC2_HOST:$REMOTE_DIR/"

rsync -avz \
  .next/static/ \
  "$EC2_HOST:$REMOTE_DIR/.next/static/"

rsync -avz \
  prisma/schema.prisma \
  "$EC2_HOST:$REMOTE_DIR/prisma/"

echo "Running migrations..."
ssh "$EC2_HOST" "cd $REMOTE_DIR && npx prisma migrate deploy"

echo "Reloading PM2..."
ssh "$EC2_HOST" "pm2 reload crm-api"

echo "Deployed successfully."
