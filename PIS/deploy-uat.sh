#!/bin/bash
# PIS Cloudflare Deployment Script for Mac/Linux
# Run this script to deploy PIS to Cloudflare UAT

set -e

echo "=========================================="
echo "PIS UAT Deployment Script"
echo "=========================================="
echo ""

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "ERROR: Node.js is not installed!"
    echo "Please install Node.js from https://nodejs.org/"
    exit 1
fi

echo "[1/6] Node.js detected: $(node --version)"
echo ""

# Set working directory
cd "$(dirname "$0")"
echo "[2/6] Working directory: $(pwd)"
echo ""

# Install dependencies
echo "[3/6] Installing dependencies..."
npm install
if [ $? -ne 0 ]; then
    echo "ERROR: npm install failed!"
    exit 1
fi
echo "Dependencies installed successfully."
echo ""

# Install Wrangler globally if not present
echo "[4/6] Installing Wrangler CLI..."
npm install -g wrangler || echo "WARNING: Could not install wrangler globally, will use npx"
echo ""

# Deploy API Worker
echo "[5/6] Deploying API to Cloudflare Workers (UAT)..."
npx wrangler deploy --env uat --config wrangler.toml
if [ $? -ne 0 ]; then
    echo "ERROR: Worker deployment failed!"
    exit 1
fi
echo "API deployed successfully!"
echo ""

# Deploy Frontend
echo "[6/6] Building and deploying Frontend..."
cd src/frontend
npm install
npm run build
npx wrangler pages deploy dist --project-name=pis-project-uat || echo "WARNING: Pages deployment may need manual intervention"
cd ../..
echo ""

echo "=========================================="
echo "Deployment Complete!"
echo "=========================================="
echo ""
echo "Your PIS UAT environment should now be live at:"
echo "  API: https://pis-project-uat.YOUR_SUBDOMAIN.workers.dev"
echo "  Frontend: https://pis-project-uat.pages.dev"
echo ""
echo "To verify, visit: https://pis-project-uat.pages.dev"
echo ""
read -p "Press Enter to continue..."
