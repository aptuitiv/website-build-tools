#! /usr/bin/env node

/**
 * npx aptuitiv-build template --pulld
 */

import { Command } from 'commander';

import getConfig from './src/config.js';
import templateHandler from './src/template.js';

const program = new Command();
program
    .command('upload')

    .option('-a, --all', 'Upload all files')
    .option('-p, --path <filePath>', 'Upload a file, a folder, or a glob')
    .option('-t --theme', 'Upload all theme files')
    .option('-c --config <fileName>', 'The configuration file name for aptuitiv-build')
    .action(async (args) => {
        const config = await getConfig(args.config);
    })

program.command('template')
    .option('-c --config <fileName>', 'The configuration file name for aptuitiv-build')
    .option('--pull', 'Copy theme files from the build folder to the src folder')
    .option('--push', 'Copy theme files from the src folder to the build folder')
    .option('--root <folderPath>', 'The root folder of the project')
    .action(async (args) => {
        const config = await getConfig(args.config, args.root);
        templateHandler(config, args);
    });

program.parse();