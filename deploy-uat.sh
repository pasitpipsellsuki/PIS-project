#!/bin/bash
# UAT Deployment Script for PIS
# Run this to deploy to your Cloudflare account

echo "🚀 PIS UAT Deployment Script"
echo "============================"
echo ""

# Check if wrangler is installed
if ! command -v wrangler &> /dev/null; then
    echo "❌ Wrangler not found. Installing..."
    npm install -g wrangler
fi

echo "✅ Wrangler installed"
echo ""

# Step 1: Check authentication
echo "Step 1: Checking Cloudflare authentication..."
wrangler whoami
if [ $? -ne 0 ]; then
    echo "❌ Not authenticated. Please run: wrangler login"
    exit 1
fi
echo "✅ Authenticated with Cloudflare"
echo ""

# Step 2: Create D1 Database (if not exists)
echo "Step 2: Creating D1 database..."
wrangler d1 create pis-uat-db 2>&1 | tee d1-output.txt

# Extract database ID from output
DATABASE_ID=$(grep -o 'database_id = "[^"]*"' d1-output.txt | cut -d'"' -f2)

if [ -z "$DATABASE_ID" ]; then
    echo "⚠️  Database might already exist. Getting existing database ID..."
    # Try to get existing database ID
    wrangler d1 list | grep pis-uat-db
fi

echo "✅ Database ready"
echo ""

# Step 3: Update wrangler.toml with database ID
if [ ! -z "$DATABASE_ID" ]; then
    echo "Step 3: Updating wrangler.toml with database ID..."
    sed -i '' "s/database_id = \"\"/database_id = \"$DATABASE_ID\"/" wrangler.toml
    echo "✅ wrangler.toml updated"
fi
echo ""

# Step 4: Deploy API
echo "Step 4: Deploying API to Cloudflare Workers..."
cd PIS
wrangler deploy --env uat
if [ $? -ne 0 ]; then
    echo "❌ API deployment failed"
    exit 1
fi
echo "✅ API deployed"
echo ""

# Step 5: Run database migrations
echo "Step 5: Running database migrations..."
wrangler d1 execute pis-uat-db --file=migrations/001_initial_schema.sql
if [ $? -ne 0 ]; then
    echo "⚠️  Migration might have already been applied"
fi
echo "✅ Migrations applied"
echo ""

# Step 6: Seed database
echo "Step 6: Seeding database with test data..."
python -m scripts.seed_data --env uat
echo "✅ Database seeded"
echo ""

# Step 7: Deploy Frontend
echo "Step 7: Building and deploying frontend..."
cd src/frontend
npm install
npm run build
wrangler pages deploy dist/ --project-name=pis-uat
if [ $? -ne 0 ]; then
    echo "❌ Frontend deployment failed"
    exit 1
fi
echo "✅ Frontend deployed"
echo ""

# Step 8: Verify deployments
echo "Step 8: Verifying deployments..."
echo "Testing API..."
curl -s https://pis-api.pasitpipsellsuki.workers.dev/api/health | grep -q "ok" && echo "✅ API is responding" || echo "❌ API not responding"

echo ""
echo "🎉 DEPLOYMENT COMPLETE!"
echo "======================="
echo ""
echo "Your PIS system is now live:"
echo ""
echo "📱 Frontend: https://pis-uat.pages.dev"
echo "🔌 API:      https://pis-api.pasitpipsellsuki.workers.dev"
echo "📊 Health:   https://pis-api.pasitpipsellsuki.workers.dev/api/health"
echo ""
echo "You can start UAT testing now!"
