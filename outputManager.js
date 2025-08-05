const fs = require('fs-extra');
const path = require('path');
const chalk = require('chalk');

class OutputManager {
    constructor(options = {}) {
        this.options = {
            baseOutputDir: options.baseOutputDir || 'FileOrganizer_Output',
            createTimestampedFolders: options.createTimestampedFolders !== false,
            createSourceFolders: options.createSourceFolders !== false,
            autoOpenOutput: options.autoOpenOutput !== false,
            generateReport: options.generateReport !== false,
            ...options
        };
    }

    generateOutputPath(sourcePaths, customName = null) {
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
        
        if (customName) {
            return customName;
        }

        if (this.options.createTimestampedFolders) {
            return path.join(this.options.baseOutputDir, `Organized_${timestamp}`);
        }

        if (sourcePaths.length === 1) {
            const sourceName = path.basename(sourcePaths[0]);
            return path.join(this.options.baseOutputDir, `${sourceName}_Organized`);
        }

        return path.join(this.options.baseOutputDir, `MultiFolder_Organized_${timestamp}`);
    }

    async createOutputStructure(outputPath, sourcePaths) {
        const structure = {
            outputPath: outputPath,
            categoriesPath: path.join(outputPath, 'Categories'),
            archivesPath: path.join(outputPath, 'Archives'),
            reportsPath: path.join(outputPath, 'Reports'),
            sourceFolders: {}
        };

        // Create main directories
        await fs.ensureDir(structure.outputPath);
        await fs.ensureDir(structure.categoriesPath);
        await fs.ensureDir(structure.archivesPath);
        await fs.ensureDir(structure.reportsPath);

        // Create source-specific folders if enabled
        if (this.options.createSourceFolders && sourcePaths.length > 1) {
            for (const sourcePath of sourcePaths) {
                const sourceName = path.basename(sourcePath);
                const sourceFolder = path.join(structure.categoriesPath, `From_${sourceName}`);
                await fs.ensureDir(sourceFolder);
                structure.sourceFolders[sourcePath] = sourceFolder;
            }
        }

        // Create welcome file
        await this.createWelcomeFile(structure);

        return structure;
    }

    async createWelcomeFile(structure) {
        const welcomeContent = `
# 🎉 File Organization Complete!

Welcome to your organized files! This folder was created by the File Organizer tool.

## 📁 Folder Structure:

### Categories/
Contains all your files organized by type:
- **Documents**: PDF, DOC, TXT, etc.
- **Images**: JPG, PNG, GIF, etc.
- **Videos**: MP4, AVI, MOV, etc.
- **Audio**: MP3, WAV, FLAC, etc.
- **Archives**: ZIP, RAR, 7Z, etc.
- **Code**: JS, HTML, CSS, etc.
- **And more...**

### Archives/
Contains extracted archive files and their original archives.

### Reports/
Contains detailed reports about the organization process:
- File counts and sizes
- Processing logs
- Error reports (if any)

## 🔍 Quick Stats:
- Organization Date: ${new Date().toLocaleString()}
- Tool Version: File Organizer v2.0

## 💡 Tips:
- Check the Reports folder for detailed information
- Original files remain in their source locations
- Duplicates are automatically renamed with numbers
- Archive contents are extracted and organized

Happy organizing! 🚀
`;

        await fs.writeFile(
            path.join(structure.outputPath, 'README.md'),
            welcomeContent.trim()
        );
    }

    getSmartOutputPath(sourcePaths, options = {}) {
        // Analyze source paths to suggest intelligent output location
        const suggestions = [];

        // Option 1: Desktop folder (most accessible)
        const desktopPath = path.join(require('os').homedir(), 'Desktop', 'FileOrganizer_Output');
        suggestions.push({
            path: desktopPath,
            reason: 'Desktop location for easy access',
            priority: 1
        });

        // Option 2: Same directory as first source
        if (sourcePaths.length > 0) {
            const sourceDir = path.dirname(sourcePaths[0]);
            const sameDirPath = path.join(sourceDir, 'Organized_Files');
            suggestions.push({
                path: sameDirPath,
                reason: 'Same location as source files',
                priority: 2
            });
        }

        // Option 3: Documents folder
        const documentsPath = path.join(require('os').homedir(), 'Documents', 'FileOrganizer_Output');
        suggestions.push({
            path: documentsPath,
            reason: 'Documents folder for permanent storage',
            priority: 3
        });

        // Option 4: Current working directory
        const cwdPath = path.join(process.cwd(), 'FileOrganizer_Output');
        suggestions.push({
            path: cwdPath,
            reason: 'Current working directory',
            priority: 4
        });

        return suggestions.sort((a, b) => a.priority - b.priority);
    }

