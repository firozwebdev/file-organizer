#!/usr/bin/env node

const { Command } = require("commander");
const FileOrganizer = require("./fileOrganizer");
const ConfigManager = require("./configManager");
const chalk = require("chalk");
const path = require("path");

const program = new Command();

program
  .name("file-organizer")
  .description("🎨 Design File Organizer - Organize your design files into folders by type (jpg, png, eps, pdf, etc.)")
  .version("2.0.0");

program
  .argument(
    "[output_dir]",
    "output directory (will be created if it doesn't exist)"
  )
  .argument("[input_dirs...]", "input directories to organize")
  .option("-o, --output <dir>", "alternative way to specify output directory")
  .option("-n, --dry-run", "preview changes without actually moving files")
  .option("-p, --preset <name>", "use organization preset")
  .option("-i, --interactive", "run in interactive mode")
  .option("--no-extract", "disable archive extraction")
  .option("--no-smart", "disable smart categorization")
  .option("-v, --verbose", "enable verbose logging")
  .option("-q, --quiet", "suppress info messages")
  .option("--config", "show configuration settings")
  .option("--presets", "list available presets")
  .addHelpText('after', `
Examples:
  $ node cli.js organized_files ./my-designs
    Organize files from ./my-designs into organized_files/

  $ node cli.js sorted "C:\\Downloads\\Design Bundle"
    Organize files from Windows path into sorted/

  $ node cli.js output ./folder1 ./folder2 ./folder3
    Organize multiple folders into output/

  $ node cli.js organized_files ./designs --dry-run
    Preview what would be organized without making changes

  $ node cli.js sorted ./designs --verbose
    Show detailed progress during organization

Supported File Types:
  📁 Images: JPG, JPEG, PNG, SVG
  📁 Design: EPS, AI, PSD, CDR
  📁 Documents: PDF
  📁 Raw: CRW
  📁 Archives: ZIP, RAR (extracted automatically)

Features:
  ✅ Extracts ZIP and RAR files automatically
  ✅ Organizes extracted contents by file type
  ✅ Handles file naming conflicts
  ✅ Creates folders only for file types found
  ✅ Preserves original files

💡 Tip: For easier use, try: node organize.js (interactive mode)
`)
  .action(async (outputDir, inputDirs, options) => {
    try {
      const configManager = new ConfigManager();
      await configManager.initialize();

      // Handle special options first
      if (options.config) {
        await configManager.displayConfig();
        return;
      }

      if (options.presets) {
        configManager.displayPresets();
        return;
      }

      if (options.interactive) {
        const InteractiveCLI = require("./interactiveCli");
        const cli = new InteractiveCLI();
        await cli.start();
        return;
      }

      // Determine output directory and input directories
      let finalOutputDir = null;
      let finalInputDirs = [];

      // Handle different argument patterns
      if (options.output) {
        // Using -o flag: file-organizer -o ./output ./input1 ./input2
        finalOutputDir = options.output;
        if (outputDir) finalInputDirs.push(outputDir);
        if (inputDirs) finalInputDirs.push(...inputDirs);
      } else if (outputDir && inputDirs && inputDirs.length > 0) {
        // New pattern: file-organizer ./output ./input1 ./input2
        finalOutputDir = outputDir;
        finalInputDirs = inputDirs;
      } else if (outputDir && (!inputDirs || inputDirs.length === 0)) {
        // Single directory - treat as input, auto-generate output
        finalInputDirs = [outputDir];
        finalOutputDir = null; // Will be auto-generated
      } else {
        // No directories specified
        console.log(chalk.blue("🚀 Smart File Organizer 2.0"));
        console.log(chalk.yellow("⚠️  No directories specified."));
        console.log(chalk.cyan("\n💡 Usage Patterns:"));
        console.log(
          chalk.white(
            "   file-organizer ./output_dir ./input1 ./input2   # New pattern (recommended)"
          )
        );
        console.log(
          chalk.white(
            "   file-organizer ./input_folder                   # Auto-generate output"
          )
        );
        console.log(
          chalk.white(
            "   file-organizer -o ./output ./input1 ./input2   # Traditional pattern"
          )
        );
        console.log(
          chalk.white(
            "   file-organizer -i                              # Interactive mode"
          )
        );
        console.log(
          chalk.white(
            "   file-organizer --presets                       # List presets"
          )
        );
        console.log(
          chalk.white(
            "   file-organizer --config                        # Show config"
          )
        );
        console.log(chalk.gray("\n📖 For full help: file-organizer --help"));

        console.log(chalk.green("\n🎯 Try interactive mode for guided setup:"));
        console.log(chalk.white("   file-organizer -i"));
        process.exit(1);
      }

      console.log(chalk.blue("🎯 Organization Plan:"));
      console.log(
        chalk.white(`📤 Output: ${finalOutputDir || "Auto-generated"}`)
      );
      console.log(chalk.white(`📥 Inputs: ${finalInputDirs.join(", ")}`));

      // Validate and auto-create input directories
      const validInputDirectories = [];
      const fs = require("fs-extra");

      for (const dir of finalInputDirs) {
        const absolutePath = path.resolve(dir);
        try {
          if (await fs.pathExists(absolutePath)) {
            const stat = await fs.stat(absolutePath);
            if (stat.isDirectory()) {
              validInputDirectories.push(absolutePath);
              console.log(chalk.green(`✅ Found input directory: ${dir}`));
            } else {
              console.error(
                chalk.red(`❌ Path exists but is not a directory: ${dir}`)
              );
            }
          } else {
            // Auto-create directory if parent exists
            console.log(chalk.yellow(`⚠️  Input directory not found: ${dir}`));

            const parentDir = path.dirname(absolutePath);
            if (await fs.pathExists(parentDir)) {
              console.log(
                chalk.blue(`🔧 Auto-creating input directory: ${absolutePath}`)
              );
              await fs.ensureDir(absolutePath);
              validInputDirectories.push(absolutePath);
              console.log(chalk.green(`✅ Created and added input: ${dir}`));
            } else {
              console.error(
                chalk.red(
                  `❌ Cannot create directory (parent doesn't exist): ${dir}`
                )
              );
              console.log(
                chalk.gray(`   Parent directory needed: ${parentDir}`)
              );
            }
          }
        } catch (error) {
          console.error(
            chalk.red(`❌ Error accessing directory ${dir}: ${error.message}`)
          );
        }
      }

      if (validInputDirectories.length === 0) {
        console.error(chalk.red("❌ No valid input directories to process."));
        console.log(
          chalk.yellow(
            "💡 Make sure the input directories exist or can be created."
          )
        );
        process.exit(1);
      }

      // Handle output directory
      let resolvedOutputDir = null;
      if (finalOutputDir) {
        resolvedOutputDir = path.resolve(finalOutputDir);
        console.log(
          chalk.blue(`📤 Output will be created at: ${resolvedOutputDir}`)
        );
      }

      // Load configuration
      let config = await configManager.loadConfig();

      // Apply preset if specified
      if (options.preset) {
        const presetConfig = await configManager.loadPreset(options.preset);
        if (presetConfig) {
          config = presetConfig;
          console.log(chalk.blue(`Using preset: ${options.preset}`));
        } else {
          console.error(chalk.red(`Preset '${options.preset}' not found`));
          process.exit(1);
        }
      }

      // Override config with command line options
      if (options.verbose) config.general.logLevel = "debug";
      if (options.quiet) config.general.logLevel = "warn";
      if (options.dryRun) config.general.dryRun = true;
      if (!options.extract) config.organization.extractArchives = false;
      if (!options.smart) config.organization.useSmartCategories = false;

      // Create organizer instance
      const organizer = new FileOrganizer({
        outputDir: path.basename(resolvedOutputDir),
        extractArchives: options.extract !== false,
        dryRun: options.dryRun,
        logLevel: options.verbose ? 'debug' : options.quiet ? 'error' : 'info'
      });

      // Display configuration
      console.log(chalk.blue("\n🚀 Smart File Organizer 2.0"));
      console.log(
        chalk.white(
          `📥 Input directories: ${validInputDirectories.length} selected`
        )
      );
      console.log(
        chalk.white(
          `📤 Output directory: ${resolvedOutputDir || "Auto-generated"}`
        )
      );
      console.log(
        chalk.white(
          `🎯 Smart Categories: ${
            config.organization.useSmartCategories ? "Enabled" : "Disabled"
          }`
        )
      );
      console.log(
        chalk.white(
          `📦 Extract Archives: ${
            config.organization.extractArchives ? "Enabled" : "Disabled"
          }`
        )
      );
      console.log(chalk.white(`🔍 Dry Run: ${options.dryRun ? "Yes" : "No"}`));
      console.log("");

      // Start organization
      await organizer.organizeDirectories(validInputDirectories);
    } catch (error) {
      console.error(chalk.red("❌ Error:"), error.message);
      if (options.verbose) {
        console.error(error.stack);
      }
      process.exit(1);
    }
  });

