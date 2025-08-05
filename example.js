#!/usr/bin/env node

const FileOrganizer = require('./fileOrganizer');
const path = require('path');

async function runExample() {
    console.log('🚀 File Organizer Example\n');
    
    // Example 1: Organize the SUPER-BUNDLE directory
    console.log('📁 Example 1: Organizing SUPER-BUNDLE directory');
    console.log('This will organize the existing SUPER-BUNDLE-100-TS-DESIGN directory\n');
    
    const organizer1 = new FileOrganizer({
        outputDir: 'organized_bundle',
        extractArchives: true,
        logLevel: 'info',
        dryRun: true // Start with dry run to show what would happen
    });
    
    const bundleDir = './SUPER-BUNDLE-100-TS-DESIGN';
    
    try {
        console.log('🔍 Running dry-run first to preview changes...\n');
        await organizer1.organizeDirectories([bundleDir]);
        
        console.log('\n❓ To actually organize the files, run:');
        console.log('node example.js --execute\n');
        
        // Example 2: Show how to use programmatically
        console.log('📝 Example 2: Programmatic usage');
        console.log('Here\'s how you can use the FileOrganizer in your own code:\n');
        
        const exampleCode = `
const FileOrganizer = require('./fileOrganizer');

// Basic usage
const organizer = new FileOrganizer({
    outputDir: 'my_organized_files',
    extractArchives: true,
    logLevel: 'info'
});

await organizer.organizeDirectories(['./folder1', './folder2']);

// Advanced usage with all options
const advancedOrganizer = new FileOrganizer({
    outputDir: 'sorted_files',
    extractArchives: true,
    cleanupExtracted: true,
    dryRun: false,
    logLevel: 'debug',
    enableFileLogging: true,
    logFile: 'organizer.log'
});

await advancedOrganizer.organizeDirectories(['./messy-folder']);
        `;
        
        console.log(exampleCode);
        
    } catch (error) {
        console.error('❌ Error running example:', error.message);
    }
}

async function runActualOrganization() {
    console.log('🚀 Running actual file organization...\n');
    
    const organizer = new FileOrganizer({
        outputDir: 'organized_bundle',
        extractArchives: true,
        logLevel: 'info',
        dryRun: false
    });
    
    const bundleDir = './SUPER-BUNDLE-100-TS-DESIGN';
    
    try {
        await organizer.organizeDirectories([bundleDir]);
        console.log('\n✅ Organization complete!');
        console.log('📁 Check the "organized_bundle" folder to see the results.');
    } catch (error) {
        console.error('❌ Error during organization:', error.message);
    }
}

// Check command line arguments
const args = process.argv.slice(2);

if (args.includes('--execute')) {
    runActualOrganization();
} else {
    runExample();
}