    async validateOutputPath(outputPath) {
        const validation = {
            isValid: true,
            issues: [],
            suggestions: []
        };

        try {
            // Check if path exists and is writable
            const parentDir = path.dirname(outputPath);
            
            if (!await fs.pathExists(parentDir)) {
                validation.issues.push('Parent directory does not exist');
                validation.suggestions.push('Create parent directory first');
            }

            // Check write permissions
            try {
                await fs.access(parentDir, fs.constants.W_OK);
            } catch (error) {
                validation.issues.push('No write permission to parent directory');
                validation.suggestions.push('Choose a different location or run with elevated permissions');
            }

            // Check if output path already exists
            if (await fs.pathExists(outputPath)) {
                const stat = await fs.stat(outputPath);
                if (stat.isDirectory()) {
                    const files = await fs.readdir(outputPath);
                    if (files.length > 0) {
                        validation.issues.push('Output directory already exists and is not empty');
                        validation.suggestions.push('Use a different name or enable backup mode');
                    }
                } else {
                    validation.issues.push('Output path exists but is not a directory');
                    validation.suggestions.push('Choose a different path');
                }
            }

            // Check available disk space
            const stats = await fs.statSync(parentDir);
            // Note: This is a simplified check, in production you'd want to check actual disk space

        } catch (error) {
            validation.isValid = false;
            validation.issues.push(`Path validation error: ${error.message}`);
        }

        validation.isValid = validation.issues.length === 0;
        return validation;
    }

    async createBackupIfExists(outputPath) {
        if (await fs.pathExists(outputPath)) {
            const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
            const backupPath = `${outputPath}_backup_${timestamp}`;
            
            console.log(chalk.yellow(`⚠️  Output directory exists. Creating backup: ${backupPath}`));
            await fs.move(outputPath, backupPath);
            
            return backupPath;
        }
        return null;
    }

    async openOutputFolder(outputPath) {
        if (!this.options.autoOpenOutput) return;

        try {
            const { exec } = require('child_process');
            const platform = process.platform;

            let command;
            if (platform === 'win32') {
                command = `explorer "${outputPath}"`;
            } else if (platform === 'darwin') {
                command = `open "${outputPath}"`;
            } else {
                command = `xdg-open "${outputPath}"`;
            }

            exec(command, (error) => {
                if (error) {
                    console.log(chalk.yellow(`📁 Output folder: ${outputPath}`));
                } else {
                    console.log(chalk.green(`📂 Opened output folder: ${outputPath}`));
                }
            });
        } catch (error) {
            console.log(chalk.yellow(`📁 Output folder: ${outputPath}`));
        }
    }

    generateOutputSummary(outputPath, stats) {
        return {
            outputLocation: outputPath,
            timestamp: new Date().toISOString(),
            summary: {
                totalFiles: stats.filesProcessed,
                totalArchives: stats.archivesExtracted,
                totalErrors: stats.errors,
                totalSize: stats.totalSize,
                processingTime: Date.now() - stats.startTime
            },
            structure: {
                categoriesFolder: path.join(outputPath, 'Categories'),
                archivesFolder: path.join(outputPath, 'Archives'),
                reportsFolder: path.join(outputPath, 'Reports')
            }
        };
    }

    async displayOutputInfo(outputPath, stats) {
        console.log(chalk.green('\n🎉 Organization Complete!'));
        console.log(chalk.blue('📁 Output Location:'), chalk.white(outputPath));
        console.log(chalk.blue('📊 Files Processed:'), chalk.white(stats.filesProcessed));
        console.log(chalk.blue('📦 Archives Extracted:'), chalk.white(stats.archivesExtracted));
        
        if (stats.errors > 0) {
            console.log(chalk.red('❌ Errors:'), chalk.white(stats.errors));
        }

        const processingTime = ((Date.now() - stats.startTime) / 1000).toFixed(1);
        console.log(chalk.blue('⏱️  Processing Time:'), chalk.white(`${processingTime}s`));

        console.log(chalk.green('\n📂 Folder Structure:'));
        console.log(chalk.gray('├── Categories/     '), chalk.white('(Files organized by type)'));
        console.log(chalk.gray('├── Archives/       '), chalk.white('(Extracted archives)'));
        console.log(chalk.gray('├── Reports/        '), chalk.white('(Processing reports)'));
        console.log(chalk.gray('└── README.md       '), chalk.white('(Welcome guide)'));

        await this.openOutputFolder(outputPath);
    }
}

module.exports = OutputManager;
