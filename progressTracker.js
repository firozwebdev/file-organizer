const chalk = require('chalk');

class AdvancedProgressTracker {
    constructor() {
        this.phases = {
            scanning: { name: 'Scanning', icon: '🔍', color: chalk.blue },
            analyzing: { name: 'Analyzing', icon: '🧠', color: chalk.cyan },
            organizing: { name: 'Organizing', icon: '📁', color: chalk.green },
            extracting: { name: 'Extracting', icon: '📦', color: chalk.yellow },
            finalizing: { name: 'Finalizing', icon: '✨', color: chalk.magenta }
        };
        
        this.currentPhase = null;
        this.stats = {
            totalFiles: 0,
            processedFiles: 0,
            totalSize: 0,
            processedSize: 0,
            categories: {},
            archives: 0,
            errors: 0,
            startTime: Date.now(),
            phaseStartTime: Date.now()
        };
        
        this.lastUpdate = 0;
        this.updateInterval = 100; // Update every 100ms
    }

    setPhase(phaseName) {
        if (this.phases[phaseName]) {
            this.currentPhase = phaseName;
            this.stats.phaseStartTime = Date.now();
            this.displayPhaseChange();
        }
    }

    displayPhaseChange() {
        const phase = this.phases[this.currentPhase];
        console.log(`\n${phase.color(phase.icon + ' ' + phase.name + '...')}`);
    }

    setTotal(totalFiles, totalSize = 0) {
        this.stats.totalFiles = totalFiles;
        this.stats.totalSize = totalSize;
    }

    updateProgress(increment = 1, sizeIncrement = 0, category = null) {
        this.stats.processedFiles += increment;
        this.stats.processedSize += sizeIncrement;
        
        if (category) {
            if (!this.stats.categories[category]) {
                this.stats.categories[category] = { count: 0, size: 0 };
            }
            this.stats.categories[category].count += increment;
            this.stats.categories[category].size += sizeIncrement;
        }

        // Throttle updates for performance
        const now = Date.now();
        if (now - this.lastUpdate > this.updateInterval) {
            this.displayProgress();
            this.lastUpdate = now;
        }
    }

    incrementArchives() {
        this.stats.archives++;
    }

    incrementErrors() {
        this.stats.errors++;
    }

    displayProgress() {
        if (this.stats.totalFiles === 0) return;

        const percentage = Math.min(100, (this.stats.processedFiles / this.stats.totalFiles) * 100);
        const barLength = 30;
        const filledLength = Math.round((percentage / 100) * barLength);
        const bar = '█'.repeat(filledLength) + '░'.repeat(barLength - filledLength);
        
        const phase = this.phases[this.currentPhase];
        const phaseColor = phase ? phase.color : chalk.white;
        
        // Calculate speed and ETA
        const elapsed = (Date.now() - this.stats.startTime) / 1000;
        const speed = elapsed > 0 ? this.stats.processedFiles / elapsed : 0;
        const remaining = this.stats.totalFiles - this.stats.processedFiles;
        const eta = speed > 0 ? remaining / speed : 0;

        // Format sizes
        const processedSizeStr = this.formatBytes(this.stats.processedSize);
        const totalSizeStr = this.formatBytes(this.stats.totalSize);

        // Clear line and display progress
        process.stdout.write('\r\x1b[K');
        process.stdout.write(
            phaseColor(`${phase ? phase.icon : '⚡'} `) +
            chalk.white(`[${bar}] `) +
            chalk.cyan(`${percentage.toFixed(1)}% `) +
            chalk.white(`(${this.stats.processedFiles}/${this.stats.totalFiles}) `) +
            chalk.gray(`${processedSizeStr}/${totalSizeStr} `) +
            chalk.yellow(`${speed.toFixed(1)} files/s `) +
            chalk.green(`ETA: ${this.formatTime(eta)}`)
        );
    }

