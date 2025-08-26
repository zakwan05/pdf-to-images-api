@echo off
echo 🚀 Setting up PDF to Images API for Railway deployment...
echo.

echo 📁 Initializing git repository...
git init

echo 📝 Adding all files...
git add .

echo 💾 Committing changes...
git commit -m "Server-side PDF processing API ready for Railway"

echo.
echo ✅ Repository ready!
echo.
echo 📋 Next steps:
echo 1. Create a new repository on GitHub
echo 2. Copy the repository URL
echo 3. Run: git remote add origin YOUR_GITHUB_URL
echo 4. Run: git push -u origin main
echo 5. Deploy on Railway!
echo.
echo 🎯 Your API will return actual images like this:
echo {
echo   "success": true,
echo   "message": "PDF converted to 3 images",
echo   "images": [
echo     {
echo       "filename": "page-1.png",
echo       "data": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAA...",
echo       "page": 1
echo     }
echo   ]
echo }
echo.
pause
