#! /usr/bin/env node

/**
 * npx aptuitiv-build template --pulld
 */

import { Command, Option } from 'commander';
import fs from 'fs-extra';
import { dirname } from 'path';
import { fileURLToPath } from 'url';

// Build scripts
import config from './src/config.js';
import { copyHandler } from './src/copy.js';
import { cssHandler } from './src/css.js';
import { envHandler } from './src/env.js';
import exportHandler from './src/export.js';
import { fontHandler } from './src/font.js';
import ftpHander from './src/ftp.js';
import gulpConvertHandler from './src/gulp-convert.js';
import { iconHandler } from './src/icons.js';
import { imageHandler } from './src/image.js';
import { initiaizeHandler } from './src/initialize.js';
import { jsHandler } from './src/javascript.js';
import { packageJsonHandler } from './src/package-json.js';
import { pullHandler, pullImages, pullTemplates, pullThemeConfig } from './src/pull.js';
import { pushTemplates } from './src/template.js';
import { formatThemeJson, pushTheme } from './src/theme.js';
import watchHandler from './src/watch.js';
import { hasFiles } from './src/lib/files.js';
import { logInfo, logMessage, logSuccess } from './src/lib/log.js';

// Get the directory name of the current module

const __dirname = dirname(fileURLToPath(import.meta.url));

// Get the current package.json information
const thisPackageJson = fs.readJsonSync(`${__dirname}/package.json`);

// Set up the command line options
const program = new Command();
program.description(thisPackageJson.description);
program.version(thisPackageJson.version);

// Set up shared options
const configFileOption = new Option(
    '-c, --config <fileName>',
    'The configuration file name for aptuitiv-build',
);
const rootOption = new Option(
    '--root <folderPath>',
    'The root folder of the project',
);

/**
 * Run the build process
 *
 * @param {object} args The command line arguments
 */
const runBuild = async (args) => {
    const argsObj = args || {};
    await copyHandler(argsObj);
    await cssHandler('css', argsObj);
    await fontHandler('push');
    await iconHandler(argsObj);
    await imageHandler();
    await jsHandler('process', argsObj);
    await pushTemplates();
    await pushTheme();
};

/**
 * Build and start commands
 */
program
    .command('build')
    .description('Build and process all of the source files')
    .addOption(configFileOption)
    .addOption(rootOption)
    .action(async (args) => {
        await config.init(args);
        runBuild();
    });

program
    .command('start')
    .description('Run the build and start the watch process')
    .addOption(configFileOption)
    .addOption(rootOption)
    .action(async (args) => {
        await config.init(args);
        runBuild().then(() => {
            watchHandler();
        });
    });

/**
 * Copy commands
 */
program
    .command('copy')
    .description('Copy files from the source to the build folder')
    .addOption(configFileOption)
    .addOption(rootOption)
    .action(async (args) => {
        await config.init(args);
        copyHandler();
    });

/**
 * CSS commands
 */
program
    .command('css')
    .description('Process and lint the CSS files')
    .option('-f, --file <filePath>', 'Process a specific file')
    .option('--no-lint', 'Whether to lint the CSS files')
    .addOption(configFileOption)
    .addOption(rootOption)
    .action(async (args) => {
        await config.init(args);
        cssHandler('css', args);
    });
program
    .command('stylelint')
    .description('Lint the CSS files')
    .alias('css-lint')
    .alias('csslint')
    .option(
        '-p, --path <fileGlob>',
        'The glob of files to lint. By default it lints all files. If you pass a file glob then only those files will be linted.',
    )
    .addOption(configFileOption)
    .addOption(rootOption)
    .action(async (args) => {
        await config.init(args);
        cssHandler('lint', args);
    });

/**
 * Environment commands
 */
program
    .command('env')
    .description('Set up the environment file')
    .addOption(rootOption)
    .action(async (args) => {
        await envHandler(args);
    });

/**
 * Export command
 */
program
    .command('export')
    .description('Export the theme files')
    .addOption(configFileOption)
    .addOption(rootOption)
    .action(async (args) => {
        await config.init(args);
        exportHandler();
    });

