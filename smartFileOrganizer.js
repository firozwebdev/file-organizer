const fs = require('fs-extra');
const path = require('path');
const chalk = require('chalk');

const OutputManager = require('./outputManager');
const SmartCategorizer = require('./categorizer');
const AdvancedProgressTracker = require('./progressTracker');
const ConfigManager = require('./configManager');
const { Logger, ErrorHandler, getDirectorySize, formatBytes } = require('./utils');

class SmartFileOrganizer {
    constructor(options = {}) {
        this.options = {
            outputPath: options.outputPath || null,
            config: options.config || null,
            dryRun: options.dryRun || false,
            ...options
        };

        this.configManager = new ConfigManager();
        this.outputManager = new OutputManager();
        this.categorizer = new SmartCategorizer();
        this.progressTracker = new AdvancedProgressTracker();
        
        this.logger = new Logger();
        this.errorHandler = new ErrorHandler(this.logger);
        
        this.stats = {
            filesProcessed: 0,
            archivesExtracted: 0,
            errors: 0,
            totalSize: 0,
            startTime: Date.now(),
            categories: {}
        };

        this.outputStructure = null;
        this.categoryStructure = null;
    }

    async initialize() {
        // Load configuration
        if (!this.options.config) {
            await this.configManager.initialize();
            this.options.config = await this.configManager.loadConfig();
        }

        // Configure logger
        this.logger.setLevel(this.options.config.general.logLevel);
        if (this.options.config.general.enableFileLogging) {
            this.logger.enableFileLogging('file-organizer.log');
        }

        this.logger.info('Smart File Organizer initialized');
    }

    async organizeDirectories(directories) {
        await this.initialize();

        this.logger.info(chalk.green('🚀 Starting Smart File Organization'));
        this.progressTracker.showPhasesSummary();

        try {
            // Phase 1: Scanning
            this.progressTracker.setPhase('scanning');
            const allFiles = await this.scanDirectories(directories);
            
            if (allFiles.length === 0) {
                this.logger.warn('No files found to organize');
                return;
            }

            // Phase 2: Analyzing
            this.progressTracker.setPhase('analyzing');
            const analysis = await this.analyzeFiles(allFiles);
            
            // Phase 3: Setup output structure
            await this.setupOutputStructure(directories, analysis);
            
            // Phase 4: Organizing
            this.progressTracker.setPhase('organizing');
            this.progressTracker.setTotal(allFiles.length, analysis.totalSize);
            
            await this.processFiles(allFiles);

            // Phase 5: Finalizing
            this.progressTracker.setPhase('finalizing');
            await this.generateReports();
            
            const finalStats = this.progressTracker.complete();
            await this.outputManager.displayOutputInfo(this.outputStructure.outputPath, finalStats);

        } catch (error) {
            this.errorHandler.handleError(error, 'Organization process');
            throw error;
        }
    }

    async scanDirectories(directories) {
        const allFiles = [];
        let totalFilesFound = 0;

        for (const directory of directories) {
            this.logger.info(`Scanning directory: ${directory}`);
            const files = await this.scanDirectoryRecursive(directory);
            allFiles.push(...files);
            totalFilesFound += files.length;
            
            this.progressTracker.displayScanningProgress(directory, totalFilesFound);
        }

        this.logger.info(`\nFound ${allFiles.length} files to process`);
        return allFiles;
    }

    async scanDirectoryRecursive(dirPath) {
        const files = [];
        
        try {
            const items = await fs.readdir(dirPath);
            
            for (const item of items) {
                const itemPath = path.join(dirPath, item);
                
                try {
                    const stat = await fs.stat(itemPath);
                    
                    if (stat.isDirectory()) {
                        // Skip output directory and system directories
                        if (this.shouldSkipDirectory(itemPath)) {
                            continue;
                        }
                        
                        const subFiles = await this.scanDirectoryRecursive(itemPath);
                        files.push(...subFiles);
                    } else if (stat.isFile()) {
                        if (this.shouldIncludeFile(itemPath, stat)) {
                            files.push({
                                path: itemPath,
                                size: stat.size,
                                modified: stat.mtime
                            });
                        }
                    }
                } catch (error) {
                    this.errorHandler.handleError(error, `Accessing ${itemPath}`);
                }
            }
        } catch (error) {
            this.errorHandler.handleError(error, `Reading directory ${dirPath}`);
        }

        return files;
    }

