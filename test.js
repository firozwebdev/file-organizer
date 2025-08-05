const fs = require('fs-extra');
const path = require('path');
const FileOrganizer = require('./fileOrganizer');

async function createTestFiles() {
    const testDir = './test_files';
    
    // Clean up any existing test directory
    if (await fs.pathExists(testDir)) {
        await fs.remove(testDir);
    }
    
    // Create test directory structure
    await fs.ensureDir(testDir);
    await fs.ensureDir(path.join(testDir, 'subfolder'));
    await fs.ensureDir(path.join(testDir, 'nested', 'deep'));
    
    // Create test files with different extensions
    const testFiles = [
        'document.pdf',
        'image.jpg',
        'photo.png',
        'music.mp3',
        'video.mp4',
        'text.txt',
        'data.json',
        'script.js',
        'style.css',
        'readme.md',
        'no_extension_file'
    ];
    
    // Create files in root test directory
    for (const file of testFiles) {
        await fs.writeFile(path.join(testDir, file), `Test content for ${file}`);
    }
    
    // Create files in subdirectories
    await fs.writeFile(path.join(testDir, 'subfolder', 'nested_image.png'), 'Nested image content');
    await fs.writeFile(path.join(testDir, 'subfolder', 'nested_doc.pdf'), 'Nested document content');
    await fs.writeFile(path.join(testDir, 'nested', 'deep', 'deep_file.txt'), 'Deep nested file');
    
    console.log('✅ Test files created successfully!');
    console.log(`📁 Test directory: ${path.resolve(testDir)}`);
    
    return testDir;
}

async function runTest() {
    try {
        console.log('🚀 Starting File Organizer Test\n');
        
        // Create test files
        const testDir = await createTestFiles();
        
        // Show initial structure
        console.log('\n📋 Initial directory structure:');
        await showDirectoryStructure(testDir);
        
        // Run organizer in dry-run mode first
        console.log('\n🔍 Running dry-run test...');
        const dryRunOrganizer = new FileOrganizer({
            outputDir: 'organized_test',
            dryRun: true,
            logLevel: 'info'
        });
        
        await dryRunOrganizer.organizeDirectories([testDir]);
        
        // Run actual organization
        console.log('\n📦 Running actual organization...');
        const organizer = new FileOrganizer({
            outputDir: 'organized_test',
            extractArchives: true,
            logLevel: 'info'
        });
        
        await organizer.organizeDirectories([testDir]);
        
        // Show final structure
        console.log('\n📋 Final directory structure:');
        await showDirectoryStructure(testDir);
        
        console.log('\n✅ Test completed successfully!');
        console.log('💡 You can now check the organized_test folder to see the results.');
        
    } catch (error) {
        console.error('❌ Test failed:', error.message);
        console.error(error.stack);
    }
}

async function showDirectoryStructure(dirPath, prefix = '', maxDepth = 3, currentDepth = 0) {
    if (currentDepth >= maxDepth) return;
    
    try {
        const items = await fs.readdir(dirPath);
        items.sort();
        
        for (let i = 0; i < items.length; i++) {
            const item = items[i];
            const itemPath = path.join(dirPath, item);
            const isLast = i === items.length - 1;
            const currentPrefix = prefix + (isLast ? '└── ' : '├── ');
            const nextPrefix = prefix + (isLast ? '    ' : '│   ');
            
            console.log(currentPrefix + item);
            
            const stat = await fs.stat(itemPath);
            if (stat.isDirectory() && currentDepth < maxDepth - 1) {
                await showDirectoryStructure(itemPath, nextPrefix, maxDepth, currentDepth + 1);
            }
        }
    } catch (error) {
        console.log(prefix + '❌ Error reading directory');
    }
}

// Run the test if this file is executed directly
if (require.main === module) {
    runTest();
}

module.exports = { createTestFiles, runTest, showDirectoryStructure };
