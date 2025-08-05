# 🎨 How to Use the Design File Organizer

## 🚀 Choose Your Method (Easiest to Advanced)

### 1. 🖱️ **EASIEST - Double Click (Windows)**
1. **Double-click** `Organize Files.bat`
2. **Drag your folder** into the window that opens
3. **Press Enter**
4. **Wait for completion** ✅

### 2. 📁 **EASY - Interactive Mode**
```bash
node organize.js
```
- Follow the prompts
- Drag & drop supported
- Perfect for beginners

### 3. ⌨️ **QUICK - Command Line**
```bash
# Organize one folder
node organize.js "./my-design-files"

# Organize multiple folders (all go to same output)
node organize.js "./folder1" "./folder2" "./folder3"
```

### 4. 🔧 **ADVANCED - Full CLI**
```bash
# Preview first (safe)
node cli.js organized_files "./folder" --dry-run

# Multiple folders
node cli.js output_folder "./folder1" "./folder2" --verbose

# Your original command works too!
node cli.js ./output_dir ./SUPER-BUNDLE-100-TS-DESIGN
```

## 📂 What Gets Organized?

**✅ SUPPORTED FILES** (creates folders for these):
- **Images**: `.jpg`, `.jpeg`, `.png`, `.svg` → `jpg/`, `png/`, `svg/`
- **Design**: `.eps`, `.ai`, `.psd`, `.cdr` → `eps/`, `ai/`, `psd/`, `cdr/`
- **Documents**: `.pdf` → `pdf/`
- **Raw Photos**: `.crw` → `crw/`
- **Archives**: `.zip`, `.rar` → `zip/`, `rar/` (extracted first!)

**❌ SKIPPED FILES**: `.mp3`, `.mp4`, `.txt`, `.doc`, etc.

## 🎯 What Happens?

### Your Files Before:
```
current-directory/
├── my-bundle/
│   ├── photo.jpg
│   ├── design.eps
│   ├── bundle.zip (contains: logo.ai, image.png)
│   └── document.pdf
└── other-folder/
    ├── more-photos.jpg
    └── music.mp3 (skipped)
```

### Your Files After:
```
current-directory/
├── organized_files/          ← Created in ROOT directory
│   ├── jpg/
│   │   ├── photo.jpg         ← From my-bundle/
│   │   └── more-photos.jpg   ← From other-folder/
│   ├── eps/
│   │   └── design.eps        ← From my-bundle/
│   ├── ai/
│   │   └── logo.ai           ← Extracted from ZIP!
│   ├── png/
│   │   └── image.png         ← Extracted from ZIP!
│   ├── pdf/
│   │   └── document.pdf      ← From my-bundle/
│   └── zip/
│       └── bundle.zip        ← Original ZIP preserved
├── my-bundle/ [original files untouched]
└── other-folder/ [original files untouched]
```

## ✨ Smart Features Working for You

### 🔍 **File Type Detection**
- Detects real file types (not just extensions)
- `photo.txt` → `photo.jpg` if it's actually a JPEG

### 📦 **Archive Magic**
- ZIP and RAR files extracted automatically
- Contents organized by file type
- Original archives preserved

### 🔧 **File Naming**
- Fixes invalid characters
- Handles duplicates: `file.jpg`, `file_1.jpg`, `file_2.jpg`

## 🛠️ Setup (One Time Only)

1. **Install Node.js** from [nodejs.org](https://nodejs.org)
2. **Download this tool**
3. **Open terminal** in the tool folder
4. **Run**: `npm install`
5. **Ready!** 🎉

## 💡 Pro Tips

### For Your Design Bundles
```bash
# Your command works perfectly:
node cli.js ./output_dir ./SUPER-BUNDLE-100-TS-DESIGN

# Or use the simple version (creates organized_files in current directory):
node organize.js "./SUPER-BUNDLE-100-TS-DESIGN"

# Multiple folders at once:
node organize.js "./SUPER-BUNDLE-100-TS-DESIGN" "./other-designs" "./photos"
```

### Safety First
```bash
# Always preview first with large collections:
node cli.js organized_files "./big-folder" --dry-run
```

### Multiple Folders
```bash
# Organize several folders at once:
node cli.js output_folder "./folder1" "./folder2" "./folder3"
```

## 🆘 Quick Fixes

**"Node.js not found"** → Install from [nodejs.org](https://nodejs.org)

**"Permission denied"** → Run as Administrator (Windows) or use `sudo` (Mac/Linux)

**Files not organizing** → Check if file types are supported (see list above)

**Want to see what's happening** → Add `--verbose` flag

## 🎨 Perfect Results Every Time

✅ **Only creates folders for files that exist**
✅ **Extracts all ZIP and RAR files automatically**
✅ **Organizes extracted contents by file type**
✅ **Handles file naming issues automatically**
✅ **Never loses files - everything gets organized properly**
✅ **Original files always preserved**
✅ **Creates organized_files folder in ROOT directory (not inside each input folder)**
✅ **Supports multiple input folders - all organized to same output location**

---

**Your design files will be perfectly organized!** 🎉

**Need help?** Check `USER_GUIDE.md` for detailed examples.