    shouldSkipDirectory(dirPath) {
        const config = this.options.config;
        const dirName = path.basename(dirPath);
        
        // Skip hidden directories if configured
        if (config.filters.excludeHidden && dirName.startsWith('.')) {
            return true;
        }

        // Skip system directories
        const systemDirs = ['System Volume Information', '$RECYCLE.BIN', 'node_modules', '.git'];
        if (systemDirs.includes(dirName)) {
            return true;
        }

        // Skip our own output directory
        if (this.outputStructure && dirPath.startsWith(this.outputStructure.outputPath)) {
            return true;
        }

        return false;
    }

    shouldIncludeFile(filePath, stat) {
        const config = this.options.config;
        const fileName = path.basename(filePath);
        const extension = path.extname(fileName).toLowerCase().slice(1);

        // Skip hidden files if configured
        if (config.filters.excludeHidden && fileName.startsWith('.')) {
            return false;
        }

        // Check file size limits
        if (config.filters.minFileSize > 0 && stat.size < config.filters.minFileSize) {
            return false;
        }
        if (config.filters.maxFileSize > 0 && stat.size > config.filters.maxFileSize) {
            return false;
        }

        // Check extension filters
        if (config.filters.excludeExtensions.length > 0 && config.filters.excludeExtensions.includes(extension)) {
            return false;
        }
        if (config.filters.includeExtensions.length > 0 && !config.filters.includeExtensions.includes(extension)) {
            return false;
        }

        return true;
    }

    async analyzeFiles(files) {
        const analysis = {
            totalFiles: files.length,
            totalSize: 0,
            categories: {},
            archives: [],
            largestFiles: [],
            oldestFiles: [],
            newestFiles: []
        };

        let analyzed = 0;
        for (const file of files) {
            analysis.totalSize += file.size;
            
            const categorization = this.categorizer.categorizeFile(file.path);
            const category = categorization.category;
            
            if (!analysis.categories[category]) {
                analysis.categories[category] = {
                    count: 0,
                    size: 0,
                    icon: categorization.icon,
                    description: categorization.description
                };
            }
            
            analysis.categories[category].count++;
            analysis.categories[category].size += file.size;

            // Track archives
            if (category === 'Archives') {
                analysis.archives.push(file);
            }

            analyzed++;
            this.progressTracker.displayAnalyzingProgress(path.basename(file.path), analyzed);
        }

        // Sort files for reporting
        analysis.largestFiles = files.sort((a, b) => b.size - a.size).slice(0, 10);
        analysis.oldestFiles = files.sort((a, b) => a.modified - b.modified).slice(0, 5);
        analysis.newestFiles = files.sort((a, b) => b.modified - a.modified).slice(0, 5);

        this.logger.info(`\nAnalysis complete: ${analysis.totalFiles} files, ${formatBytes(analysis.totalSize)}`);
        return analysis;
    }

    async setupOutputStructure(directories, analysis) {
        // Determine output path
        let outputPath = this.options.outputPath;
        if (!outputPath) {
            const suggestions = this.outputManager.getSmartOutputPath(directories);
            outputPath = suggestions[0].path;
        }

        // Create output structure
        this.outputStructure = await this.outputManager.createOutputStructure(outputPath, directories);
        
        // Create category structure
        if (this.options.config.organization.useSmartCategories) {
            this.categoryStructure = await this.categorizer.createCategoryStructure(this.outputStructure.categoriesPath);
        }

        this.logger.info(`Output structure created at: ${outputPath}`);
    }

    async processFiles(files) {
        const concurrency = this.options.config.performance.maxConcurrentFiles;
        const chunks = this.chunkArray(files, concurrency);

        for (const chunk of chunks) {
            await Promise.all(chunk.map(file => this.processFile(file)));
        }
    }