// Add help examples
program.addHelpText(
  "after",
  `
Examples:
  # New recommended pattern (output first, then inputs):
  $ file-organizer ./organized_output ./downloads ./documents
  $ file-organizer ~/Desktop/Organized ./messy-folder
  $ file-organizer ./sorted_files ./folder1 ./folder2 -p media-focused

  # Single input (auto-generate output):
  $ file-organizer ./downloads
  $ file-organizer ./messy-folder --dry-run -v

  # Traditional pattern (using -o flag):
  $ file-organizer -o ~/Desktop/Organized ./downloads ./documents

  # Special commands:
  $ file-organizer -i                    # Interactive mode
  $ file-organizer --config              # Show configuration
  $ file-organizer --presets             # List presets

Smart Features:
  🧠 Intelligent categorization (Documents, Images, Videos, etc.)
  📦 Automatic archive extraction and organization
  🎯 Configurable presets for different use cases
  📊 Real-time progress tracking with detailed statistics
  🔧 Interactive mode for guided organization
  ⚙️  Persistent configuration and custom presets

The tool will:
  1. Scan directories recursively with smart filtering
  2. Analyze and categorize files intelligently
  3. Extract archives and organize their contents
  4. Create organized folder structure with categories
  5. Generate detailed reports and statistics
  6. Handle duplicates and errors gracefully

Smart Categories:
  📄 Documents (PDF, DOC, TXT, etc.)
  🖼️  Images (JPG, PNG, GIF, etc.)
  🎬 Videos (MP4, AVI, MOV, etc.)
  🎵 Audio (MP3, WAV, FLAC, etc.)
  💻 Code (JS, HTML, CSS, etc.)
  🎨 Design (PSD, AI, EPS, etc.)
  📦 Archives (ZIP, RAR, 7Z, etc.)
`
);

program.parse();