/**
 * Font commands
 */
program
    .command('push-fonts')
    .description('Copy the font files from the source directory to the build directory')
    .addOption(configFileOption)
    .addOption(rootOption)
    .action(async (args) => {
        await config.init(args);
        fontHandler('push');
    });
program
    .command('pull-fonts')
    .description('Copy the font files from the build directory to the source directory')
    .addOption(configFileOption)
    .addOption(rootOption)
    .action(async (args) => {
        await config.init(args);
        fontHandler('pull');
    });

/**
 * FTP commands
 */
program
    .command('upload')
    .alias('deploy')
    .description('Upload a file, a folder, or a glob')
    .option('-p, --path <filePath>', 'Upload a file, a folder, or a glob')
    .option('-t --theme', 'Upload all theme files')
    .addOption(configFileOption)
    .addOption(rootOption)
    .action(async (args) => {
        await config.init(args);
        ftpHander('upload', args);
    });

program
    .command('download')
    .description('Download a file, a folder, or a glob')
    .option('-p, --path <filePath>', 'Download a file, a folder, or a glob')
    .option('-t --theme', 'Download all theme files')
    .addOption(configFileOption)
    .addOption(rootOption)
    .action(async (args) => {
        await config.init(args);
        ftpHander('download', args);
    });

program
    .command('delete')
    .description('Delete a file, a folder, or a glob')
    .option('-p, --path <filePath>', 'Delete a file, a folder, or a glob')
    .addOption(configFileOption)
    .addOption(rootOption)
    .action(async (args) => {
        await config.init(args);
        ftpHander('delete', args);
    });

/**
 * Gulp convert command
 */
program
    .command('gulp-convert')
    .alias('convert-gulp')
    .alias('upgrade-gulp')
    .alias('gulp-upgrade')
    .description('Convert the old Gulp build process to use the build tools')
    .option('-l, --license <license>', 'The license for the project. https://docs.npmjs.com/cli/v10/configuring-npm/package-json#license')
    .addOption(configFileOption)
    .addOption(rootOption)
    .action(async (args) => {
        gulpConvertHandler(args);
    });

/**
 * Icon commands
 */
program
    .command('icon-sprite')
    .description('Create an icon sprite')
    .alias('icons')
    .addOption(configFileOption)
    .addOption(rootOption)
    .option('-p, --path <folderPath>', 'Path to the icon folder. For example, "icons".')
    .option('-o, --output <filePath>', `The path, including the file name,
        for the output Twig file within the "templates" folder. For example, "snippets/svg-icons.twig".`)
    .action(async (args) => {
        await config.init(args);
        iconHandler(args);
    });

/**
 * Image commands
 */
program
    .command('images')
    .description('Optimize the image files')
    .addOption(configFileOption)
    .addOption(rootOption)
    .action(async (args) => {
        await config.init(args);
        imageHandler();
    });

/**
 * Initialize command
 */
program
    .command('initialize')
    .alias('init')
    .description('Initialize the project')
    .option('--no-build', 'Do not run the build process after initializing the project')
    .option('-n, --name <name>', 'The name of the project')
    .option('-t, --type <name>', 'The type of project')
    .addOption(configFileOption)
    .addOption(rootOption)
    .action(async (args) => {
        await config.init(args);
        const success = await initiaizeHandler(args);
        if (success) {
            if (args.build) {
                if (hasFiles('src')) {
                    logMessage('The project has been initialized. Running the build process.');
                    await runBuild(args);
                    logSuccess('The build process has completed.');
                    logInfo('You can now run "npm run watch" to start the watch process. Or run "npm run deploy" to upload files to the server.');
                } else {
                    logMessage('The project has been initialized. You can add your source files to the "src" folder.');
                }
            } else {
                logMessage('The project has been initialized. You can now run "npm run build" to build the project.');
            }
        }
    });

/**
 * Javascript commands
 */
