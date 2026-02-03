import express from 'express';
import multer from 'multer';
import path from 'path';
import { promises as fs } from 'fs';
import { v4 as uuidv4 } from 'uuid';
import { fileURLToPath } from 'url';
import * as reportParser from '../services/report-parser.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = express.Router();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: async (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../../uploads');
    try {
      await fs.mkdir(uploadDir, { recursive: true });
      cb(null, uploadDir);
    } catch (error) {
      cb(error);
    }
  },
  filename: (req, file, cb) => {
    const uniqueName = `${uuidv4()}${path.extname(file.originalname)}`;
    cb(null, uniqueName);
  }
});

// File filter to accept only PDF, JPG, PNG
const fileFilter = (req, file, cb) => {
  const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg'];
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only PDF, JPG, and PNG are allowed.'), false);
  }
};

// Configuration constants
const MAX_FILE_SIZE = 3 * 1024 * 1024; // 3MB limit per file
const MAX_PDF_PAGES = 5; // Maximum PDF pages allowed
const MAX_FILES = 5; // Maximum number of files in one upload

const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: MAX_FILE_SIZE,
    files: MAX_FILES
  }
});

// In-memory storage for report metadata (will be replaced with DB later)
const reportStore = new Map();

/**
 * POST /api/reports/upload
 * Upload multiple report files (PDF, JPG, PNG)
 *
 * Limits:
 * - Maximum 5 files per upload
 * - PDF: Maximum 5 pages per file
 * - File size: Maximum 3MB per file
 * - Formats: PDF, JPG, PNG only
 */
router.post('/upload', upload.array('files', MAX_FILES), async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'No files uploaded',
        hint: 'Please select at least one file to upload (maximum 5 files)'
      });
    }

    const batchId = uuidv4();
    const uploadedFiles = [];

    for (const file of req.files) {
      const fileId = uuidv4();
      const fileInfo = {
        fileId,
        batchId,
        originalName: file.originalname,
        fileName: file.filename,
        filePath: file.path,
        fileType: file.mimetype,
        fileSize: file.size,
        uploadedAt: new Date().toISOString(),
        status: 'uploaded' // uploaded, scanning, analyzing, completed, skipped, error
      };

      reportStore.set(fileId, fileInfo);
      uploadedFiles.push({
        fileId,
        originalName: file.originalname,
        fileSize: file.size,
        fileType: file.mimetype
      });
    }

    // Store batch info
    reportStore.set(batchId, {
      batchId,
      fileIds: uploadedFiles.map(f => f.fileId),
      totalFiles: uploadedFiles.length,
      uploadedAt: new Date().toISOString(),
      status: 'uploaded'
    });

    res.json({
      success: true,
      message: `${uploadedFiles.length} file(s) uploaded successfully`,
      batchId,
      files: uploadedFiles,
      limits: {
        maxFiles: MAX_FILES,
        maxFileSize: `${MAX_FILE_SIZE / 1024 / 1024}MB`,
        maxPdfPages: MAX_PDF_PAGES
      }
    });

  } catch (error) {
    console.error('Upload error:', error);

    // Handle Multer errors
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        success: false,
        error: 'File too large',
        details: `Maximum file size is ${MAX_FILE_SIZE / 1024 / 1024}MB per file`,
        hint: '중대성 평가 페이지만 PDF로 추출하거나, 해당 페이지를 스크린샷으로 업로드해주세요.'
      });
    }

    if (error.code === 'LIMIT_FILE_COUNT') {
      return res.status(400).json({
        success: false,
        error: 'Too many files',
        details: `Maximum ${MAX_FILES} files allowed per upload`,
        hint: '최대 5개 파일까지만 한 번에 업로드할 수 있습니다.'
      });
    }

    res.status(500).json({
      success: false,
      error: 'File upload failed',
      details: error.message
    });
  }
});

/**
 * POST /api/reports/batch/:batchId/analyze
 * Analyze a batch of uploaded files with smart scanning
 *
 * This will:
 * 1. Quick scan all files to detect materiality content
 * 2. Only analyze files that contain materiality issues
 * 3. Extract and merge issues from all relevant files
 * 4. Return combined results
 */
