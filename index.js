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
        console.log('upload args: ', args);
        const config = await getConfig(args.config);
    })

program.command('template')
    .option('--pull', 'Copy theme files from the build folder to the src folder')
    .option('--push', 'Copy theme files from the src folder to the build folder')
    .option('-c --config <fileName>', 'The configuration file name for aptuitiv-build')
    .action(async (args) => {
        const config = await getConfig(args.config);
        templateHandler(config, args);
    });

program.parse();
const options = program.opts();

console.log('Options: ', options);