program
    .command('js')
    .alias('javascript')
    .description('Process and lint the Javascript files')
    .alias('scripts')
    .option('-f, --file <filePath>', 'Process a specific file')
    .option('--no-lint', 'Whether to lint the Javascript files')
    .addOption(configFileOption)
    .addOption(rootOption)
    .action(async (args) => {
        await config.init(args);
        jsHandler('process', args);
    });
program
    .command('jslint')
    .description('Lint the Javascript files')
    .alias('js-lint')
    .alias('javascript-lint')
    .alias('scripts-lint')
    .option(
        '-p, --path [fileGlob]',
        'The glob of files to lint. By default it lints all files. If you pass a file glob then only those files will be linted.',
    )
    .addOption(configFileOption)
    .addOption(rootOption)
    .action(async (args) => {
        await config.init(args);
        jsHandler('lint', args);
    });

/**
 * Package.json command
 */
const packageJsonCommand = program.command('package-json').description('Process the package.json file');
packageJsonCommand
    .command('format')
    .description('Format the package.json file')
    .addOption(rootOption)
    .option('-l, --license <license>', 'The license for the project. https://docs.npmjs.com/cli/v10/configuring-npm/package-json#license')
    .option('-t, --theme <themeName>', 'Set the theme name. This sets the path to download and upload theme files. Defaults to "custom".')
    .action(async (args) => {
        packageJsonHandler(args, 'format');
    });

packageJsonCommand
    .command('scripts')
    .description('Update the scripts in the package.json to the recommended ones')
    .addOption(rootOption)
    .option('-t, --theme <themeName>', 'Set the theme name. This sets the path to download and upload theme files. Defaults to "custom".')
    .action(async (args) => {
        packageJsonHandler(args, 'scripts');
    });

/**
 * Template related commands
 */
program
    .command('push-templates')
    .description('Push the theme twig templates from the source directory to the build directory')
    .addOption(configFileOption)
    .addOption(rootOption)
    .action(async (args) => {
        await config.init(args);
        pushTemplates();
    });

/**
 * Pull commands to pull files from the build directory to the source directory
 */
program
    .command('pull')
    .description('Pull files from the build directory to the source directory')
    .addOption(configFileOption)
    .addOption(rootOption)
    .requiredOption('-p, --path <filePath>', 'The path to the files to pull. For example, "theme/custom/templates", "theme/custom/config", or "images".')
    .action(async (args) => {
        await config.init(args);
        pullHandler(args);
    });

program
    .command('pull-images')
    .description('Pull the images from the build theme directory to the source theme directory')
    .addOption(configFileOption)
    .addOption(rootOption)
    .action(async (args) => {
        await config.init(args);
        pullImages();
    });
program
    .command('pull-templates')
    .description('Pull the theme twig templates from the build directory to the source directory')
    .addOption(configFileOption)
    .addOption(rootOption)
    .action(async (args) => {
        await config.init(args);
        pullTemplates();
    });
program
    .command('pull-theme-config')
    .description('Pull the theme config files from the build directory to the source directory')
    .addOption(configFileOption)
    .addOption(rootOption)
    .action(async (args) => {
        await config.init(args);
        pullThemeConfig();
    });

/**
 * Theme related commands
 */
program
    .command('format-theme-json')
    .description('Format the theme configuration JSON file')
    .option('-f, --file <fileName>', 'The name of the theme configuration JSON file to format')
    .addOption(configFileOption)
    .addOption(rootOption)
    .action(async (args) => {
        await config.init(args);
        formatThemeJson(args.file);
    });

program
    .command('push-theme-config')
    .description('Push the theme config files from the source directory to the build directory')
    .addOption(configFileOption)
    .addOption(rootOption)
    .action(async (args) => {
        await config.init(args);
        pushTheme();
    });

/**
 * Watch command
 */
program
    .command('watch')
    .description('Watch the source files and process them as they change')
    .addOption(configFileOption)
    .addOption(rootOption)
    .action(async (args) => {
        await config.init(args);
        watchHandler();
    });

// Parse the command line arguments
program.parse();
