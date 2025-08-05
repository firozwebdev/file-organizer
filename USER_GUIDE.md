# 🎨 Design File Organizer - User Guide

The **easiest way** to organize your design files! This tool automatically sorts your files into folders by type and extracts archives.

## 🚀 Quick Start (3 Ways to Use)

### 1. 🖱️ Super Easy - Double Click (Windows)

**For Single Folder:**
1. **Double-click** `Organize Files.bat`
2. **Drag your folder** into the window
3. **Press Enter**
4. **Done!** ✅

**For Multiple Folders (Method A - Recommended):**
1. **Select multiple folders** in Windows Explorer (Ctrl+Click)
2. **Drag all selected folders ONTO** `Drag Multiple Folders Here.bat`
3. **Organizer starts automatically!** ✅

**For Multiple Folders (Method B - Alternative):**
1. **Double-click** `Organize Multiple Folders.bat`
2. **Select multiple folders** in Windows Explorer (Ctrl+Click)
3. **Drag all selected folders INTO the window**
4. **Press Enter**
5. **Done!** ✅

### 2. 📁 Drag & Drop Mode
```bash
node organize.js
```
- Drag your folder(s) into the terminal
- **Multiple folders supported!** Select multiple folders and drag them all at once
- Press Enter
- Follow the prompts

### 3. ⌨️ Command Line
```bash
# Organize a folder
node organize.js "./my-design-files"

# Custom output name
node organize.js "./designs" "sorted_designs"
```

## 📂 What Files Are Supported?

| File Type | Extensions | Goes To Folder |
|-----------|------------|----------------|
| **Images** | `.jpg`, `.jpeg`, `.png`, `.svg` | `jpg/`, `png/`, `svg/` |
| **Design** | `.eps`, `.ai`, `.psd`, `.cdr` | `eps/`, `ai/`, `psd/`, `cdr/` |
| **Documents** | `.pdf` | `pdf/` |
| **Raw Photos** | `.crw` | `crw/` |
| **Archives** | `.zip`, `.rar` | `zip/`, `rar/` |

**Note**: Only these file types are organized. Other files are skipped.

## 🎯 What Happens to Your Files?

### Before Organization:
```
my-design-bundle/
├── photo1.jpg
├── design.eps
├── document.pdf
├── bundle.zip (contains: logo.ai, image.png)
├── wrongname.txt (actually a JPEG)
└── other-files.mp3 (unsupported)
```

### After Organization:
```
my-design-bundle/
├── organized_files/
│   ├── jpg/
│   │   ├── photo1.jpg
│   │   └── wrongname.jpg (renamed!)
│   ├── eps/
│   │   └── design.eps
│   ├── pdf/
│   │   └── document.pdf
│   ├── ai/
│   │   └── logo.ai (from ZIP!)
│   ├── png/
│   │   └── image.png (from ZIP!)
│   └── zip/
│       └── bundle.zip
├── [all original files remain untouched]
└── other-files.mp3 (skipped)
```

## ✨ Smart Features

### 🔍 **File Type Detection**
- Detects actual file types (not just extensions)
- Renames files with wrong extensions
- Example: `photo.txt` → `photo.jpg` if it's actually a JPEG

### 📦 **Archive Extraction**
- Automatically extracts ZIP and RAR files
- Organizes extracted contents by file type
- Keeps original archive files

### 🔧 **File Naming**
- Fixes invalid characters in filenames
- Handles duplicate names automatically
- Adds `_1`, `_2`, etc. for duplicates

## 🛠️ Installation

### Requirements
- **Node.js** (Download from [nodejs.org](https://nodejs.org))

### Setup
1. **Download** this tool
2. **Open terminal** in the folder
3. **Run**: `npm install`
4. **Ready to use!**

## 📖 Detailed Examples

### Example 1: Basic Usage
```bash
node organize.js "./Design Bundle"
```
**Result**: Creates `organized_files/` folder with sorted files

### Example 2: Custom Output Name
```bash
node organize.js "./messy-files" "clean_files"
```
**Result**: Creates `clean_files/` folder instead

### Example 3: Interactive Mode
```bash
node organize.js
```
**Result**: Prompts you to enter or drag a folder

### Example 4: Advanced CLI
```bash
node cli.js organized_files "./folder1" "./folder2" --verbose
```
**Result**: Organizes multiple folders with detailed output

## 🔧 Advanced Options

### Preview Mode (Safe Testing)
```bash
node cli.js organized_files "./test-folder" --dry-run
```
Shows what would happen without making changes.

### Verbose Output
```bash
node cli.js organized_files "./folder" --verbose
```
Shows detailed progress and file operations.

### Multiple Folders
```bash
node cli.js output_folder "./folder1" "./folder2" "./folder3"
```
Organizes multiple folders into one output.

## ❓ Troubleshooting

### "Node.js not found"
**Solution**: Install Node.js from [nodejs.org](https://nodejs.org)

### "Permission denied"
**Solution**: 
- Windows: Run as Administrator
- Mac/Linux: Use `sudo`

### Files not organizing
**Check**:
- Are the file types supported? (see table above)
- Do you have write permissions?
- Use `--verbose` to see what's happening

### Multiple folders not working in batch file
**Solutions**:
- **Method 1**: Drag folders ONTO the .bat file (not into the window)
- **Method 2**: Use `Test Drag and Drop.bat` to check what's working
- **Method 3**: Use command line: `node organize.js "./folder1" "./folder2"`

### Archive extraction failed
**Note**:
- ZIP files should work perfectly
- Some RAR files might need additional tools
- Original archives are always preserved

## 💡 Pro Tips

### For Windows Users
- Use the `.bat` files for easiest experience
- Right-click folders → "Copy as path" for easy pasting
- Drag folders directly into terminal windows

### For Large Collections
- Use preview mode first: `--dry-run`
- Check the log output for any issues
- Archives are extracted automatically

### File Organization
- Only supported file types are organized
- Original files are never deleted
- Extracted files are organized by type
- Duplicate names get numbered suffixes

## 🎨 Perfect For

- **Designers**: Organize design bundles and assets
- **Photographers**: Sort photo collections
- **Developers**: Clean up download folders
- **Anyone**: With messy file collections

## 🆘 Need Help?

1. **Check this guide** for common solutions
2. **Use preview mode** to test safely
3. **Check the logs** with `--verbose`
4. **Report issues** if you find bugs

---

**Happy organizing!** 🎉
