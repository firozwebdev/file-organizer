const fs = require('fs-extra');
const path = require('path');
const chalk = require('chalk');

class Logger {
    constructor(level = 'info') {
        this.levels = { error: 0, warn: 1, info: 2, debug: 3 };
        this.setLevel(level);
        this.logFile = null;
    }

    setLevel(level) {
        this.currentLevel = this.levels[level] || 2;
    }

    enableFileLogging(logFilePath) {
        this.logFile = logFilePath;
        // Ensure log directory exists
        fs.ensureDirSync(path.dirname(logFilePath));
    }

    formatMessage(level, message, ...args) {
        const timestamp = new Date().toISOString();
        const formattedArgs = args.map(arg => 
            typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg)
        ).join(' ');
        
        return `[${timestamp}] [${level.toUpperCase()}] ${message} ${formattedArgs}`.trim();
    }

    async writeToFile(formattedMessage) {
        if (this.logFile) {
            try {
                await fs.appendFile(this.logFile, formattedMessage + '\n');
            } catch (error) {
                console.error('Failed to write to log file:', error.message);
            }
        }
    }

    log(level, message, ...args) {
        if (this.levels[level] <= this.currentLevel) {
            const colors = {
                error: chalk.red,
                warn: chalk.yellow,
                info: chalk.blue,
                debug: chalk.gray
            };
            
            const colorFn = colors[level] || chalk.white;
            const formattedMessage = this.formatMessage(level, message, ...args);
            
            // Console output with colors
            console.log(colorFn(`[${level.toUpperCase()}]`), message, ...args);
            
            // File output without colors
            this.writeToFile(formattedMessage);
        }
    }

    error(message, ...args) { this.log('error', message, ...args); }
    warn(message, ...args) { this.log('warn', message, ...args); }
    info(message, ...args) { this.log('info', message, ...args); }
    debug(message, ...args) { this.log('debug', message, ...args); }
}

class ProgressTracker {
    constructor(total = 0) {
        this.total = total;
        this.current = 0;
        this.startTime = Date.now();
    }

    update(increment = 1) {
        this.current += increment;
        this.displayProgress();
    }

    setTotal(total) {
        this.total = total;
    }

    displayProgress() {
        if (this.total > 0) {
            const percentage = Math.round((this.current / this.total) * 100);
            const elapsed = Date.now() - this.startTime;
            const rate = this.current / (elapsed / 1000);
            const eta = this.total > this.current ? (this.total - this.current) / rate : 0;
            
            process.stdout.write(`\r${chalk.blue('Progress:')} ${this.current}/${this.total} (${percentage}%) - ${rate.toFixed(1)} files/sec - ETA: ${eta.toFixed(0)}s`);
        }
    }

    complete() {
        if (this.total > 0) {
            const elapsed = (Date.now() - this.startTime) / 1000;
            console.log(`\n${chalk.green('Complete!')} Processed ${this.current} files in ${elapsed.toFixed(1)}s`);
        }
    }
}

class ErrorHandler {
    constructor(logger) {
        this.logger = logger;
        this.errors = [];
    }

    handleError(error, context = '') {
        const errorInfo = {
            message: error.message,
            stack: error.stack,
            context: context,
            timestamp: new Date().toISOString()
        };
        
        this.errors.push(errorInfo);
        this.logger.error(`${context ? context + ': ' : ''}${error.message}`);
        this.logger.debug('Stack trace:', error.stack);
    }

    async handleAsyncOperation(operation, context = '') {
        try {
            return await operation();
        } catch (error) {
            this.handleError(error, context);
            return null;
        }
    }

    getErrorSummary() {
        return {
            count: this.errors.length,
            errors: this.errors
        };
    }

    async saveErrorReport(filePath) {
        if (this.errors.length > 0) {
            const report = {
                timestamp: new Date().toISOString(),
                totalErrors: this.errors.length,
                errors: this.errors
            };
            
            try {
                await fs.writeJson(filePath, report, { spaces: 2 });
                this.logger.info(`Error report saved to: ${filePath}`);
            } catch (error) {
                this.logger.error('Failed to save error report:', error.message);
            }
        }
    }
}

function validatePath(inputPath) {
    try {
        const resolvedPath = path.resolve(inputPath);
        return {
            isValid: true,
            path: resolvedPath,
            error: null
        };
    } catch (error) {
        return {
            isValid: false,
            path: null,
            error: error.message
        };
    }
}

async function getDirectorySize(dirPath) {
    let totalSize = 0;
    let fileCount = 0;
    
    try {
        const items = await fs.readdir(dirPath);
        
        for (const item of items) {
            const itemPath = path.join(dirPath, item);
            const stat = await fs.stat(itemPath);
            
            if (stat.isDirectory()) {
                const subResult = await getDirectorySize(itemPath);
                totalSize += subResult.size;
                fileCount += subResult.count;
            } else {
                totalSize += stat.size;
                fileCount++;
            }
        }
    } catch (error) {
        // Ignore errors for inaccessible directories
    }
    
    return { size: totalSize, count: fileCount };
}

function formatBytes(bytes) {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

function sanitizeFilename(filename) {
    // Remove or replace invalid characters for cross-platform compatibility
    return filename.replace(/[<>:"/\\|?*]/g, '_').replace(/\s+/g, '_');
}

module.exports = {
    Logger,
    ProgressTracker,
    ErrorHandler,
    validatePath,
    getDirectorySize,
    formatBytes,
    sanitizeFilename
};
