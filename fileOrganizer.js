const fs = require("fs-extra");
const path = require("path");
const chalk = require("chalk");
const {
  Logger,
  ProgressTracker,
  ErrorHandler,
  getDirectorySize,
  formatBytes,
} = require("./utils");

class FileOrganizer {
  constructor(options = {}) {
    this.options = {
      outputDir: options.outputDir || "organized_files",
      extractArchives: options.extractArchives !== false,
      logLevel: options.logLevel || "info",
      dryRun: options.dryRun || false,
      enableFileLogging: options.enableFileLogging || false,
      logFile: options.logFile || "file-organizer.log",
      ...options,
    };

    this.logger = new Logger(this.options.logLevel);
    this.errorHandler = new ErrorHandler(this.logger);
    this.progressTracker = new ProgressTracker();

    if (this.options.enableFileLogging) {
      this.logger.enableFileLogging(this.options.logFile);
    }

    // Define allowed file types (folder names will be lowercase extensions)
    this.allowedFileTypes = [
      'jpeg', 'jpg', 'png', 'eps', 'ai', 'psd',
      'pdf', 'crw', 'zip', 'rar', 'svg', 'cdr'
    ];

    this.stats = {
      filesProcessed: 0,
      foldersCreated: 0,
      archivesExtracted: 0,
      errors: 0,
      totalSize: 0,
      startTime: Date.now(),
      skippedFiles: 0,
    };
  }

  log(level, message, ...args) {
    this.logger.log(level, message, ...args);
  }

  async ensureDirectory(dirPath) {
    try {
      await fs.ensureDir(dirPath);
      return true;
    } catch (error) {
      this.log(
        "error",
        `Failed to create directory ${dirPath}:`,
        error.message
      );
      this.stats.errors++;
      return false;
    }
  }

  getFileExtension(filePath) {
    const ext = path.extname(filePath).toLowerCase();
    return ext.startsWith(".") ? ext.slice(1) : ext || "no-extension";
  }

  isAllowedFileType(extension) {
    return this.allowedFileTypes.includes(extension.toLowerCase());
  }

  getFolderNameForExtension(extension) {
    // Folder name is just the lowercase extension
    return extension.toLowerCase();
  }

