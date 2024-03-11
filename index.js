#! /usr/bin/env node

/**
 * npx aptuitiv-build template --pulld
 */

import chalk from 'chalk';
import { Command, Option } from 'commander';
import fancyLog from 'fancy-log';
import logSymbols from 'log-symbols';

// Build scripts
import config from './src/config.js';
import { copyHandler } from './src/copy.js';
import { cssHandler } from './src/css.js';
import exportHandler from './src/export.js';
import { fontHandler } from './src/font.js';
import ftpHander from './src/ftp.js';
import gulpConvertHandler from './src/gulp-convert.js';
import { iconHandler } from './src/icons.js';
import { imageHandler } from './src/image.js';
import { initiaizeHandler } from './src/initialize.js';
import { jsHandler } from './src/javascript.js';
import { packageJsonHandler } from './src/package-json.js';
import { templateHandler } from './src/template.js';
import { themeHandler } from './src/theme.js';
import watchHandler from './src/watch.js';

// Set up the command line options
const program = new Command();

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
 */
const runBuild = async () => {
    await copyHandler();
    await cssHandler('css', {});
    fontHandler('push');
    await iconHandler();
    await imageHandler();
    await jsHandler('process', {});
    templateHandler('push');
    themeHandler('push');
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
        '-p, --path [fileGlob]',
        'The glob of files to lint. By default it lints all files. If you pass a file glob then only those files will be linted.',
    )
    .addOption(configFileOption)
    .addOption(rootOption)
    .action(async (args) => {
        await config.init(args);
        cssHandler('lint', args);
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
    .description('Convert the old Gulp build process to use the build tools')
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
    .action(async (args) => {
        await config.init(args);
        iconHandler();
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
    .addOption(configFileOption)
    .addOption(rootOption)
    .action(async (args) => {
        await config.init(args);
        await initiaizeHandler(args);
        if (args.build) {
            fancyLog(chalk.magenta('The project has been initialized. Running the build process.'));
            await runBuild();
            fancyLog(logSymbols.success, chalk.green('The build process has completed.'));
            fancyLog(chalk.blue('You can now run "npm run watch" to start the watch process.'));
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
    .action(async (args) => {
        packageJsonHandler(args, 'format');
    });

packageJsonCommand
    .command('scripts')
    .description('Update the scripts in the package.json to the recommended ones')
    .addOption(rootOption)
    .action(async (args) => {
        packageJsonHandler(args, 'scripts');
    });

/**
 * Template related commands
 */
program
    .command('pull-templates')
    .description('Pull the theme twig templates from the build directory to the source directory')
    .addOption(configFileOption)
    .addOption(rootOption)
    .action(async (args) => {
        await config.init(args);
        templateHandler('pull');
    });

program
    .command('push-templates')
    .description('Push the theme twig templates from the source directory to the build directory')
    .addOption(configFileOption)
    .addOption(rootOption)
    .action(async (args) => {
        await config.init(args);
        templateHandler('push');
    });

/**
 * Theme related commands
 */
program
    .command('pull-theme-config')
    .description('Pull the theme config files from the build directory to the source directory')
    .addOption(configFileOption)
    .addOption(rootOption)
    .action(async (args) => {
        await config.init(args);
        themeHandler('pull');
    });
program
    .command('push-theme-config')
    .description('Push the theme config files from the source directory to the build directory')
    .addOption(configFileOption)
    .addOption(rootOption)
    .action(async (args) => {
        await config.init(args);
        themeHandler('push');
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
