#!/bin/bash
set -e

CRM_BACKEND_URL="${CRM_BACKEND_URL:-https://your-domain.com}"

echo "Compiling Electron TypeScript..."
npx tsc -p electron/tsconfig.json

echo "Building Next.js..."
npm run build

echo "Building Electron DMG (Mac x64 + arm64)..."
CRM_BACKEND_URL="$CRM_BACKEND_URL" npx electron-builder --mac --publish never

echo "Done! DMG is in dist-app/"
ls dist-app/*.dmg 2>/dev/null || echo "Check dist-app/ for output"
