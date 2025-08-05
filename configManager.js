const fs = require('fs-extra');
const path = require('path');
const os = require('os');
const chalk = require('chalk');

class ConfigManager {
    constructor() {
        this.configDir = path.join(os.homedir(), '.file-organizer');
        this.configFile = path.join(this.configDir, 'config.json');
        this.presetsDir = path.join(this.configDir, 'presets');
        
        this.defaultConfig = {
            version: '2.0.0',
            general: {
                defaultOutputLocation: 'auto', // 'auto', 'desktop', 'documents', 'same-dir'
                autoOpenOutput: true,
                createTimestampedFolders: true,
                createSourceFolders: false,
                enableFileLogging: false,
                logLevel: 'info'
            },
            organization: {
                useSmartCategories: true,
                extractArchives: true,
                cleanupExtracted: true,
                handleDuplicates: 'rename', // 'rename', 'skip', 'overwrite'
                preserveStructure: false
            },
            performance: {
                maxConcurrentFiles: 10,
                updateInterval: 100,
                enableProgressBar: true
            },
            filters: {
                excludeHidden: true,
                excludeSystem: true,
                minFileSize: 0,
                maxFileSize: 0, // 0 = no limit
                excludeExtensions: [],
                includeExtensions: [] // empty = include all
            }
        };

        this.presets = {
            'default': {
                name: 'Default Organization',
                description: 'Standard file organization with smart categories',
                config: this.defaultConfig
            },
            'media-focused': {
                name: 'Media Focused',
                description: 'Optimized for organizing photos, videos, and audio files',
                config: {
                    ...this.defaultConfig,
                    organization: {
                        ...this.defaultConfig.organization,
                        useSmartCategories: true,
                        extractArchives: false
                    },
                    filters: {
                        ...this.defaultConfig.filters,
                        includeExtensions: ['jpg', 'jpeg', 'png', 'gif', 'mp4', 'avi', 'mp3', 'wav']
                    }
                }
            },
            'documents-only': {
                name: 'Documents Only',
                description: 'Focus on organizing documents and text files',
                config: {
                    ...this.defaultConfig,
                    filters: {
                        ...this.defaultConfig.filters,
                        includeExtensions: ['pdf', 'doc', 'docx', 'txt', 'rtf', 'odt', 'xls', 'xlsx', 'ppt', 'pptx']
                    }
                }
            },
            'developer': {
                name: 'Developer Mode',
                description: 'Optimized for organizing code and development files',
                config: {
                    ...this.defaultConfig,
                    organization: {
                        ...this.defaultConfig.organization,
                        preserveStructure: true,
                        extractArchives: true
                    },
                    filters: {
                        ...this.defaultConfig.filters,
                        excludeHidden: false,
                        includeExtensions: ['js', 'html', 'css', 'py', 'java', 'cpp', 'c', 'h', 'json', 'xml', 'md']
                    }
                }
            },
            'minimal': {
                name: 'Minimal Organization',
                description: 'Simple organization by file extension only',
                config: {
                    ...this.defaultConfig,
                    organization: {
                        ...this.defaultConfig.organization,
                        useSmartCategories: false,
                        extractArchives: false
                    },
                    general: {
                        ...this.defaultConfig.general,
                        createTimestampedFolders: false
                    }
                }
            }
        };
    }

    async initialize() {
        try {
            await fs.ensureDir(this.configDir);
            await fs.ensureDir(this.presetsDir);
            
            if (!await fs.pathExists(this.configFile)) {
                await this.saveConfig(this.defaultConfig);
                console.log(chalk.green('✅ Created default configuration'));
            }

            await this.savePresets();
        } catch (error) {
            console.error(chalk.red('❌ Failed to initialize configuration:'), error.message);
        }
    }

    async loadConfig() {
        try {
            if (await fs.pathExists(this.configFile)) {
                const config = await fs.readJson(this.configFile);
                return this.mergeWithDefaults(config);
            }
        } catch (error) {
            console.warn(chalk.yellow('⚠️  Failed to load config, using defaults:'), error.message);
        }
        
        return this.defaultConfig;
    }

    async saveConfig(config) {
        try {
            await fs.writeJson(this.configFile, config, { spaces: 2 });
            return true;
        } catch (error) {
            console.error(chalk.red('❌ Failed to save configuration:'), error.message);
            return false;
        }
    }

    mergeWithDefaults(config) {
        // Deep merge with defaults to ensure all properties exist
        return {
            version: config.version || this.defaultConfig.version,
            general: { ...this.defaultConfig.general, ...config.general },
            organization: { ...this.defaultConfig.organization, ...config.organization },
            performance: { ...this.defaultConfig.performance, ...config.performance },
            filters: { ...this.defaultConfig.filters, ...config.filters }
        };
    }

