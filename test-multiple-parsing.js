const SimpleOrganizer = require('./organize');

// Test the multiple path parsing
const organizer = new SimpleOrganizer();

console.log('Testing multiple path parsing:\n');

const testInputs = [
    '"I:\\current workings\\file-organizer\\folder_1" "I:\\current workings\\file-organizer\\folder_2"',
    './test_folder_1 ./test_folder_2',
    '"C:\\Program Files\\Folder 1" "C:\\Program Files\\Folder 2"',
    './single-folder',
    '"./folder with spaces"'
];

testInputs.forEach((input, index) => {
    console.log(`Test ${index + 1}: ${input}`);
    const result = organizer.parseMultiplePaths(input);
    console.log(`Result: [${result.map(p => `"${p}"`).join(', ')}]`);
    console.log('---');
});

// Test the actual organize functionality
console.log('\nTesting actual organization:');
organizer.organizeFolders(['./test_folder_1', './test_folder_2']).then(() => {
    console.log('Organization test complete');
    process.exit(0);
}).catch(error => {
    console.error('Error:', error.message);
    process.exit(1);
});
