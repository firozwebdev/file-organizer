const fs = require('fs-extra');
const path = require('path');
const FileOrganizer = require('./fileOrganizer');

async function createTestArchive() {
    const testDir = './test_archive_extraction';
    
    // Clean up any existing test directory
    if (await fs.pathExists(testDir)) {
        await fs.remove(testDir);
    }
    
    // Create test directory structure
    await fs.ensureDir(testDir);
    await fs.ensureDir(path.join(testDir, 'temp_files'));
    
    // Create test files to be zipped
    const tempDir = path.join(testDir, 'temp_files');
    await fs.writeFile(path.join(tempDir, 'design1.eps'), 'EPS file content for testing');
    await fs.writeFile(path.join(tempDir, 'photo1.jpg'), 'JPG file content for testing');
    await fs.writeFile(path.join(tempDir, 'image1.png'), 'PNG file content for testing');
    await fs.writeFile(path.join(tempDir, 'document1.pdf'), 'PDF file content for testing');
    await fs.writeFile(path.join(tempDir, 'graphic1.svg'), 'SVG file content for testing');
    await fs.writeFile(path.join(tempDir, 'design2.ai'), 'AI file content for testing');
    await fs.writeFile(path.join(tempDir, 'photo2.psd'), 'PSD file content for testing');
    
    // Create a simple ZIP file using Node.js built-in zlib
    const archiver = require('archiver');
    const zipPath = path.join(testDir, 'test_bundle.zip');
    
    try {
        const output = fs.createWriteStream(zipPath);
        const archive = archiver('zip', { zlib: { level: 9 } });
        
        archive.pipe(output);
        
        // Add files to the archive
        archive.file(path.join(tempDir, 'design1.eps'), { name: 'design1.eps' });
        archive.file(path.join(tempDir, 'photo1.jpg'), { name: 'photo1.jpg' });
        archive.file(path.join(tempDir, 'image1.png'), { name: 'image1.png' });
        archive.file(path.join(tempDir, 'document1.pdf'), { name: 'document1.pdf' });
        archive.file(path.join(tempDir, 'graphic1.svg'), { name: 'graphic1.svg' });
        archive.file(path.join(tempDir, 'design2.ai'), { name: 'design2.ai' });
        archive.file(path.join(tempDir, 'photo2.psd'), { name: 'photo2.psd' });
        
        await archive.finalize();
        
        console.log('✅ Created real ZIP file for testing');
        
        // Remove temp files, keep only the ZIP
        await fs.remove(tempDir);
        
    } catch (error) {
        console.log('❌ Failed to create ZIP file:', error.message);
        console.log('Creating mock ZIP file instead...');
        
        // Create a mock ZIP file if archiver is not available
        await fs.writeFile(zipPath, 'PK\x03\x04Mock ZIP content');
    }
    
    // Add some loose files too
    await fs.writeFile(path.join(testDir, 'loose_design.eps'), 'Loose EPS file');
    await fs.writeFile(path.join(testDir, 'loose_photo.jpg'), 'Loose JPG file');
    await fs.writeFile(path.join(testDir, 'unsupported.txt'), 'This should be skipped');
    
    console.log('✅ Test archive extraction setup created successfully!');
    console.log(`📁 Test directory: ${path.resolve(testDir)}`);
    
    return testDir;
}

async function runArchiveExtractionTest() {
    try {
        console.log('🚀 Starting Archive Extraction Test\n');
        
        // Create test files and archive
        const testDir = await createTestArchive();
        
        // Show initial structure
        console.log('\n📋 Initial directory structure:');
        await showDirectoryStructure(testDir);
        
        // Run organizer with archive extraction
        console.log('\n📦 Running file organization with archive extraction...');
        const organizer = new FileOrganizer({
            outputDir: 'extracted_organized',
            extractArchives: true,
            logLevel: 'info'
        });
        
        await organizer.organizeDirectories([testDir]);
        
        // Show final structure
        console.log('\n📋 Final directory structure:');
        await showDirectoryStructure(testDir);
        
        // Check if extraction worked
        const organizedDir = path.join(testDir, 'extracted_organized');
        if (await fs.pathExists(organizedDir)) {
            console.log('\n🎯 Organized files structure:');
            await showDirectoryStructure(organizedDir);
        }
        
        console.log('\n✅ Archive extraction test completed!');
        console.log('💡 Check if ZIP contents were extracted and organized properly.');
        
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
    runArchiveExtractionTest();
}

module.exports = { createTestArchive, runArchiveExtractionTest, showDirectoryStructure };
