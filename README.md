# PDF to Images API 🚀

A powerful server-side API that converts PDF files to high-quality PNG images. Perfect for Android apps and web applications that need reliable PDF processing.

## ✨ Features

- **Server-side processing** - All PDF conversion happens on the server
- **High-quality images** - Uses pdf-poppler for crisp PNG output
- **Multiple pages** - Automatically converts all PDF pages
- **Base64 encoding** - Images ready for mobile apps
- **No client dependencies** - Just upload and receive images
- **Railway ready** - Deploy with one click

## 🚀 Quick Start

### Deploy to Railway (Recommended)

1. **Fork this repository** or upload your code to GitHub
2. **Go to [railway.app](https://railway.app)**
3. **Click "New Project" → "GitHub Repo"**
4. **Select your repository**
5. **Railway auto-deploys!** 🎉

### Local Development

```bash
# Install dependencies
npm install

# Start the server
npm start

# Server runs on http://localhost:3000
```

## 📡 API Endpoints

### Convert PDF to Images
```
POST /convert-pdf-to-images
Content-Type: multipart/form-data
Body: pdf file (field name: "pdf")
```

**Response:**
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
    }
  ],
  "totalPages": 3,
  "filename": "document.pdf",
  "size": 1024000
}
```

### Health Check
```
GET /health
```

**Response:**
```json
{
  "status": "OK",
  "message": "PDF to Images API is running",
  "timestamp": "2025-01-26T20:09:38.715Z"
}
```

## 📱 Android Integration

Use this API in your Android app:

```kotlin
// Retrofit interface
interface PdfApi {
    @Multipart
    @POST("convert-pdf-to-images")
    suspend fun convertPdfToImages(
        @Part pdf: MultipartBody.Part
    ): Response<PdfResponse>
}

// Usage
val file = File("path/to/document.pdf")
val requestFile = RequestBody.create("application/pdf".toMediaType(), file)
val body = MultipartBody.Part.createFormData("pdf", file.name, requestFile)

val response = pdfApi.convertPdfToImages(body)
if (response.isSuccessful) {
    val images = response.body()?.images
    // Display images in your app
}
```

## 🧪 Testing

1. **Open `test-client.html`** in your browser
2. **Update the API_URL** to your Railway deployment
3. **Upload a PDF file**
4. **See the converted images!**

## 🛠️ Technology Stack

- **Node.js** - Runtime environment
- **Express.js** - Web framework
- **pdf-poppler** - PDF to image conversion
- **Multer** - File upload handling
- **Railway** - Cloud deployment platform

## 📋 Requirements

- Node.js 16+
- PDF files (max 10MB)
- Railway account (for deployment)

## 🎯 Perfect For

- **Android apps** - Convert PDFs to images for display
- **Web applications** - Server-side PDF processing
- **Document viewers** - High-quality image conversion
- **Mobile apps** - No client-side dependencies

## 📄 License

MIT License - feel free to use in your projects!

---

**Ready to deploy?** Just push to GitHub and deploy on Railway! 🚀