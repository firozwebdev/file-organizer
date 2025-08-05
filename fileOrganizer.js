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

    this.stats = {
      filesProcessed: 0,
      foldersCreated: 0,
      archivesExtracted: 0,
      errors: 0,
      totalSize: 0,
      startTime: Date.now(),
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

  async copyFileToOrganizedLocation(filePath, basePath) {
    try {
      const extension = this.getFileExtension(filePath);
      const fileName = path.basename(filePath);
      const targetDir = path.join(basePath, this.options.outputDir, extension);
      const targetPath = path.join(targetDir, fileName);

      // Handle duplicate filenames
      let finalTargetPath = targetPath;
      let counter = 1;
      while (await fs.pathExists(finalTargetPath)) {
        const nameWithoutExt = path.parse(fileName).name;
        const ext = path.parse(fileName).ext;
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
        }Copied: ${filePath} -> ${finalTargetPath}`
      );
      this.stats.filesProcessed++;

      return finalTargetPath;
    } catch (error) {
      this.log("error", `Failed to copy file ${filePath}:`, error.message);
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
    const archiveExtensions = ["zip", "rar", "7z", "tar", "gz", "bz2", "xz"];
    return archiveExtensions.includes(extension);
  }

  async handleArchiveFile(archivePath, basePath) {
    this.log("info", `Found archive: ${archivePath}`);

    try {
      // First, copy the archive file itself
      await this.copyFileToOrganizedLocation(archivePath, basePath);

      // Then extract and organize its contents
      const extractedPath = await this.extractArchive(archivePath, basePath);
      if (extractedPath) {
        this.log("info", `Extracted archive to: ${extractedPath}`);
        await this.scanDirectory(extractedPath, basePath);

        // Clean up extracted directory after organizing
        if (!this.options.dryRun && this.options.cleanupExtracted !== false) {
          await fs.remove(extractedPath);
          this.log("debug", `Cleaned up extracted directory: ${extractedPath}`);
        }
      }
    } catch (error) {
      this.log(
        "error",
        `Failed to handle archive ${archivePath}:`,
        error.message
      );
      this.stats.errors++;
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
        if (err) return reject(err);

        zipfile.readEntry();
        zipfile.on("entry", async (entry) => {
          if (/\/$/.test(entry.fileName)) {
            // Directory entry
            await fs.ensureDir(path.join(extractDir, entry.fileName));
            zipfile.readEntry();
          } else {
            // File entry
            zipfile.openReadStream(entry, async (err, readStream) => {
              if (err) return reject(err);

              const filePath = path.join(extractDir, entry.fileName);
              await fs.ensureDir(path.dirname(filePath));

              const writeStream = fs.createWriteStream(filePath);
              readStream.pipe(writeStream);

              writeStream.on("close", () => {
                zipfile.readEntry();
              });
            });
          }
        });

        zipfile.on("end", () => resolve());
        zipfile.on("error", reject);
      });
    });
  }

  async extract7z(archivePath, extractDir) {
    const node7z = require("node-7z");

    return new Promise((resolve, reject) => {
      const extractStream = node7z.extractFull(archivePath, extractDir, {
        $progress: true,
      });

      extractStream.on("end", () => resolve());
      extractStream.on("error", reject);
    });
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
    this.log("info", `Errors: ${this.stats.errors}`);

    if (this.options.dryRun) {
      this.log(
        "info",
        chalk.yellow("This was a dry run - no files were actually moved.")
      );
    }
  }
}

module.exports = FileOrganizer;
