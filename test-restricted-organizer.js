const fs = require('fs-extra');
const path = require('path');
const FileOrganizer = require('./fileOrganizer');

async function createRestrictedTestFiles() {
    const testDir = './test_restricted_files';
    
    // Clean up any existing test directory
    if (await fs.pathExists(testDir)) {
        await fs.remove(testDir);
    }
    
    // Create test directory structure
    await fs.ensureDir(testDir);
    await fs.ensureDir(path.join(testDir, 'subfolder'));
    await fs.ensureDir(path.join(testDir, 'archives'));
    
    // Create test files with allowed extensions
    const allowedTestFiles = [
        'photo.jpg',
        'image.jpeg', 
        'graphic.png',
        'vector.eps',
        'design.ai',
        'photoshop.psd',
        'document.pdf',
        'raw_photo.crw',
        'icon.svg',
        'corel.cdr'
    ];
    
    // Create test files with unsupported extensions (should be skipped)
    const unsupportedTestFiles = [
        'music.mp3',
        'video.mp4',
        'text.txt',
        'data.json',
        'script.js',
        'style.css',
        'readme.md',
        'no_extension_file'
    ];
    
    // Create allowed files in root test directory
    for (const file of allowedTestFiles) {
        await fs.writeFile(path.join(testDir, file), `Test content for ${file}`);
    }
    
    // Create unsupported files (these should be skipped)
    for (const file of unsupportedTestFiles) {
        await fs.writeFile(path.join(testDir, file), `Unsupported content for ${file}`);
    }
    
    // Create files in subdirectories
    await fs.writeFile(path.join(testDir, 'subfolder', 'nested_image.png'), 'Nested image content');
    await fs.writeFile(path.join(testDir, 'subfolder', 'nested_doc.pdf'), 'Nested document content');
    await fs.writeFile(path.join(testDir, 'subfolder', 'unsupported.txt'), 'This should be skipped');
    
    // Create mock archive files for testing
    await fs.writeFile(path.join(testDir, 'archives', 'test.zip'), 'PK\x03\x04Mock ZIP content');
    await fs.writeFile(path.join(testDir, 'archives', 'test.rar'), 'Rar!\x1a\x07\x00Mock RAR content');
    
    // Create a file with wrong extension (should be corrected)
    const jpegSignature = Buffer.from([0xFF, 0xD8, 0xFF, 0xE0]);
    const wrongExtFile = path.join(testDir, 'actually_jpeg.txt');
    await fs.writeFile(wrongExtFile, Buffer.concat([jpegSignature, Buffer.from('JPEG content with wrong extension')]));
    
    console.log('✅ Restricted test files created successfully!');
    console.log(`📁 Test directory: ${path.resolve(testDir)}`);
    
    return testDir;
}

async function runRestrictedTest() {
    try {
        console.log('🚀 Starting Restricted File Organizer Test\n');
        
        // Create test files
        const testDir = await createRestrictedTestFiles();
        
        // Show initial structure
        console.log('\n📋 Initial directory structure:');
        await showDirectoryStructure(testDir);
        
        // Run organizer in dry-run mode first
        console.log('\n🔍 Running dry-run test...');
        const dryRunOrganizer = new FileOrganizer({
            outputDir: 'organized_restricted',
            dryRun: true,
            logLevel: 'info'
        });
        
        await dryRunOrganizer.organizeDirectories([testDir]);
        
        // Run actual organization
        console.log('\n📦 Running actual organization...');
        const organizer = new FileOrganizer({
            outputDir: 'organized_restricted',
            extractArchives: true,
            logLevel: 'info'
        });
        
        await organizer.organizeDirectories([testDir]);
        
        // Show final structure
        console.log('\n📋 Final directory structure:');
        await showDirectoryStructure(testDir);
        
        console.log('\n✅ Restricted test completed successfully!');
        console.log('💡 Check the organized_restricted folder to see the results.');
        console.log('📝 Note: Only supported file types should be organized, others should be skipped.');
        
    } catch (error) {
        console.error('❌ Test failed:', error.message);
        console.error(error.stack);
    }
}

async function showDirectoryStructure(dirPath, prefix = '', maxDepth = 4, currentDepth = 0) {
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
    runRestrictedTest();
}

module.exports = { createRestrictedTestFiles, runRestrictedTest, showDirectoryStructure };
