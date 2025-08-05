#!/usr/bin/env node

const inquirer = require('inquirer');
const chalk = require('chalk');
const path = require('path');
const fs = require('fs-extra');

const FileOrganizer = require('./smartFileOrganizer');
const ConfigManager = require('./configManager');

class InteractiveCLI {
    constructor() {
        this.configManager = new ConfigManager();
        this.selectedDirectories = [];
        this.config = null;
    }

    async start() {
        console.log(chalk.blue.bold('\n🚀 Welcome to File Organizer 2.0!'));
        console.log(chalk.gray('The smart way to organize your files\n'));

        await this.configManager.initialize();
        this.config = await this.configManager.loadConfig();

        const action = await this.selectMainAction();
        await this.handleAction(action);
    }

    async selectMainAction() {
        const { action } = await inquirer.prompt([
            {
                type: 'list',
                name: 'action',
                message: 'What would you like to do?',
                choices: [
                    { name: '📁 Organize Files', value: 'organize' },
                    { name: '⚙️  Configure Settings', value: 'configure' },
                    { name: '📋 Manage Presets', value: 'presets' },
                    { name: '📊 View Statistics', value: 'stats' },
                    { name: '❓ Help & Info', value: 'help' },
                    { name: '🚪 Exit', value: 'exit' }
                ]
            }
        ]);

        return action;
    }

    async handleAction(action) {
        switch (action) {
            case 'organize':
                await this.organizeFiles();
                break;
            case 'configure':
                await this.configureSettings();
                break;
            case 'presets':
                await this.managePresets();
                break;
            case 'stats':
                await this.viewStatistics();
                break;
            case 'help':
                await this.showHelp();
                break;
            case 'exit':
                console.log(chalk.green('👋 Goodbye!'));
                process.exit(0);
                break;
        }

        // Return to main menu unless exiting
        if (action !== 'exit') {
            const { continueChoice } = await inquirer.prompt([
                {
                    type: 'confirm',
                    name: 'continueChoice',
                    message: 'Return to main menu?',
                    default: true
                }
            ]);

            if (continueChoice) {
                const nextAction = await this.selectMainAction();
                await this.handleAction(nextAction);
            }
        }
    }

    async organizeFiles() {
        console.log(chalk.blue('\n📁 File Organization Wizard'));

        // Step 1: Select directories
        await this.selectDirectories();

        if (this.selectedDirectories.length === 0) {
            console.log(chalk.yellow('⚠️  No directories selected.'));
            return;
        }

        // Step 2: Choose preset or custom settings
        const preset = await this.selectPreset();
        if (preset) {
            this.config = await this.configManager.loadPreset(preset);
        }

        // Step 3: Configure output location
        const outputPath = await this.selectOutputLocation();

        // Step 4: Review and confirm
        const confirmed = await this.reviewAndConfirm(outputPath);
        if (!confirmed) {
            console.log(chalk.yellow('❌ Organization cancelled.'));
            return;
        }

        // Step 5: Execute organization
        await this.executeOrganization(outputPath);
    }

    async selectDirectories() {
        console.log(chalk.cyan('\n📂 Select directories to organize:'));

        while (true) {
            const { directoryInput } = await inquirer.prompt([
                {
                    type: 'input',
                    name: 'directoryInput',
                    message: 'Enter directory path (or press Enter to finish):',
                    validate: async (input) => {
                        if (!input.trim()) return true; // Allow empty to finish
                        
                        const resolvedPath = path.resolve(input.trim());
                        if (!await fs.pathExists(resolvedPath)) {
                            return 'Directory does not exist';
                        }
                        
                        const stat = await fs.stat(resolvedPath);
                        if (!stat.isDirectory()) {
                            return 'Path is not a directory';
                        }
                        
                        return true;
                    }
                }
            ]);

            if (!directoryInput.trim()) break;

            const resolvedPath = path.resolve(directoryInput.trim());
            if (!this.selectedDirectories.includes(resolvedPath)) {
                this.selectedDirectories.push(resolvedPath);
                console.log(chalk.green(`✅ Added: ${resolvedPath}`));
            } else {
                console.log(chalk.yellow(`⚠️  Already added: ${resolvedPath}`));
            }
        }

        if (this.selectedDirectories.length > 0) {
            console.log(chalk.blue('\n📋 Selected directories:'));
            this.selectedDirectories.forEach((dir, index) => {
                console.log(chalk.gray(`   ${index + 1}. ${dir}`));
            });
        }
    }