router.post('/batch/:batchId/analyze', async (req, res) => {
  try {
    const { batchId } = req.params;
    const batch = reportStore.get(batchId);

    if (!batch) {
      return res.status(404).json({
        success: false,
        error: 'Batch not found'
      });
    }

    const results = {
      batchId,
      totalFiles: batch.fileIds.length,
      scannedFiles: 0,
      analyzedFiles: 0,
      skippedFiles: 0,
      allIssues: [],
      fileResults: []
    };

    // Step 1: Quick scan all files
    console.log(`\n🔍 Scanning ${batch.fileIds.length} files for materiality content...`);

    for (const fileId of batch.fileIds) {
      const file = reportStore.get(fileId);
      if (!file) continue;

      results.scannedFiles++;

      // Quick scan
      console.log(`Scanning: ${file.originalName}`);
      const scanResult = await reportParser.quickScanForMaterialityContent(
        file.filePath,
        file.fileType
      );

      file.scanResult = scanResult;
      file.status = 'scanned';
      reportStore.set(fileId, file);

      if (!scanResult.hasMaterialityContent) {
        console.log(`  ⏭️  Skipped (no materiality content detected)`);
        file.status = 'skipped';
        reportStore.set(fileId, file);
        results.skippedFiles++;
        results.fileResults.push({
          fileId,
          fileName: file.originalName,
          status: 'skipped',
          reason: 'No materiality content detected'
        });
        continue;
      }

      // Step 2: Analyze files with content
      console.log(`  ✅ Analyzing (materiality content detected)`);
      file.status = 'analyzing';
      reportStore.set(fileId, file);

      try {
        const analysisResult = await reportParser.extractIssues(
          file.filePath,
          file.fileType,
          MAX_PDF_PAGES
        );

        file.status = 'completed';
        file.extractedIssues = analysisResult.issues;
        file.metadata = analysisResult.metadata;
        file.analyzedAt = new Date().toISOString();
        reportStore.set(fileId, file);

        results.analyzedFiles++;
        results.allIssues.push(...analysisResult.issues);

        results.fileResults.push({
          fileId,
          fileName: file.originalName,
          status: 'completed',
          issuesFound: analysisResult.issues.length,
          metadata: analysisResult.metadata
        });

        console.log(`  📊 Found ${analysisResult.issues.length} issues`);

      } catch (error) {
        console.error(`  ❌ Error analyzing ${file.originalName}:`, error.message);
        file.status = 'error';
        file.error = error.message;
        reportStore.set(fileId, file);

        results.fileResults.push({
          fileId,
          fileName: file.originalName,
          status: 'error',
          error: error.message
        });
      }
    }

    // Update batch status
    batch.status = 'completed';
    batch.analyzedAt = new Date().toISOString();
    batch.results = results;
    reportStore.set(batchId, batch);

    // Remove duplicates from allIssues
    const uniqueIssues = results.allIssues.filter((issue, index, self) =>
      index === self.findIndex(i => i.issue_name === issue.issue_name)
    );

    res.json({
      success: true,
      batchId,
      summary: {
        totalFiles: results.totalFiles,
        scannedFiles: results.scannedFiles,
        analyzedFiles: results.analyzedFiles,
        skippedFiles: results.skippedFiles,
        totalIssuesFound: uniqueIssues.length
      },
      issues: uniqueIssues,
      fileResults: results.fileResults
    });

  } catch (error) {
    console.error('Batch analysis error:', error);
    res.status(500).json({
      success: false,
      error: 'Batch analysis failed',
      details: error.message
    });
  }
});

/**
 * POST /api/reports/:reportId/analyze
 * Analyze a single uploaded report (backwards compatible)
 *
 * This will:
 * 1. Extract text from PDF (max 5 pages) or image (OCR)
 * 2. Find materiality assessment section
 * 3. Use AI to extract ESG issues
 * 4. Categorize issues as E/S/G
 */
