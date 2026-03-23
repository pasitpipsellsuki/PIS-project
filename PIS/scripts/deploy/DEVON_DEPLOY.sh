#!/bin/bash
# Devon Autonomous Deployment Script
# No user intervention required

echo "🚀 Starting autonomous deployment..."

cd D:/Team_Agents/PIS || exit 1

echo "📦 Staging all changes..."
git add -A

echo "📝 Committing with timestamp..."
git commit -m "deploy: Production deployment $(date '+%Y-%m-%d_%H-%M-%S')" --allow-empty

echo "🚀 Pushing to master (triggers auto-deployment)..."
git push origin master

echo "✅ Deployment initiated!"
echo ""
echo "📊 Monitor at: https://github.com/pasitpipsellsuki/PIS-project/actions"
echo "⏱️  System will be live in ~2 minutes"
read -p "Press Enter to continue..."