    async loadPreset(presetName) {
        if (this.presets[presetName]) {
            return this.presets[presetName].config;
        }

        // Try to load custom preset
        const presetFile = path.join(this.presetsDir, `${presetName}.json`);
        if (await fs.pathExists(presetFile)) {
            try {
                const preset = await fs.readJson(presetFile);
                return this.mergeWithDefaults(preset.config);
            } catch (error) {
                console.error(chalk.red(`❌ Failed to load preset '${presetName}':`, error.message));
            }
        }

        console.error(chalk.red(`❌ Preset '${presetName}' not found`));
        return null;
    }

    async savePresets() {
        for (const [name, preset] of Object.entries(this.presets)) {
            const presetFile = path.join(this.presetsDir, `${name}.json`);
            try {
                await fs.writeJson(presetFile, preset, { spaces: 2 });
            } catch (error) {
                console.error(chalk.red(`❌ Failed to save preset '${name}':`, error.message));
            }
        }
    }

    async createCustomPreset(name, description, config) {
        const preset = {
            name: name,
            description: description,
            config: this.mergeWithDefaults(config),
            created: new Date().toISOString(),
            custom: true
        };

        const presetFile = path.join(this.presetsDir, `${name}.json`);
        try {
            await fs.writeJson(presetFile, preset, { spaces: 2 });
            console.log(chalk.green(`✅ Created custom preset '${name}'`));
            return true;
        } catch (error) {
            console.error(chalk.red(`❌ Failed to create preset '${name}':`, error.message));
            return false;
        }
    }

    async listPresets() {
        const presets = [];
        
        // Add built-in presets
        for (const [name, preset] of Object.entries(this.presets)) {
            presets.push({
                name: name,
                description: preset.description,
                builtin: true
            });
        }

        // Add custom presets
        try {
            const customFiles = await fs.readdir(this.presetsDir);
            for (const file of customFiles) {
                if (file.endsWith('.json') && !this.presets[path.basename(file, '.json')]) {
                    try {
                        const preset = await fs.readJson(path.join(this.presetsDir, file));
                        presets.push({
                            name: path.basename(file, '.json'),
                            description: preset.description || 'Custom preset',
                            builtin: false
                        });
                    } catch (error) {
                        // Skip invalid preset files
                    }
                }
            }
        } catch (error) {
            // Presets directory doesn't exist or can't be read
        }

        return presets;
    }

    displayPresets() {
        console.log(chalk.blue('\n📋 Available Presets:'));
        
        for (const [name, preset] of Object.entries(this.presets)) {
            console.log(chalk.green(`   ${name}`));
            console.log(chalk.gray(`      ${preset.description}`));
        }
    }

    async displayConfig(config = null) {
        if (!config) {
            config = await this.loadConfig();
        }

        console.log(chalk.blue('\n⚙️  Current Configuration:'));
        
        console.log(chalk.cyan('  General:'));
        console.log(`    Default Output: ${config.general.defaultOutputLocation}`);
        console.log(`    Auto Open Output: ${config.general.autoOpenOutput}`);
        console.log(`    Timestamped Folders: ${config.general.createTimestampedFolders}`);
        console.log(`    Log Level: ${config.general.logLevel}`);

        console.log(chalk.cyan('  Organization:'));
        console.log(`    Smart Categories: ${config.organization.useSmartCategories}`);
        console.log(`    Extract Archives: ${config.organization.extractArchives}`);
        console.log(`    Handle Duplicates: ${config.organization.handleDuplicates}`);

        console.log(chalk.cyan('  Filters:'));
        console.log(`    Exclude Hidden: ${config.filters.excludeHidden}`);
        console.log(`    Min File Size: ${config.filters.minFileSize} bytes`);
        if (config.filters.includeExtensions.length > 0) {
            console.log(`    Include Extensions: ${config.filters.includeExtensions.join(', ')}`);
        }
        if (config.filters.excludeExtensions.length > 0) {
            console.log(`    Exclude Extensions: ${config.filters.excludeExtensions.join(', ')}`);
        }
    }

    getConfigPath() {
        return this.configFile;
    }

    getPresetsPath() {
        return this.presetsDir;
    }

    async resetToDefaults() {
        try {
            await this.saveConfig(this.defaultConfig);
            console.log(chalk.green('✅ Configuration reset to defaults'));
            return true;
        } catch (error) {
            console.error(chalk.red('❌ Failed to reset configuration:'), error.message);
            return false;
        }
    }

    validateConfig(config) {
        const errors = [];
        
        // Validate required sections
        const requiredSections = ['general', 'organization', 'performance', 'filters'];
        for (const section of requiredSections) {
            if (!config[section]) {
                errors.push(`Missing section: ${section}`);
            }
        }

        // Validate specific values
        if (config.general && !['auto', 'desktop', 'documents', 'same-dir'].includes(config.general.defaultOutputLocation)) {
            errors.push('Invalid defaultOutputLocation value');
        }

        if (config.organization && !['rename', 'skip', 'overwrite'].includes(config.organization.handleDuplicates)) {
            errors.push('Invalid handleDuplicates value');
        }

        return {
            isValid: errors.length === 0,
            errors: errors
        };
    }
}

module.exports = ConfigManager;