    displayDetailedProgress() {
        console.log('\n' + chalk.blue('📊 Detailed Progress:'));
        
        // Overall progress
        const percentage = this.stats.totalFiles > 0 
            ? (this.stats.processedFiles / this.stats.totalFiles) * 100 
            : 0;
        
        console.log(chalk.white(`   Files: ${this.stats.processedFiles}/${this.stats.totalFiles} (${percentage.toFixed(1)}%)`));
        console.log(chalk.white(`   Size: ${this.formatBytes(this.stats.processedSize)}/${this.formatBytes(this.stats.totalSize)}`));
        console.log(chalk.white(`   Archives: ${this.stats.archives}`));
        
        if (this.stats.errors > 0) {
            console.log(chalk.red(`   Errors: ${this.stats.errors}`));
        }

        // Category breakdown
        if (Object.keys(this.stats.categories).length > 0) {
            console.log(chalk.blue('\n📁 Categories:'));
            for (const [category, data] of Object.entries(this.stats.categories)) {
                const categoryPercentage = this.stats.processedFiles > 0 
                    ? (data.count / this.stats.processedFiles) * 100 
                    : 0;
                console.log(chalk.gray(`   ${category}: ${data.count} files (${categoryPercentage.toFixed(1)}%) - ${this.formatBytes(data.size)}`));
            }
        }
    }

    complete() {
        const totalTime = (Date.now() - this.stats.startTime) / 1000;
        
        // Clear progress line
        process.stdout.write('\r\x1b[K');
        
        console.log(chalk.green('\n🎉 Organization Complete!'));
        console.log(chalk.blue('📊 Final Statistics:'));
        console.log(chalk.white(`   ✅ Files Processed: ${this.stats.processedFiles}`));
        console.log(chalk.white(`   📦 Archives Extracted: ${this.stats.archives}`));
        console.log(chalk.white(`   💾 Total Size: ${this.formatBytes(this.stats.processedSize)}`));
        console.log(chalk.white(`   ⏱️  Total Time: ${this.formatTime(totalTime)}`));
        
        if (this.stats.errors > 0) {
            console.log(chalk.red(`   ❌ Errors: ${this.stats.errors}`));
        }

        const avgSpeed = totalTime > 0 ? this.stats.processedFiles / totalTime : 0;
        console.log(chalk.gray(`   📈 Average Speed: ${avgSpeed.toFixed(1)} files/second`));

        return {
            filesProcessed: this.stats.processedFiles,
            archivesExtracted: this.stats.archives,
            totalSize: this.stats.processedSize,
            totalTime: totalTime,
            errors: this.stats.errors,
            categories: this.stats.categories
        };
    }

    formatBytes(bytes) {
        if (bytes === 0) return '0 B';
        
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        
        return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
    }

    formatTime(seconds) {
        if (seconds < 60) {
            return `${seconds.toFixed(0)}s`;
        } else if (seconds < 3600) {
            const minutes = Math.floor(seconds / 60);
            const remainingSeconds = Math.floor(seconds % 60);
            return `${minutes}m ${remainingSeconds}s`;
        } else {
            const hours = Math.floor(seconds / 3600);
            const minutes = Math.floor((seconds % 3600) / 60);
            return `${hours}h ${minutes}m`;
        }
    }

    displayScanningProgress(currentPath, filesFound) {
        if (this.currentPhase !== 'scanning') return;
        
        const maxPathLength = 50;
        const displayPath = currentPath.length > maxPathLength 
            ? '...' + currentPath.slice(-maxPathLength + 3)
            : currentPath;

        process.stdout.write('\r\x1b[K');
        process.stdout.write(
            chalk.blue('🔍 ') +
            chalk.white(`Scanning: `) +
            chalk.gray(displayPath) +
            chalk.cyan(` (${filesFound} files found)`)
        );
    }

    displayAnalyzingProgress(currentFile, totalAnalyzed) {
        if (this.currentPhase !== 'analyzing') return;
        
        const maxFileLength = 40;
        const displayFile = currentFile.length > maxFileLength 
            ? '...' + currentFile.slice(-maxFileLength + 3)
            : currentFile;

        process.stdout.write('\r\x1b[K');
        process.stdout.write(
            chalk.cyan('🧠 ') +
            chalk.white(`Analyzing: `) +
            chalk.gray(displayFile) +
            chalk.cyan(` (${totalAnalyzed} analyzed)`)
        );
    }

    showPhasesSummary() {
        console.log(chalk.blue('\n📋 Processing Phases:'));
        for (const [key, phase] of Object.entries(this.phases)) {
            console.log(chalk.gray(`   ${phase.icon} ${phase.name}`));
        }
        console.log('');
    }

    getStats() {
        return { ...this.stats };
    }
}

module.exports = AdvancedProgressTracker;
