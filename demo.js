#!/usr/bin/env node

const fs = require('fs-extra');
const path = require('path');
const chalk = require('chalk');
const SmartFileOrganizer = require('./smartFileOrganizer');
const ConfigManager = require('./configManager');

async function createDemoFiles() {
    const demoDir = './demo_files';
    
    // Clean up any existing demo directory
    if (await fs.pathExists(demoDir)) {
        await fs.remove(demoDir);
    }
    
    console.log(chalk.blue('🎬 Creating demo files...'));
    
    // Create demo directory structure
    await fs.ensureDir(demoDir);
    await fs.ensureDir(path.join(demoDir, 'mixed_folder'));
    await fs.ensureDir(path.join(demoDir, 'downloads'));
    await fs.ensureDir(path.join(demoDir, 'projects', 'web_project'));
    await fs.ensureDir(path.join(demoDir, 'media', 'photos'));
    
    // Create various file types
    const demoFiles = [
        // Documents
        { path: 'mixed_folder/important_document.pdf', content: 'PDF document content' },
        { path: 'mixed_folder/meeting_notes.txt', content: 'Meeting notes from today' },
        { path: 'mixed_folder/presentation.pptx', content: 'PowerPoint presentation' },
        { path: 'mixed_folder/spreadsheet.xlsx', content: 'Excel spreadsheet data' },
        { path: 'downloads/manual.pdf', content: 'User manual PDF' },
        
        // Images
        { path: 'mixed_folder/vacation_photo.jpg', content: 'JPEG image data' },
        { path: 'mixed_folder/screenshot_2024.png', content: 'PNG screenshot' },
        { path: 'media/photos/family_photo.jpg', content: 'Family photo' },
        { path: 'media/photos/landscape.png', content: 'Landscape photo' },
        { path: 'mixed_folder/logo.svg', content: '<svg>Logo vector</svg>' },
        
        // Videos and Audio
        { path: 'mixed_folder/tutorial_video.mp4', content: 'MP4 video content' },
        { path: 'mixed_folder/song.mp3', content: 'MP3 audio content' },
        { path: 'downloads/movie.avi', content: 'AVI video file' },
        
        // Code files
        { path: 'projects/web_project/index.html', content: '<html><body>Hello World</body></html>' },
        { path: 'projects/web_project/style.css', content: 'body { margin: 0; }' },
        { path: 'projects/web_project/script.js', content: 'console.log("Hello World");' },
        { path: 'mixed_folder/config.json', content: '{"setting": "value"}' },
        { path: 'mixed_folder/data.xml', content: '<data><item>value</item></data>' },
        
        // Design files
        { path: 'mixed_folder/design.psd', content: 'Photoshop document' },
        { path: 'mixed_folder/vector.ai', content: 'Adobe Illustrator file' },
        { path: 'mixed_folder/poster.eps', content: 'EPS vector file' },
        
        // Archives (we'll create actual ZIP files)
        { path: 'downloads/backup.zip', content: 'ZIP archive content' },
        { path: 'mixed_folder/old_files.rar', content: 'RAR archive content' },
        
        // Other files
        { path: 'mixed_folder/readme.md', content: '# Project README\nThis is a markdown file.' },
        { path: 'mixed_folder/font.ttf', content: 'TrueType font data' },
        { path: 'mixed_folder/database.db', content: 'SQLite database' },
        { path: 'mixed_folder/no_extension_file', content: 'File without extension' },
        
        // Hidden files
        { path: 'mixed_folder/.hidden_config', content: 'Hidden configuration file' },
        { path: 'projects/.gitignore', content: 'node_modules/\n*.log' },
        
        // Large variety for testing
        { path: 'downloads/ebook.epub', content: 'EPUB ebook content' },
        { path: 'mixed_folder/3d_model.obj', content: '3D model data' },
        { path: 'mixed_folder/executable.exe', content: 'Windows executable' },
        { path: 'mixed_folder/backup_old.bak', content: 'Backup file content' }
    ];
    
    // Create all demo files
    for (const file of demoFiles) {
        const filePath = path.join(demoDir, file.path);
        await fs.ensureDir(path.dirname(filePath));
        await fs.writeFile(filePath, file.content);
    }
    
    // Create a real ZIP file with some content
    const zipContent = {
        'extracted_file1.txt': 'Content from ZIP file 1',
        'extracted_file2.jpg': 'JPEG from ZIP',
        'subfolder/nested_file.pdf': 'PDF from ZIP subfolder'
    };
    
    // Note: In a real implementation, you'd use a ZIP library here
    // For demo purposes, we'll just create the ZIP as a text file
    
    console.log(chalk.green(`✅ Created ${demoFiles.length} demo files in ${demoDir}`));
    console.log(chalk.gray('📁 Demo structure:'));
    console.log(chalk.gray('   ├── mixed_folder/     (Various file types mixed together)'));
    console.log(chalk.gray('   ├── downloads/        (Downloaded files)'));
    console.log(chalk.gray('   ├── projects/         (Code and project files)'));
    console.log(chalk.gray('   └── media/           (Photos and media files)'));
    
    return demoDir;
}