    async selectPreset() {
        const presets = await this.configManager.listPresets();
        
        const choices = [
            { name: '🎯 Use current settings', value: null },
            new inquirer.Separator('--- Built-in Presets ---')
        ];

        presets.filter(p => p.builtin).forEach(preset => {
            choices.push({ name: `📋 ${preset.name} - ${preset.description}`, value: preset.name });
        });

        const customPresets = presets.filter(p => !p.builtin);
        if (customPresets.length > 0) {
            choices.push(new inquirer.Separator('--- Custom Presets ---'));
            customPresets.forEach(preset => {
                choices.push({ name: `🔧 ${preset.name} - ${preset.description}`, value: preset.name });
            });
        }

        const { preset } = await inquirer.prompt([
            {
                type: 'list',
                name: 'preset',
                message: 'Choose organization preset:',
                choices: choices
            }
        ]);

        return preset;
    }

    async selectOutputLocation() {
        const suggestions = this.getOutputSuggestions();
        
        const choices = [
            ...suggestions.map(s => ({ name: `📁 ${s.path} (${s.reason})`, value: s.path })),
            { name: '🔧 Custom location...', value: 'custom' }
        ];

        const { outputChoice } = await inquirer.prompt([
            {
                type: 'list',
                name: 'outputChoice',
                message: 'Choose output location:',
                choices: choices
            }
        ]);

        if (outputChoice === 'custom') {
            const { customPath } = await inquirer.prompt([
                {
                    type: 'input',
                    name: 'customPath',
                    message: 'Enter custom output path:',
                    validate: async (input) => {
                        if (!input.trim()) return 'Path cannot be empty';
                        
                        const validation = await this.configManager.validatePath(input.trim());
                        return validation.isValid || validation.errors.join(', ');
                    }
                }
            ]);
            return path.resolve(customPath.trim());
        }

        return outputChoice;
    }

    getOutputSuggestions() {
        const suggestions = [];
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);

        // Desktop suggestion
        const desktopPath = path.join(require('os').homedir(), 'Desktop', `FileOrganizer_${timestamp}`);
        suggestions.push({ path: desktopPath, reason: 'Desktop for easy access' });

        // Same directory as first source
        if (this.selectedDirectories.length > 0) {
            const sourceDir = path.dirname(this.selectedDirectories[0]);
            const sameDirPath = path.join(sourceDir, `Organized_${timestamp}`);
            suggestions.push({ path: sameDirPath, reason: 'Same location as source' });
        }

        // Documents folder
        const documentsPath = path.join(require('os').homedir(), 'Documents', `FileOrganizer_${timestamp}`);
        suggestions.push({ path: documentsPath, reason: 'Documents folder' });

