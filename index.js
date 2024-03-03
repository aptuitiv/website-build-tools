#! /usr/bin/env node

/**
 * npx aptuitiv-build template --pulld
 */

import { Command, Option } from 'commander';

import config from './src/config.js';
import { copyHandler } from './src/copy.js';
import { cssHandler } from './src/css.js';
import exportHandler from './src/export.js';
import { fontHandler } from './src/font.js';
import ftpHander from './src/ftp.js';
import { iconHandler } from './src/icons.js';
import { imageHandler } from './src/image.js';
import { jsHandler } from './src/javascript.js';
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
 * Copy commands
 */
program
    .command('copy')
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
    .addOption(configFileOption)
    .addOption(rootOption)
    .action(async (args) => {
        await config.init(args);
        fontHandler('push');
    });
program
    .command('pull-fonts')
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
    .option('-p, --path <filePath>', 'Delete a file, a folder, or a glob')
    .addOption(configFileOption)
    .addOption(rootOption)
    .action(async (args) => {
        await config.init(args);
        ftpHander('delete', args);
    });

/**
 * Icon commands
 */
program
    .command('icon-sprite')
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
    .addOption(configFileOption)
    .addOption(rootOption)
    .action(async (args) => {
        await config.init(args);
        imageHandler();
    });

/**
 * Javascript commands
 */
program
    .command('js')
    .alias('javascript')
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
 * Template related commands
 */
program
    .command('pull-templates')
    .addOption(configFileOption)
    .addOption(rootOption)
    .action(async (args) => {
        await config.init(args);
        templateHandler('pull');
    });

program
    .command('push-templates')
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
    .addOption(configFileOption)
    .addOption(rootOption)
    .action(async (args) => {
        await config.init(args);
        themeHandler('pull');
    });
program
    .command('push-theme-config')
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
    .addOption(configFileOption)
    .addOption(rootOption)
    .action(async (args) => {
        await config.init(args);
        watchHandler();
    });

// Parse the command line arguments
program.parse();
