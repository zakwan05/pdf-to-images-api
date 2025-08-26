const express = require('express');
const multer = require('multer');
const { fromPath } = require('pdf2pic');
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
    
    // Create temporary files for processing
    const tempDir = '/tmp';
    const timestamp = Date.now();
    const pdfPath = path.join(tempDir, `temp-${timestamp}.pdf`);
    const outputDir = path.join(tempDir, `output-${timestamp}`);
    
    // Ensure directories exist
    await fs.ensureDir(outputDir);
    
    // Write PDF buffer to temporary file
    await fs.writeFile(pdfPath, pdfBuffer);

    try {
      // Convert PDF to actual images using pdf2pic
      const convert = fromPath(pdfPath, {
        density: 150,
        saveFilename: 'page',
        savePath: outputDir,
        format: 'png',
        width: 2000,
        height: 2000
      });

      const results = await convert.bulk(-1); // Convert all pages
      
      const images = [];
      for (let i = 0; i < results.length; i++) {
        const result = results[i];
        if (result.path) {
          const imageBuffer = await fs.readFile(result.path);
          const base64Image = imageBuffer.toString('base64');
          
          images.push({
            filename: `page-${i + 1}.png`,
            data: `data:image/png;base64,${base64Image}`,
            page: i + 1,
            type: 'png'
          });
        }
      }

      // Clean up temporary files
      await fs.remove(pdfPath);
      await fs.remove(outputDir);

      // Return the actual converted images
      res.json({
        success: true,
        message: `PDF converted to ${images.length} images successfully!`,
        images: images,
        totalPages: images.length,
        filename: req.file.originalname,
        size: req.file.size,
        processing: 'full'
      });

    } catch (conversionError) {
      // If conversion fails, fall back to returning PDF data
      console.error('PDF conversion failed:', conversionError);
      
      // Clean up temp files
      await fs.remove(pdfPath);
      await fs.remove(outputDir);
      
      const pdfBase64 = pdfBuffer.toString('base64');
      const pdfDataUrl = `data:application/pdf;base64,${pdfBase64}`;

      res.json({
        success: true,
        message: 'PDF received successfully. Server-side conversion failed, using fallback.',
        pdfData: pdfDataUrl,
        filename: req.file.originalname,
        size: req.file.size,
        note: 'Server-side processing failed, PDF data provided as fallback.',
        error: conversionError.message
      });
    }

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