    async processFile(file) {
        try {
            const categorization = this.categorizer.categorizeFile(file.path);
            
            let targetPath;
            if (this.options.config.organization.useSmartCategories) {
                targetPath = this.categorizer.getOrganizedPath(
                    this.outputStructure.categoriesPath,
                    file.path,
                    categorization
                );
            } else {
                // Simple extension-based organization
                const extension = path.extname(file.path).toLowerCase().slice(1) || 'no-extension';
                targetPath = path.join(this.outputStructure.categoriesPath, extension, path.basename(file.path));
            }

            // Handle duplicates
            targetPath = await this.handleDuplicates(targetPath);

            // Copy file
            if (!this.options.dryRun) {
                await fs.ensureDir(path.dirname(targetPath));
                await fs.copy(file.path, targetPath);
            }

            // Update statistics
            this.stats.filesProcessed++;
            this.stats.totalSize += file.size;
            
            if (this.categoryStructure && this.categoryStructure[categorization.category]) {
                await this.categorizer.updateCategoryStats(
                    this.categoryStructure,
                    categorization.category,
                    file.size
                );
            }

            // Update progress
            this.progressTracker.updateProgress(1, file.size, categorization.category);

            // Handle archives
            if (categorization.category === 'Archives' && this.options.config.organization.extractArchives) {
                await this.handleArchive(file.path, targetPath);
            }

            this.logger.debug(`${this.options.dryRun ? '[DRY RUN] ' : ''}Organized: ${file.path} -> ${targetPath}`);

        } catch (error) {
            this.errorHandler.handleError(error, `Processing file ${file.path}`);
            this.stats.errors++;
            this.progressTracker.incrementErrors();
        }
    }

    async handleDuplicates(targetPath) {
        const config = this.options.config.organization.handleDuplicates;
        
        if (!await fs.pathExists(targetPath)) {
            return targetPath;
        }

        switch (config) {
            case 'skip':
                this.logger.debug(`Skipping duplicate: ${targetPath}`);
                return null;
                
            case 'overwrite':
                this.logger.debug(`Overwriting: ${targetPath}`);
                return targetPath;
                
            case 'rename':
            default:
                let counter = 1;
                const ext = path.extname(targetPath);
                const base = path.basename(targetPath, ext);
                const dir = path.dirname(targetPath);
                
                let newPath;
                do {
                    newPath = path.join(dir, `${base}_${counter}${ext}`);
                    counter++;
                } while (await fs.pathExists(newPath));
                
                this.logger.debug(`Renamed duplicate: ${targetPath} -> ${newPath}`);
                return newPath;
        }
    }

    async handleArchive(originalPath, copiedPath) {
        // Implementation would go here for archive extraction
        // This is a placeholder for the archive handling logic
        this.stats.archivesExtracted++;
        this.progressTracker.incrementArchives();
        this.logger.info(`Archive processed: ${originalPath}`);
    }

    async generateReports() {
        if (!this.outputStructure) return;

        const reportData = {
            timestamp: new Date().toISOString(),
            summary: this.outputManager.generateOutputSummary(this.outputStructure.outputPath, this.stats),
            categories: this.categoryStructure ? this.categorizer.generateCategoryReport(this.categoryStructure) : null,
            errors: this.errorHandler.getErrorSummary()
        };

        // Save detailed report
        const reportPath = path.join(this.outputStructure.reportsPath, 'organization-report.json');
        await fs.writeJson(reportPath, reportData, { spaces: 2 });

        // Save error report if there were errors
        if (reportData.errors.count > 0) {
            await this.errorHandler.saveErrorReport(path.join(this.outputStructure.reportsPath, 'errors.json'));
        }

        this.logger.info(`Reports generated in: ${this.outputStructure.reportsPath}`);
    }

    chunkArray(array, chunkSize) {
        const chunks = [];
        for (let i = 0; i < array.length; i += chunkSize) {
            chunks.push(array.slice(i, i + chunkSize));
        }
        return chunks;
    }
}

module.exports = SmartFileOrganizer;
