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

// Configure multer for file uploads (using memory storage for serverless)
const upload = multer({ 
  storage: multer.memoryStorage(),
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

    // Get the PDF file buffer from memory
    const pdfBuffer = req.file.buffer;
    
    // Convert PDF buffer to base64 for client-side processing
    const pdfBase64 = pdfBuffer.toString('base64');
    const pdfDataUrl = `data:application/pdf;base64,${pdfBase64}`;

    // Return the PDF data for client-side processing
    res.json({
      success: true,
      message: 'PDF received successfully. Processing in browser...',
      pdfData: pdfDataUrl,
      filename: req.file.originalname,
      size: req.file.size,
      note: 'Server-side processing temporarily disabled. Use client-side processing.'
    });

  } catch (error) {
    console.error('Error converting PDF:', error);
    
    res.status(500).json({
      success: false,
      error: 'Failed to convert PDF to images',
      details: error.message
    });
  }
});

// Health check endpoint
app.get('/health', (req, res) => {
  console.log('Health check requested');
  res.json({ 
    status: 'OK', 
    message: 'PDF to Images API is running',
    timestamp: new Date().toISOString(),
    port: PORT,
    environment: process.env.NODE_ENV || 'development'
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