  sanitizeFileName(fileName) {
    // Remove invalid characters and normalize the filename
    return fileName.replace(/[<>:"/\\|?*]/g, '_').trim();
  }

  async countFilesInDirectory(dirPath) {
    let count = 0;
    try {
      const items = await fs.readdir(dirPath);
      for (const item of items) {
        const itemPath = path.join(dirPath, item);
        const stat = await fs.stat(itemPath);
        if (stat.isDirectory()) {
          count += await this.countFilesInDirectory(itemPath);
        } else {
          count++;
        }
      }
    } catch (error) {
      // Ignore errors for inaccessible directories
    }
    return count;
  }

  async detectFileType(filePath) {
    try {
      // Read the first few bytes to detect file signature
      const buffer = Buffer.alloc(16);
      const fd = await fs.open(filePath, 'r');
      await fs.read(fd, buffer, 0, 16, 0);
      await fs.close(fd);

      // File signatures (magic numbers)
      const signatures = {
        'jpg': [0xFF, 0xD8, 0xFF],
        'jpeg': [0xFF, 0xD8, 0xFF],
        'png': [0x89, 0x50, 0x4E, 0x47],
        'pdf': [0x25, 0x50, 0x44, 0x46],
        'zip': [0x50, 0x4B, 0x03, 0x04],
        'rar': [0x52, 0x61, 0x72, 0x21],
        'eps': [0x25, 0x21, 0x50, 0x53], // %!PS
        'psd': [0x38, 0x42, 0x50, 0x53], // 8BPS
      };

      // Check file signatures
      for (const [type, signature] of Object.entries(signatures)) {
        if (signature.every((byte, index) => buffer[index] === byte)) {
          return type;
        }
      }

      // Fall back to extension-based detection
      return this.getFileExtension(filePath);
    } catch (error) {
      this.log("debug", `Could not detect file type for ${filePath}, using extension`);
      return this.getFileExtension(filePath);
    }
  }

  async getCorrectFileExtension(filePath) {
    const detectedType = await this.detectFileType(filePath);
    const currentExtension = this.getFileExtension(filePath);

    // If detected type differs from extension and both are supported, use detected type
    if (detectedType !== currentExtension &&
        this.isAllowedFileType(detectedType) &&
        this.isAllowedFileType(currentExtension)) {
      this.log("info", `File type mismatch detected: ${filePath} appears to be .${detectedType} but has .${currentExtension} extension`);
      return detectedType;
    }

    return currentExtension;
  }

  async copyFileToOrganizedLocation(filePath, basePath) {
    try {
      // First detect the actual file type by signature
      const detectedType = await this.detectFileType(filePath);
      const currentExtension = this.getFileExtension(filePath);

      // Use detected type if it's supported, otherwise fall back to extension
      let correctExtension = detectedType;
      if (!this.isAllowedFileType(detectedType)) {
        correctExtension = currentExtension;
      }

      // Check if this file type is allowed
      if (!this.isAllowedFileType(correctExtension)) {
        this.log("debug", `Skipping file with unsupported type: ${filePath} (.${correctExtension})`);
        this.stats.skippedFiles++;
        return null;
      }

      const folderName = this.getFolderNameForExtension(correctExtension);
      const originalFileName = path.basename(filePath);

      // Create a proper filename with correct extension if needed
      let finalFileName = this.sanitizeFileName(originalFileName);

      if (correctExtension !== currentExtension) {
        // File type was corrected, update the filename extension
        const nameWithoutExt = path.parse(originalFileName).name;
        finalFileName = this.sanitizeFileName(`${nameWithoutExt}.${correctExtension}`);
        this.log("info", `Correcting file extension: ${originalFileName} -> ${finalFileName}`);
      }

      const targetDir = path.join(basePath, this.options.outputDir, folderName);
      const targetPath = path.join(targetDir, finalFileName);

      // Handle duplicate filenames
      let finalTargetPath = targetPath;
      let counter = 1;
      while (await fs.pathExists(finalTargetPath)) {
        const nameWithoutExt = path.parse(finalFileName).name;
        const ext = path.parse(finalFileName).ext;
        finalTargetPath = path.join(
          targetDir,
          `${nameWithoutExt}_${counter}${ext}`
        );
        counter++;
      }

      if (!this.options.dryRun) {
        await this.ensureDirectory(targetDir);
        await fs.copy(filePath, finalTargetPath);
      }

      this.log(
        "info",
        `${
          this.options.dryRun ? "[DRY RUN] " : ""
        }Organized: ${filePath} -> ${finalTargetPath}`
      );
      this.stats.filesProcessed++;

      return finalTargetPath;
    } catch (error) {
      this.log("error", `Failed to organize file ${filePath}:`, error.message);
      this.stats.errors++;
      return null;
    }
  }

  async scanDirectory(dirPath, basePath = dirPath) {
    try {
      const items = await fs.readdir(dirPath);

      for (const item of items) {
        const itemPath = path.join(dirPath, item);
        const stat = await fs.stat(itemPath);

        if (stat.isDirectory()) {
          // Skip the output directory to avoid infinite loops
          if (path.basename(itemPath) === this.options.outputDir) {
            this.log("debug", `Skipping output directory: ${itemPath}`);
            continue;
          }

          this.log("debug", `Scanning directory: ${itemPath}`);
          await this.scanDirectory(itemPath, basePath);
        } else if (stat.isFile()) {
          const extension = this.getFileExtension(itemPath);

          // Check if it's an archive file
          if (this.options.extractArchives && this.isArchiveFile(extension)) {
            await this.handleArchiveFile(itemPath, basePath);
          } else {
            await this.copyFileToOrganizedLocation(itemPath, basePath);
          }
        }
      }
    } catch (error) {
      this.log("error", `Failed to scan directory ${dirPath}:`, error.message);
      this.stats.errors++;
    }
  }

  isArchiveFile(extension) {
    // Only handle ZIP and RAR files as specified in requirements
    const archiveExtensions = ["zip", "rar"];
    return archiveExtensions.includes(extension.toLowerCase());
  }

  async handleArchiveFile(archivePath, basePath) {
    this.log("info", `Found archive: ${archivePath}`);

    try {
      // Extract the archive first and organize its contents
      const extractedPath = await this.extractArchive(archivePath, basePath);
      if (extractedPath) {
        this.log("info", `Successfully extracted archive to: ${extractedPath}`);

        // Recursively scan and organize all extracted contents
        await this.scanDirectory(extractedPath, basePath);

        // Count extracted files
        const extractedCount = await this.countFilesInDirectory(extractedPath);
        this.log("info", `Organized ${extractedCount} files from archive: ${path.basename(archivePath)}`);

        // Clean up extracted directory after organizing
        if (!this.options.dryRun && this.options.cleanupExtracted !== false) {
          await fs.remove(extractedPath);
          this.log("debug", `Cleaned up extracted directory: ${extractedPath}`);
        }
      } else {
        this.log("warn", `Failed to extract archive: ${archivePath}`);
      }

      // Then copy the archive file itself to the appropriate folder
      await this.copyFileToOrganizedLocation(archivePath, basePath);

    } catch (error) {
      this.log(
        "error",
        `Failed to handle archive ${archivePath}:`,
        error.message
      );
      this.stats.errors++;

      // Still try to copy the archive file even if extraction failed
      try {
        await this.copyFileToOrganizedLocation(archivePath, basePath);
      } catch (copyError) {
        this.log("error", `Failed to copy archive file: ${copyError.message}`);
      }
    }
  }

  async extractArchive(archivePath, basePath) {
    const extension = this.getFileExtension(archivePath);
    const extractDir = path.join(
      basePath,
      "temp_extract",
      path.basename(archivePath, path.extname(archivePath))
    );

    try {
      if (!this.options.dryRun) {
        await this.ensureDirectory(extractDir);

        if (extension === "zip") {
          await this.extractZip(archivePath, extractDir);
        } else if (extension === "rar" || extension === "7z") {
          await this.extract7z(archivePath, extractDir);
        } else {
          this.log("warn", `Unsupported archive format: ${extension}`);
          return null;
        }
      }

      this.stats.archivesExtracted++;
      return extractDir;
    } catch (error) {
      this.log("error", `Failed to extract ${archivePath}:`, error.message);
      this.stats.errors++;
      return null;
    }
  }

  async extractZip(zipPath, extractDir) {
    const yauzl = require("yauzl");

    return new Promise((resolve, reject) => {
      yauzl.open(zipPath, { lazyEntries: true }, (err, zipfile) => {
        if (err) {
          this.log("error", `Failed to open ZIP file ${zipPath}: ${err.message}`);
          return reject(err);
        }

        let extractedFiles = 0;
        zipfile.readEntry();

        zipfile.on("entry", async (entry) => {
          try {
            if (/\/$/.test(entry.fileName)) {
              // Directory entry
              await fs.ensureDir(path.join(extractDir, entry.fileName));
              zipfile.readEntry();
            } else {
              // File entry
              zipfile.openReadStream(entry, async (err, readStream) => {
                if (err) {
                  this.log("warn", `Failed to read entry ${entry.fileName}: ${err.message}`);
                  zipfile.readEntry();
                  return;
                }

                const filePath = path.join(extractDir, entry.fileName);
                await fs.ensureDir(path.dirname(filePath));

                const writeStream = fs.createWriteStream(filePath);
                readStream.pipe(writeStream);

                writeStream.on("close", () => {
                  extractedFiles++;
                  this.log("debug", `Extracted: ${entry.fileName}`);
                  zipfile.readEntry();
                });

                writeStream.on("error", (err) => {
                  this.log("warn", `Failed to write ${entry.fileName}: ${err.message}`);
                  zipfile.readEntry();
                });
              });
            }
          } catch (error) {
            this.log("warn", `Error processing entry ${entry.fileName}: ${error.message}`);
            zipfile.readEntry();
          }
        });

        zipfile.on("end", () => {
          this.log("info", `ZIP extraction complete: ${extractedFiles} files extracted from ${path.basename(zipPath)}`);
          resolve();
        });

        zipfile.on("error", (err) => {
          this.log("error", `ZIP extraction error: ${err.message}`);
          reject(err);
        });
      });
    });
  }

  async extract7z(archivePath, extractDir) {
    try {
      const node7z = require("node-7z");

      return new Promise((resolve, reject) => {
        this.log("debug", `Starting 7z extraction: ${path.basename(archivePath)}`);

        const extractStream = node7z.extractFull(archivePath, extractDir, {
          $progress: true,
        });

        extractStream.on("data", (data) => {
          this.log("debug", `7z progress: ${data.file}`);
        });

        extractStream.on("end", () => {
          this.log("info", `7z extraction complete: ${path.basename(archivePath)}`);
          resolve();
        });

        extractStream.on("error", (err) => {
          this.log("error", `7z extraction failed for ${path.basename(archivePath)}: ${err.message}`);
          reject(err);
        });
      });
    } catch (error) {
      this.log("error", `7z module not available or failed to load: ${error.message}`);
      throw error;
    }
  }

  async organizeDirectories(directories) {
    this.log("info", chalk.green("Starting file organization..."));
    this.log("info", `Output directory: ${this.options.outputDir}`);
    this.log("info", `Extract archives: ${this.options.extractArchives}`);
    this.log("info", `Dry run: ${this.options.dryRun}`);

    for (const dir of directories) {
      if (await fs.pathExists(dir)) {
        this.log("info", chalk.cyan(`Processing directory: ${dir}`));
        await this.scanDirectory(dir);
      } else {
        this.log("warn", `Directory not found: ${dir}`);
      }
    }

    this.printStats();
  }

  printStats() {
    this.log("info", chalk.green("\n=== Organization Complete ==="));
    this.log("info", `Files processed: ${this.stats.filesProcessed}`);
    this.log("info", `Archives extracted: ${this.stats.archivesExtracted}`);
    this.log("info", `Files skipped (unsupported types): ${this.stats.skippedFiles}`);
    this.log("info", `Errors: ${this.stats.errors}`);

    // Show allowed file types
    this.log("info", chalk.cyan("\nSupported file types:"));
    const supportedTypes = this.allowedFileTypes.map(ext => `.${ext.toUpperCase()}`).join(', ');
    this.log("info", supportedTypes);

    if (this.options.dryRun) {
      this.log(
        "info",
        chalk.yellow("This was a dry run - no files were actually moved.")
      );
    }
  }
}

module.exports = FileOrganizer;
