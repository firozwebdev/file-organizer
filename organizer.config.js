/**
 * File Organizer Configuration
 * 
 * This file contains default settings for the file organizer.
 * You can modify these settings to customize the behavior.
 */

module.exports = {
  // Output directory name (will be created inside the input directory)
  outputDir: 'organized_files',

  // Whether to extract archives (ZIP, RAR) automatically
  extractArchives: true,

  // Whether to clean up extracted temporary directories after organizing
  cleanupExtracted: true,

  // Log level: 'debug', 'info', 'warn', 'error'
  logLevel: 'info',

  // Whether to run in dry-run mode (preview only, no actual changes)
  dryRun: false,

  // File types to organize (only these types will be processed)
  allowedFileTypes: [
    'jpeg', 'jpg', 'png', 'svg',     // Images
    'eps', 'ai', 'psd', 'cdr',       // Design files
    'pdf',                           // Documents
    'crw',                           // Raw photos
    'zip', 'rar'                     // Archives
  ],

  // Custom folder names for file types (optional)
  // If not specified, lowercase extension will be used
  customFolderNames: {
    // 'jpg': 'JPEG_Images',
    // 'png': 'PNG_Images',
    // 'eps': 'Vector_Graphics',
    // 'pdf': 'Documents'
  },

  // File naming options
  fileNaming: {
    // Whether to sanitize file names (remove invalid characters)
    sanitizeNames: true,
    
    // Whether to detect file types by content (not just extension)
    detectFileTypes: true,
    
    // Whether to correct file extensions based on detected type
    correctExtensions: true
  },

  // Archive extraction options
  archiveOptions: {
    // Maximum extraction depth (to prevent zip bombs)
    maxDepth: 5,
    
    // Maximum number of files to extract from a single archive
    maxFiles: 10000,
    
    // Whether to organize extracted files immediately
    organizeExtracted: true
  },

  // Advanced options
  advanced: {
    // Whether to process subdirectories recursively
    recursive: true,
    
    // Whether to preserve original file timestamps
    preserveTimestamps: true,
    
    // Whether to create symbolic links instead of copying files
    useSymlinks: false,
    
    // Maximum file size to process (in bytes, 0 = no limit)
    maxFileSize: 0
  }
};

/**
 * Quick Presets
 * 
 * You can use these presets for common scenarios:
 * 
 * 1. DESIGN_BUNDLE - For organizing design file bundles
 * 2. PHOTO_COLLECTION - For organizing photo collections
 * 3. ARCHIVE_EXTRACTION - Focus on extracting and organizing archives
 * 4. PREVIEW_MODE - Safe preview mode with dry-run enabled
 */

const PRESETS = {
  DESIGN_BUNDLE: {
    outputDir: 'organized_design_files',
    extractArchives: true,
    logLevel: 'info',
    allowedFileTypes: ['eps', 'ai', 'psd', 'pdf', 'jpg', 'png', 'svg', 'cdr', 'zip', 'rar']
  },

  PHOTO_COLLECTION: {
    outputDir: 'organized_photos',
    extractArchives: true,
    logLevel: 'info',
    allowedFileTypes: ['jpg', 'jpeg', 'png', 'crw', 'zip', 'rar']
  },

  ARCHIVE_EXTRACTION: {
    outputDir: 'extracted_files',
    extractArchives: true,
    cleanupExtracted: false, // Keep extracted folders for review
    logLevel: 'debug',
    allowedFileTypes: ['zip', 'rar', 'jpg', 'png', 'eps', 'pdf', 'ai', 'psd', 'svg']
  },

  PREVIEW_MODE: {
    outputDir: 'preview_organized',
    dryRun: true,
    logLevel: 'info',
    extractArchives: false // Don't extract in preview mode
  }
};

module.exports.PRESETS = PRESETS;
