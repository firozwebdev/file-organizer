const path = require('path');
const fs = require('fs-extra');

class SmartCategorizer {
    constructor() {
        this.categories = {
            'Documents': {
                extensions: ['pdf', 'doc', 'docx', 'txt', 'rtf', 'odt', 'pages', 'tex', 'wpd', 'md', 'markdown'],
                icon: '📄',
                description: 'Text documents, PDFs, and written content'
            },
            'Spreadsheets': {
                extensions: ['xls', 'xlsx', 'csv', 'ods', 'numbers'],
                icon: '📊',
                description: 'Spreadsheets and data files'
            },
            'Presentations': {
                extensions: ['ppt', 'pptx', 'odp', 'key'],
                icon: '📽️',
                description: 'Presentation files'
            },
            'Images': {
                extensions: ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'tiff', 'tif', 'svg', 'webp', 'ico', 'raw', 'cr2', 'nef', 'arw'],
                icon: '🖼️',
                description: 'Photos, graphics, and image files'
            },
            'Videos': {
                extensions: ['mp4', 'avi', 'mkv', 'mov', 'wmv', 'flv', 'webm', 'm4v', '3gp', 'mpg', 'mpeg'],
                icon: '🎬',
                description: 'Video files and movies'
            },
            'Audio': {
                extensions: ['mp3', 'wav', 'flac', 'aac', 'ogg', 'wma', 'm4a', 'opus'],
                icon: '🎵',
                description: 'Music and audio files'
            },
            'Archives': {
                extensions: ['zip', 'rar', '7z', 'tar', 'gz', 'bz2', 'xz', 'cab', 'iso'],
                icon: '📦',
                description: 'Compressed and archive files'
            },
            'Code': {
                extensions: ['js', 'html', 'css', 'py', 'java', 'cpp', 'c', 'h', 'php', 'rb', 'go', 'rs', 'swift', 'kt'],
                icon: '💻',
                description: 'Programming and markup files'
            },
            'Design': {
                extensions: ['psd', 'ai', 'eps', 'indd', 'sketch', 'fig', 'xd', 'cdr'],
                icon: '🎨',
                description: 'Design and graphics files'
            },
            'Fonts': {
                extensions: ['ttf', 'otf', 'woff', 'woff2', 'eot'],
                icon: '🔤',
                description: 'Font files'
            },
            'Executables': {
                extensions: ['exe', 'msi', 'dmg', 'pkg', 'deb', 'rpm', 'appimage'],
                icon: '⚙️',
                description: 'Executable and installer files'
            },
            'Data': {
                extensions: ['json', 'xml', 'yaml', 'yml', 'sql', 'db', 'sqlite'],
                icon: '🗃️',
                description: 'Data and database files'
            },
            'Ebooks': {
                extensions: ['epub', 'mobi', 'azw', 'azw3', 'fb2'],
                icon: '📚',
                description: 'Electronic books'
            },
            'CAD': {
                extensions: ['dwg', 'dxf', 'step', 'stp', 'iges', 'igs'],
                icon: '📐',
                description: 'CAD and engineering files'
            },
            'Virtual': {
                extensions: ['vmdk', 'vdi', 'vhd', 'vhdx', 'ova', 'ovf'],
                icon: '💿',
                description: 'Virtual machine files'
            }
        };

