const FileOrganizer = require('./fileOrganizer');

module.exports = FileOrganizer;

// Example usage when used as a module
if (require.main === module) {
    const organizer = new FileOrganizer({
        outputDir: 'organized_files',
        extractArchives: true,
        logLevel: 'info'
    });

    // Example: organize current directory
    organizer.organizeDirectories([process.cwd()])
        .then(() => {
            console.log('Organization complete!');
        })
        .catch((error) => {
            console.error('Error:', error.message);
        });
}