async function runSmartDemo() {
    console.log(chalk.blue.bold('\n🚀 Smart File Organizer 2.0 - Demo\n'));
    
    try {
        // Create demo files
        const demoDir = await createDemoFiles();
        
        // Initialize configuration
        const configManager = new ConfigManager();
        await configManager.initialize();
        
        console.log(chalk.cyan('\n📋 Available presets:'));
        configManager.displayPresets();
        
        // Demo 1: Default smart organization
        console.log(chalk.blue('\n🎯 Demo 1: Smart Organization with Default Settings'));
        console.log(chalk.gray('This will organize files using intelligent categorization\n'));
        
        const config1 = await configManager.loadConfig();
        const organizer1 = new SmartFileOrganizer({
            outputPath: path.join(demoDir, 'Smart_Organized_Default'),
            config: config1,
            dryRun: false
        });
        
        await organizer1.organizeDirectories([path.join(demoDir, 'mixed_folder')]);
        
        // Demo 2: Media-focused preset
        console.log(chalk.blue('\n🎬 Demo 2: Media-Focused Organization'));
        console.log(chalk.gray('Using media-focused preset for photos and videos\n'));
        
        const config2 = await configManager.loadPreset('media-focused');
        const organizer2 = new SmartFileOrganizer({
            outputPath: path.join(demoDir, 'Smart_Organized_Media'),
            config: config2,
            dryRun: false
        });
        
        await organizer2.organizeDirectories([path.join(demoDir, 'media')]);
        
        // Demo 3: Developer preset
        console.log(chalk.blue('\n💻 Demo 3: Developer-Focused Organization'));
        console.log(chalk.gray('Using developer preset for code files\n'));
        
        const config3 = await configManager.loadPreset('developer');
        const organizer3 = new SmartFileOrganizer({
            outputPath: path.join(demoDir, 'Smart_Organized_Code'),
            config: config3,
            dryRun: false
        });
        
        await organizer3.organizeDirectories([path.join(demoDir, 'projects')]);
        
        // Demo 4: Dry run with all files
        console.log(chalk.blue('\n🔍 Demo 4: Dry Run Analysis'));
        console.log(chalk.gray('Analyzing all demo files without moving them\n'));
        
        const organizer4 = new SmartFileOrganizer({
            outputPath: path.join(demoDir, 'Smart_Organized_DryRun'),
            config: config1,
            dryRun: true
        });
        
        await organizer4.organizeDirectories([demoDir]);
        
        // Show final results
        console.log(chalk.green('\n🎉 Demo Complete!'));
        console.log(chalk.blue('📁 Check the following directories to see the results:'));
        console.log(chalk.white(`   • ${path.join(demoDir, 'Smart_Organized_Default')} - Default smart organization`));
        console.log(chalk.white(`   • ${path.join(demoDir, 'Smart_Organized_Media')} - Media-focused organization`));
        console.log(chalk.white(`   • ${path.join(demoDir, 'Smart_Organized_Code')} - Developer-focused organization`));
        
        console.log(chalk.cyan('\n📊 Each organized folder contains:'));
        console.log(chalk.gray('   ├── Categories/       (Smart categorized files)'));
        console.log(chalk.gray('   ├── Archives/         (Extracted archive contents)'));
        console.log(chalk.gray('   ├── Reports/          (Detailed organization reports)'));
        console.log(chalk.gray('   └── README.md         (Welcome guide)'));
        
        console.log(chalk.yellow('\n💡 Try the interactive mode:'));
        console.log(chalk.white('   node interactiveCli.js'));
        
        console.log(chalk.yellow('\n💡 Or use the enhanced CLI:'));
        console.log(chalk.white('   node cli.js --help'));
        console.log(chalk.white('   node cli.js ./demo_files -i'));
        console.log(chalk.white('   node cli.js ./demo_files -p media-focused'));
        
    } catch (error) {
        console.error(chalk.red('❌ Demo failed:'), error.message);
        if (process.argv.includes('--verbose')) {
            console.error(error.stack);
        }
    }
}

// Run demo if this file is executed directly
if (require.main === module) {
    runSmartDemo();
}

module.exports = { createDemoFiles, runSmartDemo };
