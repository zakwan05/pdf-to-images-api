Write-Host "🚀 Setting up PDF to Images API for Railway deployment..." -ForegroundColor Green
Write-Host ""

Write-Host "📁 Initializing git repository..." -ForegroundColor Yellow
git init

Write-Host "📝 Adding all files..." -ForegroundColor Yellow
git add .

Write-Host "💾 Committing changes..." -ForegroundColor Yellow
git commit -m "Server-side PDF processing API ready for Railway"

Write-Host ""
Write-Host "✅ Repository ready!" -ForegroundColor Green
Write-Host ""
Write-Host "📋 Next steps:" -ForegroundColor Cyan
Write-Host "1. Create a new repository on GitHub"
Write-Host "2. Copy the repository URL"
Write-Host "3. Run: git remote add origin YOUR_GITHUB_URL"
Write-Host "4. Run: git push -u origin main"
Write-Host "5. Deploy on Railway!"
Write-Host ""
Write-Host "🎯 Your API will return actual images like this:" -ForegroundColor Magenta
Write-Host '{
  "success": true,
  "message": "PDF converted to 3 images",
  "images": [
    {
      "filename": "page-1.png",
      "data": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAA...",
      "page": 1
    }
  ]
}' -ForegroundColor Gray
Write-Host ""
Read-Host "Press Enter to continue"
