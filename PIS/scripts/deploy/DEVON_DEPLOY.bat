@echo off
:: Devon Autonomous Deployment Script
:: No user intervention required

echo 🚀 Starting autonomous deployment...

cd /d D:\Team_Agents\PIS

echo 📦 Staging all changes...
git add -A

echo 📝 Committing with timestamp...
set datetime=%date%_%time:~0,8%
set datetime=%datetime:/=-%
set datetime=%datetime::=-%
set datetime=%datetime: =_%
git commit -m "deploy: Production deployment %datetime%" --allow-empty

echo 🚀 Pushing to master (triggers auto-deployment)...
git push origin master

echo ✅ Deployment initiated!
echo.
echo 📊 Monitor at: https://github.com/pasitpipsellsuki/PIS-project/actions
echo ⏱️  System will be live in ~2 minutes
pause
