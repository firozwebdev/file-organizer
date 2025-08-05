#!/usr/bin/env node

/**
 * Simple File Organizer - Easy to Use Interface
 * 
 * Usage:
 *   node organize.js                           # Interactive mode
 *   node organize.js <folder-path>             # Organize specific folder
 *   node organize.js <folder-path> <output>    # Organize with custom output
 */

const fs = require('fs-extra');
const path = require('path');
const readline = require('readline');
const chalk = require('chalk');
const FileOrganizer = require('./fileOrganizer');

class SimpleOrganizer {
    constructor() {
        this.rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout
        });
    }

    async run() {
        console.log(chalk.blue.bold('\n🎨 Design File Organizer'));
        console.log(chalk.gray('Organizes your design files into folders by type (jpg, png, eps, pdf, etc.)\n'));

        const args = process.argv.slice(2);

        if (args.length === 0) {
            await this.interactiveMode();
        } else if (args.length >= 1) {
            // Support multiple input folders
            await this.organizeFolders(args);
        } else {
            this.showHelp();
        }

        this.rl.close();
    }

    async interactiveMode() {
        console.log(chalk.yellow('📁 Interactive Mode'));
        console.log('You can:');
        console.log('1. Enter a folder path to organize');
        console.log('2. Drag and drop a folder here');
        console.log('3. Drag and drop MULTIPLE folders here');
        console.log('4. Type "help" for more options\n');

        const input = await this.question('Enter folder path (or drag & drop): ');

        if (input.toLowerCase() === 'help') {
            this.showHelp();
            return;
        }

        if (input.toLowerCase() === 'exit' || input.toLowerCase() === 'quit') {
            console.log(chalk.green('👋 Goodbye!'));
            return;
        }

        // Parse multiple folder paths (handles drag & drop of multiple folders)
        const folderPaths = this.parseMultiplePaths(input);

        if (folderPaths.length === 0) {
            console.log(chalk.red('❌ Please provide folder path(s)'));
            return;
        }

        if (folderPaths.length === 1) {
            console.log(chalk.blue(`\n📂 Found 1 folder to organize`));
        } else {
            console.log(chalk.blue(`\n📂 Found ${folderPaths.length} folders to organize`));
        }

        await this.organizeFolders(folderPaths);
    }

    async organizeFolders(inputPaths, outputName = 'organized_files') {
        try {
            // Validate all input paths first
            const validPaths = [];
            for (const inputPath of inputPaths) {
                const folderPath = path.resolve(inputPath);

                // Check if folder exists
                if (!await fs.pathExists(folderPath)) {
                    console.log(chalk.red(`❌ Folder not found: ${folderPath}`));
                    continue;
                }

                // Check if it's a directory
                const stat = await fs.stat(folderPath);
                if (!stat.isDirectory()) {
                    console.log(chalk.red(`❌ Path is not a directory: ${folderPath}`));
                    continue;
                }

                validPaths.push(folderPath);
            }

            if (validPaths.length === 0) {
                console.log(chalk.red('❌ No valid folders found'));
                return;
            }

            // Show what will be organized
            console.log(chalk.green(`\n📂 Organizing ${validPaths.length} folder(s):`));
            validPaths.forEach(folderPath => {
                console.log(chalk.gray(`  📁 ${folderPath}`));
            });

            // Output will be in current working directory (root)
            const outputPath = path.resolve(outputName);
            console.log(chalk.green(`\n📤 Output: ${outputPath}\n`));

            // Ask for confirmation
            const confirm = await this.question('Continue? (y/n): ');
            if (confirm.toLowerCase() !== 'y' && confirm.toLowerCase() !== 'yes') {
                console.log(chalk.yellow('❌ Cancelled'));
                return;
            }

            // Create a custom FileOrganizer that outputs to root directory
            const organizer = new FileOrganizer({
                outputDir: outputName,
                extractArchives: true,
                logLevel: 'info'
            });

            console.log(chalk.blue('\n🚀 Starting organization...\n'));

            // Organize all folders to the same root output directory
            await this.organizeToRoot(organizer, validPaths, outputPath);

            console.log(chalk.green.bold('\n✅ Organization Complete!'));
            console.log(chalk.gray(`📁 Check the "${outputName}" folder in the current directory`));

            // Show what was created
            if (await fs.pathExists(outputPath)) {
                console.log(chalk.cyan('\n📋 Created folders:'));
                const folders = await fs.readdir(outputPath);
                folders.forEach(folder => {
                    console.log(chalk.gray(`  📁 ${folder}/`));
                });
            }

        } catch (error) {
            console.log(chalk.red(`❌ Error: ${error.message}`));
        }
    }

    async organizeToRoot(organizer, inputPaths, outputPath) {
        // Create a temporary organizer that processes files to the root output directory
        const stats = {
            filesProcessed: 0,
            archivesExtracted: 0,
            skippedFiles: 0,
            errors: 0
        };

        for (const inputPath of inputPaths) {
            console.log(chalk.blue(`\n📂 Processing: ${path.basename(inputPath)}`));

            try {
                // Scan the directory and process files
                await this.processDirectoryToRoot(inputPath, outputPath, stats);
            } catch (error) {
                console.log(chalk.red(`❌ Error processing ${inputPath}: ${error.message}`));
                stats.errors++;
            }
        }

        // Show final stats
        console.log(chalk.cyan('\n📊 Summary:'));
        console.log(chalk.gray(`  Files processed: ${stats.filesProcessed}`));
        console.log(chalk.gray(`  Archives extracted: ${stats.archivesExtracted}`));
        console.log(chalk.gray(`  Files skipped: ${stats.skippedFiles}`));
        console.log(chalk.gray(`  Errors: ${stats.errors}`));
    }

    async processDirectoryToRoot(inputDir, outputDir, stats) {
        const items = await fs.readdir(inputDir);

        for (const item of items) {
            const itemPath = path.join(inputDir, item);
            const stat = await fs.stat(itemPath);

            if (stat.isDirectory()) {
                // Recursively process subdirectories
                await this.processDirectoryToRoot(itemPath, outputDir, stats);
            } else {
                // Process file
                await this.processFileToRoot(itemPath, outputDir, stats);
            }
        }
    }

    async processFileToRoot(filePath, outputDir, stats) {
        try {
            const organizer = new FileOrganizer({
                outputDir: path.basename(outputDir),
                extractArchives: true,
                logLevel: 'error' // Reduce noise
            });

            // Get file extension and check if supported
            const extension = organizer.getFileExtension(filePath);

            if (!organizer.isAllowedFileType(extension)) {
                stats.skippedFiles++;
                return;
            }

            // Handle archives specially
            if (organizer.isArchiveFile(extension)) {
                console.log(chalk.yellow(`📦 Extracting: ${path.basename(filePath)}`));

                // Extract to temp directory
                const tempDir = path.join(outputDir, '..', 'temp_extract');
                const extractedPath = await organizer.extractArchive(filePath, tempDir);

                if (extractedPath) {
                    stats.archivesExtracted++;
                    // Process extracted files
                    await this.processDirectoryToRoot(extractedPath, outputDir, stats);
                    // Clean up
                    await fs.remove(extractedPath);
                }
            }

            // Copy file to appropriate folder in root output
            const folderName = organizer.getFolderNameForExtension(extension);
            const targetDir = path.join(outputDir, folderName);
            const fileName = path.basename(filePath);

            await fs.ensureDir(targetDir);

            // Handle duplicates
            let targetPath = path.join(targetDir, fileName);
            let counter = 1;
            while (await fs.pathExists(targetPath)) {
                const nameWithoutExt = path.parse(fileName).name;
                const ext = path.parse(fileName).ext;
                targetPath = path.join(targetDir, `${nameWithoutExt}_${counter}${ext}`);
                counter++;
            }

            await fs.copy(filePath, targetPath);
            console.log(chalk.green(`✅ ${path.basename(filePath)} → ${folderName}/`));
            stats.filesProcessed++;

        } catch (error) {
            console.log(chalk.red(`❌ Failed to process ${path.basename(filePath)}: ${error.message}`));
            stats.errors++;
        }
    }

    showHelp() {
        console.log(chalk.blue.bold('\n🎨 Design File Organizer - Help\n'));
        
        console.log(chalk.yellow('📖 What it does:'));
        console.log('  • Organizes design files into folders by type');
        console.log('  • Extracts ZIP and RAR files automatically');
        console.log('  • Supports: JPG, PNG, EPS, PDF, AI, PSD, SVG, CDR, etc.');
        console.log('  • Fixes file naming issues automatically\n');

        console.log(chalk.yellow('🚀 Usage:'));
        console.log('  node organize.js                           # Interactive mode');
        console.log('  node organize.js <folder>                  # Organize one folder');
        console.log('  node organize.js <folder1> <folder2> ...   # Organize multiple folders\n');

        console.log(chalk.yellow('💡 Examples:'));
        console.log('  node organize.js ./my-design-files');
        console.log('  node organize.js "C:\\Downloads\\Design Bundle"');
        console.log('  node organize.js ./folder1 ./folder2 ./folder3');
        console.log('  node organize.js "./Design Bundle" "./Photos" "./Downloads"\n');

        console.log(chalk.yellow('📁 Drag & Drop:'));
        console.log('  1. Run: node organize.js');
        console.log('  2. Drag your folder(s) into the terminal');
        console.log('  3. Press Enter');
        console.log('  💡 Tip: You can drag multiple folders at once!\n');

        console.log(chalk.green('✨ Output: Creates "organized_files" folder in current directory with:'));
        console.log(chalk.gray('  📁 jpg/     📁 png/     📁 eps/     📁 pdf/'));
        console.log(chalk.gray('  📁 ai/      📁 psd/     📁 svg/     📁 zip/'));
        console.log(chalk.cyan('\n📍 Note: All folders are organized into ONE central location!'));
    }

    parseMultiplePaths(input) {
        if (!input || !input.trim()) {
            return [];
        }

        // Handle multiple paths that might be quoted
        // Example: "C:\folder 1" "C:\folder 2" or C:\folder1 C:\folder2
        const paths = [];
        let currentPath = '';
        let inQuotes = false;

        for (let i = 0; i < input.length; i++) {
            const char = input[i];

            if (char === '"') {
                inQuotes = !inQuotes;
            } else if (char === ' ' && !inQuotes) {
                if (currentPath.trim()) {
                    paths.push(currentPath.trim());
                    currentPath = '';
                }
            } else {
                currentPath += char;
            }
        }

        // Add the last path
        if (currentPath.trim()) {
            paths.push(currentPath.trim());
        }

        // If no spaces found, might be a single path with or without quotes
        if (paths.length === 0) {
            const singlePath = input.replace(/['"]/g, '').trim();
            if (singlePath) {
                paths.push(singlePath);
            }
        }

        return paths;
    }

    question(prompt) {
        return new Promise((resolve) => {
            this.rl.question(prompt, resolve);
        });
    }
}

// Run the simple organizer
if (require.main === module) {
    const organizer = new SimpleOrganizer();
    organizer.run().catch(console.error);
}

module.exports = SimpleOrganizer;
