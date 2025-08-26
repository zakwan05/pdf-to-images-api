const express = require('express');
const multer = require('multer');
const { PDFDocument } = require('pdf-lib');
const pdfParse = require('pdf-parse');
const axios = require('axios');
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
      // Analyze PDF using pdf-lib and pdf-parse
      const pdfDoc = await PDFDocument.load(pdfBuffer);
      const pageCount = pdfDoc.getPageCount();
      
      // Extract text content
      const pdfData = await pdfParse(pdfBuffer);
      const textContent = pdfData.text;
      const wordCount = textContent.split(/\s+/).filter(word => word.length > 0).length;
      
      // Get PDF metadata
      const metadata = {
        title: pdfData.info?.Title || 'Unknown',
        author: pdfData.info?.Author || 'Unknown',
        subject: pdfData.info?.Subject || 'Unknown',
        creator: pdfData.info?.Creator || 'Unknown',
        producer: pdfData.info?.Producer || 'Unknown',
        creationDate: pdfData.info?.CreationDate || 'Unknown',
        modificationDate: pdfData.info?.ModDate || 'Unknown'
      };

      // Use CloudConvert to convert PDF to images
      const cloudConvertApiKey = process.env.CLOUDCONVERT_API_KEY || 'demo_key';
      
      if (cloudConvertApiKey === 'demo_key') {
        // Demo mode - return analysis without images
        res.json({
          success: true,
          message: `PDF analyzed successfully! ${pageCount} pages detected.`,
          analysis: {
            pages: pageCount,
            fileSize: req.file.size,
            filename: req.file.originalname,
            textContent: textContent.substring(0, 500) + '...',
            wordCount: wordCount,
            metadata: metadata,
            note: 'Demo mode - add CLOUDCONVERT_API_KEY for image conversion'
          }
        });
      } else {
        // Real CloudConvert processing
        try {
          // Create CloudConvert job
          const jobResponse = await axios.post('https://api.cloudconvert.com/v2/jobs', {
            tasks: {
              'import-pdf': {
                operation: 'import/upload'
              },
              'convert-pdf': {
                operation: 'convert',
                input: 'import-pdf',
                output_format: 'png',
                page_range: `1-${pageCount}`,
                density: 150
              },
              'export-images': {
                operation: 'export/url',
                input: 'convert-pdf'
              }
            }
          }, {
            headers: {
              'Authorization': `Bearer ${cloudConvertApiKey}`,
              'Content-Type': 'application/json'
            }
          });

          // Upload PDF to CloudConvert
          const uploadTask = jobResponse.data.tasks.find(t => t.name === 'import-pdf');
          if (uploadTask && uploadTask.result?.form) {
            const formData = new FormData();
            formData.append('file', new Blob([pdfBuffer], { type: 'application/pdf' }), req.file.originalname);
            
            await axios.post(uploadTask.result.form.url, formData, {
              headers: {
                'Content-Type': 'multipart/form-data'
              }
            });

            // Wait for conversion and get results
            let exportTask;
            for (let i = 0; i < 30; i++) {
              await new Promise(resolve => setTimeout(resolve, 2000));
              
              const jobStatus = await axios.get(`https://api.cloudconvert.com/v2/jobs/${jobResponse.data.id}`, {
                headers: { 'Authorization': `Bearer ${cloudConvertApiKey}` }
              });
              
              exportTask = jobStatus.data.tasks.find(t => t.name === 'export-images');
              if (exportTask && exportTask.status === 'finished') break;
            }

            if (exportTask && exportTask.result?.files) {
              const images = [];
              for (let i = 0; i < exportTask.result.files.length; i++) {
                const file = exportTask.result.files[i];
                const imageResponse = await axios.get(file.url, { responseType: 'arraybuffer' });
                const base64Image = Buffer.from(imageResponse.data).toString('base64');
                
                images.push({
                  filename: `page-${i + 1}.png`,
                  data: `data:image/png;base64,${base64Image}`,
                  page: i + 1,
                  format: 'png'
                });
              }

              res.json({
                success: true,
                message: `PDF converted to ${images.length} images successfully!`,
                analysis: {
                  pages: pageCount,
                  fileSize: req.file.size,
                  filename: req.file.originalname,
                  textContent: textContent.substring(0, 500) + '...',
                  wordCount: wordCount,
                  metadata: metadata,
                  images: images
                }
              });
            } else {
              throw new Error('CloudConvert conversion failed');
            }
          }
        } catch (cloudConvertError) {
          console.error('CloudConvert error:', cloudConvertError);
          // Fallback to analysis only
          res.json({
            success: true,
            message: `PDF analyzed successfully! ${pageCount} pages detected.`,
            analysis: {
              pages: pageCount,
              fileSize: req.file.size,
              filename: req.file.originalname,
              textContent: textContent.substring(0, 500) + '...',
              wordCount: wordCount,
              metadata: metadata,
              note: 'Image conversion failed, but analysis completed successfully'
            }
          });
        }
      }

      // Clean up temporary files
      await fs.remove(pdfPath);
      await fs.remove(outputDir);

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
