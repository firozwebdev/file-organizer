# 🎨 Multiple Folders Guide

## 🚨 Problem: "When I drop folders on multiple and enter, it is unseen"

**Solution**: There are different ways to drag multiple folders. Here are ALL the methods that work:

## ✅ **Method 1: Drag ONTO .bat file (EASIEST)**

1. **Select multiple folders** in Windows Explorer:
   - Hold `Ctrl` and click each folder
   - Or drag to select multiple folders

2. **Drag all selected folders ONTO** `Drag Multiple Folders Here.bat`
   - Don't double-click the .bat file first
   - Just drag the folders directly onto the .bat file icon

3. **Organizer starts automatically!** ✅

**Why this works**: Windows passes the folder paths as command line arguments to the batch file.

## ✅ **Method 2: Interactive Mode**

```bash
node organize.js
```

1. **Run the command** in terminal
2. **Select multiple folders** in Windows Explorer
3. **Drag them into the terminal window**
4. **Press Enter**

**Example of what you should see**:
```
Enter folder path (or drag & drop): "C:\folder1" "C:\folder2" "C:\folder3"
```

## ✅ **Method 3: Command Line Direct**

```bash
node organize.js "./folder1" "./folder2" "./folder3"
```

**Most reliable method** - type or paste the folder paths directly.

## ✅ **Method 4: Batch File with Manual Input**

1. **Double-click** `Organize Multiple Folders.bat`
2. **Type or paste** folder paths manually
3. **Press Enter**

## 🔧 **Troubleshooting**

### If drag & drop isn't working:

1. **Test first**: Use `Test Drag and Drop.bat` to see what's being captured

2. **Check the input**: After dragging, you should see something like:
   ```
   "C:\Users\You\folder1" "C:\Users\You\folder2"
   ```

3. **If nothing appears**: Try Method 1 (drag ONTO the .bat file)

4. **If still not working**: Use the command line method

### Common Issues:

**❌ "Folders not found"**
- Make sure the folder paths are correct
- Check for typos in folder names
- Ensure folders actually exist

**❌ "Input is unseen"**
- The text might be there but not visible
- Try pressing Enter anyway
- Or use Method 1 (drag onto .bat file)

**❌ "Only one folder processed"**
- Make sure folders are separated by spaces
- Folders with spaces need quotes: `"My Folder"`

## 🎯 **What You Should See**

### Successful Multiple Folder Organization:
```
📂 Organizing 3 folder(s):
  📁 C:\Users\You\DesignBundle1
  📁 C:\Users\You\DesignBundle2  
  📁 C:\Users\You\Photos

📤 Output: C:\current-directory\organized_files

Continue? (y/n): y

🚀 Starting organization...

📂 Processing: DesignBundle1
✅ design1.eps → eps/
✅ photo1.jpg → jpg/

📂 Processing: DesignBundle2  
✅ design2.ai → ai/
✅ image1.png → png/

📂 Processing: Photos
✅ photo2.jpg → jpg/
✅ photo3.jpg → jpg/

📊 Summary:
  Files processed: 6
  Archives extracted: 0
  Files skipped: 0
  Errors: 0

✅ Organization Complete!
```

### Final Result:
```
current-directory/
├── organized_files/           ← All files from all folders
│   ├── eps/
│   │   └── design1.eps        ← From DesignBundle1
│   ├── ai/
│   │   └── design2.ai         ← From DesignBundle2
│   ├── jpg/
│   │   ├── photo1.jpg         ← From DesignBundle1
│   │   ├── photo2.jpg         ← From Photos
│   │   └── photo3.jpg         ← From Photos
│   └── png/
│       └── image1.png         ← From DesignBundle2
├── DesignBundle1/ [untouched]
├── DesignBundle2/ [untouched]
└── Photos/ [untouched]
```

## 💡 **Pro Tips**

1. **Use Method 1** (drag onto .bat file) - it's the most reliable
2. **Test with small folders first** to make sure it's working
3. **Check the organized_files folder** to see the results
4. **Original folders are never modified** - they stay exactly as they were

## 🆘 **Still Having Issues?**

Try this step by step:

1. **Create two test folders** with a few files each
2. **Use Method 1**: Drag both folders onto `Drag Multiple Folders Here.bat`
3. **Check if organized_files folder is created**
4. **If it works**, try with your real folders

**If nothing works**, use the command line method:
```bash
node organize.js "C:\path\to\folder1" "C:\path\to\folder2"
```

---

**The tool DOES support multiple folders - it's just about using the right method!** 🎉