        this.specialPatterns = {
            'Screenshots': {
                patterns: [/screenshot/i, /screen\s*shot/i, /capture/i],
                parentCategory: 'Images',
                icon: '📸',
                description: 'Screenshots and screen captures'
            },
            'Downloads': {
                patterns: [/download/i, /temp/i, /tmp/i],
                parentCategory: null,
                icon: '⬇️',
                description: 'Downloaded and temporary files'
            },
            'Backups': {
                patterns: [/backup/i, /bak$/i, /\.old$/i, /\.backup$/i],
                parentCategory: null,
                icon: '💾',
                description: 'Backup files'
            },
            'Logs': {
                patterns: [/\.log$/i, /\.txt$/i],
                parentCategory: 'Documents',
                icon: '📋',
                description: 'Log files'
            }
        };
    }

    categorizeFile(filePath) {
        const fileName = path.basename(filePath);
        const extension = path.extname(fileName).toLowerCase().slice(1);
        
        // First check special patterns
        for (const [categoryName, pattern] of Object.entries(this.specialPatterns)) {
            if (pattern.patterns.some(regex => regex.test(fileName))) {
                return {
                    category: categoryName,
                    subcategory: pattern.parentCategory,
                    icon: pattern.icon,
                    description: pattern.description,
                    isSpecial: true
                };
            }
        }

        // Then check standard categories
        for (const [categoryName, categoryInfo] of Object.entries(this.categories)) {
            if (categoryInfo.extensions.includes(extension)) {
                return {
                    category: categoryName,
                    subcategory: null,
                    icon: categoryInfo.icon,
                    description: categoryInfo.description,
                    isSpecial: false
                };
            }
        }

        // Default category for unknown extensions
        return {
            category: 'Other',
            subcategory: extension || 'no-extension',
            icon: '❓',
            description: 'Files with unknown or no extensions',
            isSpecial: false
        };
    }

    getOrganizedPath(basePath, filePath, categorization) {
        const fileName = path.basename(filePath);
        
        if (categorization.isSpecial && categorization.subcategory) {
            // Special files go in subcategory under main category
            return path.join(basePath, categorization.subcategory, categorization.category, fileName);
        } else if (categorization.subcategory && categorization.category === 'Other') {
            // Other files organized by extension
            return path.join(basePath, categorization.category, categorization.subcategory, fileName);
        } else {
            // Standard categorization
            return path.join(basePath, categorization.category, fileName);
        }
    }

    async createCategoryStructure(basePath) {
        const structure = {};
        
        // Create main category folders
        for (const [categoryName, categoryInfo] of Object.entries(this.categories)) {
            const categoryPath = path.join(basePath, categoryName);
            await fs.ensureDir(categoryPath);
            structure[categoryName] = {
                path: categoryPath,
                icon: categoryInfo.icon,
                description: categoryInfo.description,
                count: 0,
                size: 0
            };
        }

        // Create special category folders
        for (const [categoryName, categoryInfo] of Object.entries(this.specialPatterns)) {
            if (categoryInfo.parentCategory) {
                const specialPath = path.join(basePath, categoryInfo.parentCategory, categoryName);
                await fs.ensureDir(specialPath);
            } else {
                const specialPath = path.join(basePath, categoryName);
                await fs.ensureDir(specialPath);
                structure[categoryName] = {
                    path: specialPath,
                    icon: categoryInfo.icon,
                    description: categoryInfo.description,
                    count: 0,
                    size: 0
                };
            }
        }

        // Create Other category
        const otherPath = path.join(basePath, 'Other');
        await fs.ensureDir(otherPath);
        structure['Other'] = {
            path: otherPath,
            icon: '❓',
            description: 'Files with unknown or no extensions',
            count: 0,
            size: 0
        };

        return structure;
    }

    async createCategoryReadme(categoryPath, categoryName, categoryInfo) {
        const readmeContent = `# ${categoryInfo.icon} ${categoryName}

${categoryInfo.description}

## File Types:
${categoryInfo.extensions ? categoryInfo.extensions.map(ext => `- .${ext}`).join('\n') : 'Various file types'}

## Organization Date:
${new Date().toLocaleString()}

---
*Organized by File Organizer Tool*
`;

        await fs.writeFile(path.join(categoryPath, 'README.md'), readmeContent);
    }

    getFileSize(filePath) {
        try {
            const stats = fs.statSync(filePath);
            return stats.size;
        } catch (error) {
            return 0;
        }
    }

    formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    generateCategoryReport(structure) {
        const report = {
            totalCategories: Object.keys(structure).length,
            totalFiles: 0,
            totalSize: 0,
            categories: {}
        };

        for (const [categoryName, categoryData] of Object.entries(structure)) {
            report.totalFiles += categoryData.count;
            report.totalSize += categoryData.size;
            
            report.categories[categoryName] = {
                icon: categoryData.icon,
                description: categoryData.description,
                fileCount: categoryData.count,
                totalSize: this.formatFileSize(categoryData.size),
                percentage: 0 // Will be calculated after totals
            };
        }

        // Calculate percentages
        for (const categoryData of Object.values(report.categories)) {
            categoryData.percentage = report.totalFiles > 0 
                ? ((categoryData.fileCount / report.totalFiles) * 100).toFixed(1)
                : 0;
        }

        return report;
    }

    async updateCategoryStats(structure, categoryName, fileSize) {
        if (structure[categoryName]) {
            structure[categoryName].count++;
            structure[categoryName].size += fileSize;
        }
    }

    getSuggestedCategories(filePaths) {
        const suggestions = {};
        
        for (const filePath of filePaths) {
            const categorization = this.categorizeFile(filePath);
            const category = categorization.category;
            
            if (!suggestions[category]) {
                suggestions[category] = {
                    count: 0,
                    icon: categorization.icon,
                    description: categorization.description,
                    examples: []
                };
            }
            
            suggestions[category].count++;
            if (suggestions[category].examples.length < 3) {
                suggestions[category].examples.push(path.basename(filePath));
            }
        }

        return suggestions;
    }
}

module.exports = SmartCategorizer;