router.post('/:reportId/analyze', async (req, res) => {
  try {
    const { reportId } = req.params;
    const report = reportStore.get(reportId);

    if (!report) {
      return res.status(404).json({
        success: false,
        error: 'Report not found'
      });
    }

    // Update status to processing
    report.status = 'processing';
    reportStore.set(reportId, report);

    // Parse and extract issues with page limit
    const result = await reportParser.extractIssues(
      report.filePath,
      report.fileType,
      MAX_PDF_PAGES
    );

    // Update report with extracted data
    report.status = 'completed';
    report.extractedIssues = result.issues;
    report.extractedAt = new Date().toISOString();
    report.metadata = result.metadata;
    reportStore.set(reportId, report);

    res.json({
      success: true,
      reportId,
      totalIssues: result.issues.length,
      issues: result.issues,
      metadata: result.metadata
    });

  } catch (error) {
    console.error('Analysis error:', error);

    // Update status to error
    const report = reportStore.get(req.params.reportId);
    if (report) {
      report.status = 'error';
      report.error = error.message;
      reportStore.set(req.params.reportId, report);
    }

    // Check if it's a page limit error
    const isPdfPageLimitError = error.message && error.message.includes('maximum allowed is');

    res.status(isPdfPageLimitError ? 400 : 500).json({
      success: false,
      error: isPdfPageLimitError ? 'PDF page limit exceeded' : 'Report analysis failed',
      details: error.message,
      hint: isPdfPageLimitError
        ? '전체 보고서가 아닌 중대성 평가 섹션만 따로 PDF로 추출하거나, 해당 페이지를 스크린샷(JPG/PNG)으로 업로드해주세요.'
        : undefined
    });
  }
});

/**
 * GET /api/reports/:reportId/issues
 * Get extracted issues from a report
 */
router.get('/:reportId/issues', async (req, res) => {
  try {
    const { reportId } = req.params;
    const report = reportStore.get(reportId);

    if (!report) {
      return res.status(404).json({
        success: false,
        error: 'Report not found'
      });
    }

    if (report.status === 'uploaded') {
      return res.status(400).json({
        success: false,
        error: 'Report has not been analyzed yet. Please call /analyze endpoint first.'
      });
    }

    if (report.status === 'processing') {
      return res.status(202).json({
        success: false,
        error: 'Report is still being processed. Please try again later.',
        status: 'processing'
      });
    }

    if (report.status === 'error') {
      return res.status(500).json({
        success: false,
        error: 'Report analysis failed',
        details: report.error
      });
    }

    res.json({
      success: true,
      reportId,
      originalFileName: report.originalName,
      uploadedAt: report.uploadedAt,
      extractedAt: report.extractedAt,
      totalIssues: report.extractedIssues?.length || 0,
      issues: report.extractedIssues || [],
      metadata: report.metadata || {}
    });

  } catch (error) {
    console.error('Get issues error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve issues',
      details: error.message
    });
  }
});

/**
 * GET /api/reports/:reportId/status
 * Get report processing status
 */
router.get('/:reportId/status', async (req, res) => {
  try {
    const { reportId } = req.params;
    const report = reportStore.get(reportId);

    if (!report) {
      return res.status(404).json({
        success: false,
        error: 'Report not found'
      });
    }

    res.json({
      success: true,
      reportId,
      status: report.status,
      originalFileName: report.originalName,
      uploadedAt: report.uploadedAt,
      extractedAt: report.extractedAt,
      totalIssues: report.extractedIssues?.length || 0
    });

  } catch (error) {
    console.error('Get status error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get status',
      details: error.message
    });
  }
});

/**
 * DELETE /api/reports/:reportId
 * Delete a report and its file
 */
router.delete('/:reportId', async (req, res) => {
  try {
    const { reportId } = req.params;
    const report = reportStore.get(reportId);

    if (!report) {
      return res.status(404).json({
        success: false,
        error: 'Report not found'
      });
    }

    // Delete file from disk
    try {
      await fs.unlink(report.filePath);
    } catch (error) {
      console.error('File deletion error:', error);
      // Continue even if file deletion fails
    }

    // Remove from store
    reportStore.delete(reportId);

    res.json({
      success: true,
      message: 'Report deleted successfully',
      reportId
    });

  } catch (error) {
    console.error('Delete error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete report',
      details: error.message
    });
  }
});

export default router;
