const express = require('express');
const multer = require('multer');
const fs = require('fs-extra');
const path = require('path');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = './uploads';
    fs.ensureDirSync(uploadDir);
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + '.pdf');
  }
});

const upload = multer({ 
  storage: storage,
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/pdf') {
      cb(null, true);
    } else {
      cb(new Error('Only PDF files are allowed!'), false);
    }
  },
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  }
});

// PDF to Images conversion endpoint
app.post('/convert-pdf-to-images', upload.single('pdf'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ 
        success: false, 
        error: 'No PDF file uploaded' 
      });
    }

    const pdfPath = req.file.path;

    // For now, return a mock response to test the API structure
    // This will be replaced with actual PDF processing
    const images = [
      {
        filename: 'page-1.png',
        data: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==', // 1x1 transparent PNG
        page: 1
      }
    ];

    // Clean up files
    await fs.remove(pdfPath);

    res.json({
      success: true,
      message: `PDF converted to ${images.length} images (Demo mode)`,
      images: images,
      totalPages: images.length,
      note: 'This is a demo response. PDF processing will be implemented with a compatible library.'
    });

  } catch (error) {
    console.error('Error converting PDF:', error);
    
    // Clean up files on error
    if (req.file) {
      await fs.remove(req.file.path).catch(() => {});
    }
    
    res.status(500).json({
      success: false,
      error: 'Failed to convert PDF to images',
      details: error.message
    });
  }
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: 'PDF to Images API is running',
    timestamp: new Date().toISOString()
  });
});

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    message: 'PDF to Images API',
    endpoints: {
      'POST /convert-pdf-to-images': 'Convert PDF file to images',
      'GET /health': 'Health check'
    },
    usage: {
      method: 'POST',
      url: '/convert-pdf-to-images',
      contentType: 'multipart/form-data',
      body: 'pdf file (field name: "pdf")',
      response: 'JSON with base64 encoded images'
    }
  });
});

// Error handling middleware
app.use((error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        success: false,
        error: 'File too large. Maximum size is 10MB.'
      });
    }
  }
  
  res.status(500).json({
    success: false,
    error: error.message || 'Internal server error'
  });
});

app.listen(PORT, () => {
  console.log(`PDF to Images API running on port ${PORT}`);
  console.log(`Health check: http://localhost:${PORT}/health`);
  console.log(`Convert endpoint: POST http://localhost:${PORT}/convert-pdf-to-images`);
});