        return suggestions;
    }

    async reviewAndConfirm(outputPath) {
        console.log(chalk.blue('\n📋 Review Organization Plan:'));
        console.log(chalk.white('Source directories:'));
        this.selectedDirectories.forEach((dir, index) => {
            console.log(chalk.gray(`   ${index + 1}. ${dir}`));
        });
        
        console.log(chalk.white(`\nOutput location: ${outputPath}`));
        console.log(chalk.white(`Smart categories: ${this.config.organization.useSmartCategories ? 'Yes' : 'No'}`));
        console.log(chalk.white(`Extract archives: ${this.config.organization.extractArchives ? 'Yes' : 'No'}`));

        const { confirmed } = await inquirer.prompt([
            {
                type: 'confirm',
                name: 'confirmed',
                message: 'Proceed with organization?',
                default: true
            }
        ]);

        return confirmed;
    }

    async executeOrganization(outputPath) {
        console.log(chalk.green('\n🚀 Starting organization...'));

        const organizer = new FileOrganizer({
            outputPath: outputPath,
            config: this.config
        });

        try {
            await organizer.organizeDirectories(this.selectedDirectories);
            console.log(chalk.green('\n🎉 Organization completed successfully!'));
        } catch (error) {
            console.error(chalk.red('\n❌ Organization failed:'), error.message);
        }
    }

    async configureSettings() {
        console.log(chalk.blue('\n⚙️  Configuration Settings'));

        const { section } = await inquirer.prompt([
            {
                type: 'list',
                name: 'section',
                message: 'Which settings would you like to configure?',
                choices: [
                    { name: '🏠 General Settings', value: 'general' },
                    { name: '📁 Organization Settings', value: 'organization' },
                    { name: '🔍 Filter Settings', value: 'filters' },
                    { name: '📊 View Current Config', value: 'view' },
                    { name: '🔄 Reset to Defaults', value: 'reset' }
                ]
            }
        ]);

        switch (section) {
            case 'general':
                await this.configureGeneral();
                break;
            case 'organization':
                await this.configureOrganization();
                break;
            case 'filters':
                await this.configureFilters();
                break;
            case 'view':
                await this.configManager.displayConfig(this.config);
                break;
            case 'reset':
                await this.resetConfig();
                break;
        }
    }

    async configureGeneral() {
        const answers = await inquirer.prompt([
            {
                type: 'list',
                name: 'defaultOutputLocation',
                message: 'Default output location:',
                choices: [
                    { name: 'Auto-detect best location', value: 'auto' },
                    { name: 'Desktop', value: 'desktop' },
                    { name: 'Documents folder', value: 'documents' },
                    { name: 'Same directory as source', value: 'same-dir' }
                ],
                default: this.config.general.defaultOutputLocation
            },
            {
                type: 'confirm',
                name: 'autoOpenOutput',
                message: 'Automatically open output folder when complete?',
                default: this.config.general.autoOpenOutput
            },
            {
                type: 'confirm',
                name: 'createTimestampedFolders',
                message: 'Create timestamped folders?',
                default: this.config.general.createTimestampedFolders
            }
        ]);

        this.config.general = { ...this.config.general, ...answers };
        await this.configManager.saveConfig(this.config);
        console.log(chalk.green('✅ General settings saved'));
    }

    async configureOrganization() {
        const answers = await inquirer.prompt([
            {
                type: 'confirm',
                name: 'useSmartCategories',
                message: 'Use smart categories (Documents, Images, etc.)?',
                default: this.config.organization.useSmartCategories
            },
            {
                type: 'confirm',
                name: 'extractArchives',
                message: 'Extract archive files?',
                default: this.config.organization.extractArchives
            },
            {
                type: 'list',
                name: 'handleDuplicates',
                message: 'How to handle duplicate files?',
                choices: [
                    { name: 'Rename with number suffix', value: 'rename' },
                    { name: 'Skip duplicates', value: 'skip' },
                    { name: 'Overwrite existing', value: 'overwrite' }
                ],
                default: this.config.organization.handleDuplicates
            }
        ]);

        this.config.organization = { ...this.config.organization, ...answers };
        await this.configManager.saveConfig(this.config);
        console.log(chalk.green('✅ Organization settings saved'));
    }

    async configureFilters() {
        const answers = await inquirer.prompt([
            {
                type: 'confirm',
                name: 'excludeHidden',
                message: 'Exclude hidden files?',
                default: this.config.filters.excludeHidden
            },
            {
                type: 'input',
                name: 'minFileSize',
                message: 'Minimum file size (bytes, 0 for no limit):',
                default: this.config.filters.minFileSize.toString(),
                validate: (input) => {
                    const num = parseInt(input);
                    return !isNaN(num) && num >= 0 || 'Please enter a valid number';
                }
            }
        ]);

        this.config.filters = { 
            ...this.config.filters, 
            ...answers,
            minFileSize: parseInt(answers.minFileSize)
        };
        await this.configManager.saveConfig(this.config);
        console.log(chalk.green('✅ Filter settings saved'));
    }

    async resetConfig() {
        const { confirmed } = await inquirer.prompt([
            {
                type: 'confirm',
                name: 'confirmed',
                message: 'Reset all settings to defaults?',
                default: false
            }
        ]);

        if (confirmed) {
            await this.configManager.resetToDefaults();
            this.config = await this.configManager.loadConfig();
        }
    }

    async managePresets() {
        console.log(chalk.blue('\n📋 Preset Management'));

        const { action } = await inquirer.prompt([
            {
                type: 'list',
                name: 'action',
                message: 'What would you like to do?',
                choices: [
                    { name: '📋 List all presets', value: 'list' },
                    { name: '➕ Create new preset', value: 'create' },
                    { name: '🔍 View preset details', value: 'view' }
                ]
            }
        ]);

        switch (action) {
            case 'list':
                this.configManager.displayPresets();
                break;
            case 'create':
                await this.createPreset();
                break;
            case 'view':
                await this.viewPreset();
                break;
        }
    }

    async createPreset() {
        const { name, description } = await inquirer.prompt([
            {
                type: 'input',
                name: 'name',
                message: 'Preset name:',
                validate: (input) => input.trim().length > 0 || 'Name cannot be empty'
            },
            {
                type: 'input',
                name: 'description',
                message: 'Preset description:',
                validate: (input) => input.trim().length > 0 || 'Description cannot be empty'
            }
        ]);

        await this.configManager.createCustomPreset(name, description, this.config);
    }

    async viewPreset() {
        const presets = await this.configManager.listPresets();
        const choices = presets.map(p => ({ name: `${p.name} - ${p.description}`, value: p.name }));

        const { presetName } = await inquirer.prompt([
            {
                type: 'list',
                name: 'presetName',
                message: 'Select preset to view:',
                choices: choices
            }
        ]);

        const presetConfig = await this.configManager.loadPreset(presetName);
        if (presetConfig) {
            await this.configManager.displayConfig(presetConfig);
        }
    }

    async viewStatistics() {
        console.log(chalk.blue('\n📊 Statistics & Information'));
        console.log(chalk.gray('Feature coming soon...'));
    }

    async showHelp() {
        console.log(chalk.blue('\n❓ File Organizer Help'));
        console.log(chalk.white(`
🚀 File Organizer 2.0 - Smart File Organization Tool

Features:
• 📁 Smart categorization (Documents, Images, Videos, etc.)
• 📦 Automatic archive extraction (ZIP, RAR, 7Z)
• 🔄 Duplicate file handling
• ⚙️  Configurable presets and settings
• 📊 Real-time progress tracking
• 🎯 Interactive and command-line modes

Quick Start:
1. Select directories to organize
2. Choose an organization preset
3. Pick output location
4. Review and confirm
5. Watch the magic happen!

Configuration:
• Settings are saved in: ${this.configManager.getConfigPath()}
• Presets are stored in: ${this.configManager.getPresetsPath()}

For more information, visit: https://github.com/your-repo/file-organizer
        `));
    }
}

// Start interactive mode if run directly
if (require.main === module) {
    const cli = new InteractiveCLI();
    cli.start().catch(error => {
        console.error(chalk.red('❌ Error:'), error.message);
        process.exit(1);
    });
}

module.exports = InteractiveCLI;
