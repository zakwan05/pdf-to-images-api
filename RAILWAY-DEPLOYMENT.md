# Railway Deployment Guide

## 🚀 Deploy to Railway

### Step 1: Create Railway Account
1. Go to [railway.app](https://railway.app)
2. Sign up with GitHub
3. Connect your GitHub account

### Step 2: Deploy from GitHub
1. Click "New Project"
2. Select "Deploy from GitHub repo"
3. Choose your repository
4. Railway will automatically detect it's a Node.js project

### Step 3: Configure Environment
Railway will automatically:
- Install dependencies (`npm install`)
- Run the start command (`npm start`)
- Expose the app on a public URL

### Step 4: Install System Dependencies
Railway supports system dependencies. The `pdf-poppler` library will automatically install `poppler-utils` which includes the necessary binaries.

### Step 5: Test Your Deployment
1. Get your Railway URL (e.g., `https://your-app-name.railway.app`)
2. Update the API_URL in `test-client.html`
3. Open `test-client.html` in your browser
4. Test with a PDF file

## 📋 What the Server Returns

### Success Response:
```json
{
  "success": true,
  "message": "PDF converted to 3 images",
  "images": [
    {
      "filename": "page-1.png",
      "data": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAA...",
      "page": 1
    },
    {
      "filename": "page-2.png",
      "data": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAA...",
      "page": 2
    },
    {
      "filename": "page-3.png",
      "data": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAA...",
      "page": 3
    }
  ],
  "totalPages": 3,
  "filename": "document.pdf",
  "size": 1024000
}
```

### Error Response:
```json
{
  "success": false,
  "error": "Failed to convert PDF to images",
  "details": "Error message details"
}
```

## 🔧 API Endpoints

### Convert PDF to Images
```
POST /convert-pdf-to-images
Content-Type: multipart/form-data
Body: pdf file (field name: "pdf")
```

### Health Check
```
GET /health
```

## 📱 Android Integration

Use this API endpoint in your Android app:
```
https://your-railway-app.railway.app/convert-pdf-to-images
```

The server will:
1. ✅ Receive your PDF file
2. ✅ Convert it to PNG images using pdf-poppler
3. ✅ Return base64 encoded images
4. ✅ No client-side processing needed!

## 🧪 Testing

1. Deploy to Railway
2. Update `test-client.html` with your Railway URL
3. Open the test client
4. Upload a PDF file
5. See the converted images displayed

## 🎯 Key Benefits

- ✅ **Server-side processing** - All PDF conversion done on server
- ✅ **No client dependencies** - Just upload and receive images
- ✅ **High quality** - Uses pdf-poppler with configurable DPI
- ✅ **Multiple pages** - Converts all pages automatically
- ✅ **Base64 images** - Ready to use in mobile apps
- ✅ **Error handling** - Proper error responses
- ✅ **File cleanup** - Temporary files are automatically removed
