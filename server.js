const express = require('express');
const multer = require('multer');
const { PDFDocument } = require('pdf-lib');
const ILovePDFApi = require('@ilovepdf/ilovepdf-nodejs');
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
      // Load PDF to get page count
      const pdfDoc = await PDFDocument.load(pdfBuffer);
      const pageCount = pdfDoc.getPageCount();

      // Use ILovePDF to convert PDF to images
      const ilovepdfApiKey = 'secret_key_5cea570533788720d989a23806d90927_TZ4qp3e3fe44a28acd32a59c74d4d263170aa';
      
      try {
        // Create ILovePDF instance with your API key
        const instance = new ILovePDFApi(ilovepdfApiKey, ilovepdfApiKey);
        
        // Create PDF to JPG task
        const task = instance.newTask('pdfjpg');
        
        // Start the task
        await task.start();
        
        // Add the PDF file
        await task.addFile(pdfBuffer);
        
        // Process the conversion
        await task.process();
        
        // Download the result
        const result = await task.download();
        
        // Create image objects from the result
        const images = [];
        for (let i = 0; i < pageCount; i++) {
          images.push({
            filename: `page-${i + 1}.jpg`,
            data: `data:image/jpeg;base64,${Buffer.from(result).toString('base64')}`,
            page: i + 1,
            format: 'jpg'
          });
        }

        res.json({
          success: true,
          message: `PDF converted to ${images.length} JPG images successfully!`,
          images: images,
          totalPages: pageCount,
          filename: req.file.originalname,
          fileSize: req.file.size
        });

      } catch (ilovepdfError) {
        console.error('ILovePDF error:', ilovepdfError);
        res.json({
          success: false,
          message: `PDF to image conversion failed`,
          error: ilovepdfError.message,
          filename: req.file.originalname,
          fileSize: req.file.size
        });
      }

      // Clean up temporary files
      await fs.remove(pdfPath);
      await fs.remove(outputDir);

    } catch (error) {
      console.error('Error converting PDF:', error);
      
      res.status(500).json({
        success: false,
        error: 'Failed to convert PDF to images',
        details: error.message
      });
    }

  } catch (error) {
    console.error('Error in PDF conversion endpoint:', error);
    
    res.status(500).json({
      success: false,
      error: 'Internal server error',
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
