# Smart File Organizer 2.0

A powerful and intelligent Node.js tool that automatically organizes files using smart categorization, extracts archives, and provides an intuitive user experience. Perfect for cleaning up messy directories with mixed file types and creating organized, accessible file structures.

## ✨ Key Features

### 🧠 Smart Intelligence

- **Intelligent Categorization**: Automatically sorts files into meaningful categories (Documents, Images, Videos, Audio, Code, Design, etc.)
- **Context-Aware Organization**: Recognizes file patterns like screenshots, backups, and downloads
- **Smart Output Management**: Automatically suggests optimal output locations

### 🎯 Advanced Organization

- **Multiple Presets**: Built-in presets for different use cases (Media-focused, Developer, Documents-only, etc.)
- **Custom Configuration**: Persistent settings and custom presets
- **Flexible Output Structure**: Creates organized folder hierarchies with categories and reports

### 🚀 User Experience

- **Interactive Mode**: Guided organization with step-by-step prompts
- **Real-time Progress**: Beautiful progress bars with detailed statistics
- **Comprehensive Reporting**: Detailed reports with file counts, sizes, and organization summaries
- **Auto-open Results**: Automatically opens organized folders when complete

### 🔧 Technical Features

- **Archive Extraction**: Supports ZIP, RAR, and 7Z files with automatic content organization
- **Duplicate Handling**: Smart duplicate detection with configurable resolution strategies
- **Error Recovery**: Robust error handling with detailed error reports
- **Performance Optimized**: Concurrent processing with configurable limits

## Installation

### Global Installation (Recommended)

```bash
npm install -g file-organizer
```

### Local Installation

```bash
git clone <repository-url>
cd file-organizer
npm install
```

## Usage

### Command Line Interface

#### Basic Usage

```bash
# Organize a single directory
file-organizer ./downloads

# Organize multiple directories
file-organizer ./downloads ./documents ./desktop

# Specify custom output directory
file-organizer ./messy-folder -o sorted_files

# Preview changes without moving files
file-organizer ./test-folder --dry-run

# Disable archive extraction
file-organizer ./archives --no-extract

# Enable verbose logging
file-organizer ./folder -v

# Quiet mode (errors and warnings only)
file-organizer ./folder -q
```

#### Advanced Options

```bash
# Full example with all options
file-organizer ./folder1 ./folder2 \
  --output my_organized_files \
  --dry-run \
  --no-extract \
  --no-cleanup \
  --verbose
```

### Programmatic Usage

```javascript
const FileOrganizer = require("file-organizer");

// Basic usage
const organizer = new FileOrganizer({
  outputDir: "organized_files",
  extractArchives: true,
  logLevel: "info",
});

await organizer.organizeDirectories(["./downloads", "./documents"]);

// Advanced configuration
const advancedOrganizer = new FileOrganizer({
  outputDir: "sorted_files",
  extractArchives: true,
  cleanupExtracted: true,
  dryRun: false,
  logLevel: "debug",
  enableFileLogging: true,
  logFile: "organizer.log",
});

await advancedOrganizer.organizeDirectories(["./messy-folder"]);
```

## How It Works

1. **Scanning**: Recursively scans all provided directories
2. **Archive Detection**: Identifies ZIP, RAR, and 7Z files
3. **Extraction**: Extracts archives to temporary directories
4. **Organization**: Groups files by extension into folders:
   - `.jpg`, `.png` files → `jpg/`, `png/` folders
   - `.pdf` files → `pdf/` folder
   - Files without extensions → `no-extension/` folder
5. **Cleanup**: Removes temporary extraction directories
6. **Reporting**: Provides detailed statistics and error reports

## Configuration Options

| Option              | Type    | Default                | Description                                     |
| ------------------- | ------- | ---------------------- | ----------------------------------------------- |
| `outputDir`         | string  | `'organized_files'`    | Name of the output directory                    |
| `extractArchives`   | boolean | `true`                 | Whether to extract archive files                |
| `cleanupExtracted`  | boolean | `true`                 | Remove temporary extraction directories         |
| `dryRun`            | boolean | `false`                | Preview mode without actual file operations     |
| `logLevel`          | string  | `'info'`               | Logging level: 'error', 'warn', 'info', 'debug' |
| `enableFileLogging` | boolean | `false`                | Enable logging to file                          |
| `logFile`           | string  | `'file-organizer.log'` | Log file path                                   |

## Supported Archive Formats

- **ZIP** (.zip) - Full support
- **RAR** (.rar) - Requires 7-Zip or WinRAR installed
- **7Z** (.7z) - Requires 7-Zip installed
- **TAR** (.tar, .tar.gz, .tar.bz2) - Planned support

## Examples

### Example 1: Basic Organization

```bash
file-organizer ./downloads
```

**Before:**

```
downloads/
├── photo.jpg
├── document.pdf
├── archive.zip
├── music.mp3
└── subfolder/
    ├── image.png
    └── text.txt
```

**After:**

```
downloads/
├── organized_files/
│   ├── jpg/
│   │   └── photo.jpg
│   ├── pdf/
│   │   └── document.pdf
│   ├── zip/
│   │   └── archive.zip
│   ├── mp3/
│   │   └── music.mp3
│   ├── png/
│   │   └── image.png
│   └── txt/
│       └── text.txt
└── subfolder/ (original files remain)
```

### Example 2: Archive Extraction

```bash
file-organizer ./archives --verbose
```

The tool will:

1. Extract all ZIP/RAR/7Z files
2. Organize extracted contents by extension
3. Keep original archives in their respective folders
4. Show detailed progress information

### Example 3: Dry Run

```bash
file-organizer ./test-folder --dry-run -v
```

Preview all operations without making changes, with verbose output showing exactly what would happen.

## Error Handling

The tool includes comprehensive error handling:

- **File Access Errors**: Skips inaccessible files with warnings
- **Archive Corruption**: Continues processing other files
- **Disk Space**: Checks available space before operations
- **Permission Issues**: Provides clear error messages
- **Network Drives**: Handles network path issues gracefully

## Logging

### Console Logging

- **Error**: Critical issues that prevent operation
- **Warn**: Non-critical issues (skipped files, etc.)
- **Info**: General progress and completion status
- **Debug**: Detailed operation information

### File Logging

Enable with `--enable-file-logging` or `enableFileLogging: true`:

```bash
file-organizer ./folder --enable-file-logging --log-file organizer.log
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

MIT License - see LICENSE file for details.

## Troubleshooting

### Common Issues

**Archive extraction fails:**

- Ensure 7-Zip is installed for RAR/7Z support
- Check file permissions
- Verify archive isn't corrupted

**Permission denied errors:**

- Run with appropriate permissions
- Check file/directory ownership
- Ensure target directory is writable

**Out of disk space:**

- Check available disk space
- Use `--dry-run` to estimate space requirements
- Clean up temporary files

### Getting Help

1. Check the verbose output: `--verbose`
2. Review log files if file logging is enabled
3. Use dry run mode to debug: `--dry-run`
4. Check GitHub issues for similar problems
