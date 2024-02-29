#! /usr/bin/env node

/**
 * npx aptuitiv-build template --pulld
 */

import { Command, Option } from 'commander';

import getConfig from './src/config.js';
import { cssHandler } from './src/css.js';
import ftpHander from './src/ftp.js';
import { templateHandler } from './src/template.js';
import watchHandler from './src/watch.js';

/**
 * Get the configuration object
 * 
 * @param {object} args The arguments object
 * @returns {object} The configuration object
 */
const getConfiguration = async (args) => {
    return await getConfig(args.config ?? undefined, args.root ?? undefined);
}

// Set up the command line options
const program = new Command();

// Set up shared options
const configFileOption = new Option('-c, --config <fileName>', 'The configuration file name for aptuitiv-build');
const rootOption = new Option('--root <folderPath>', 'The root folder of the project');

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
        cssHandler(await getConfiguration(args), 'css', args);
    });
program
    .command('stylelint')
    .alias('css-lint')
    .option('-p, --path [fileGlob]', 'The glob of files to lint. By default it lints all files. If you pass a file glob then only those files will be linted.')
    .addOption(configFileOption)
    .addOption(rootOption)
    .action(async (args) => {
        cssHandler(await getConfiguration(args), 'lint', args);
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
        ftpHander(await getConfiguration(args), 'upload', args);
    });

program
    .command('download')
    .option('-p, --path <filePath>', 'Download a file, a folder, or a glob')
    .option('-t --theme', 'Download all theme files')
    .addOption(configFileOption)
    .addOption(rootOption)
    .action(async (args) => {
        ftpHander(await getConfiguration(args), 'download', args);
    });

program
    .command('delete')
    .option('-p, --path <filePath>', 'Delete a file, a folder, or a glob')
    .addOption(configFileOption)
    .addOption(rootOption)
    .action(async (args) => {
        ftpHander(await getConfiguration(args), 'delete', args);
    });
/**
 * Template related commands
 */
program.command('pull-template')
    .addOption(configFileOption)
    .addOption(rootOption)
    .action(async (args) => {
        templateHandler(await getConfiguration(args), { pull: true });
    });

program.command('push-template')
    .addOption(configFileOption)
    .addOption(rootOption)
    .action(async (args) => {
        templateHandler(await getConfiguration(args), { push: true });
    });

/**
 * Watch command
 */
program
    .command('watch')
    .addOption(configFileOption)
    .addOption(rootOption)
    .action(async (args) => {
        watchHandler(await getConfiguration(args));
    });

// Parse the command line arguments
program.parse();