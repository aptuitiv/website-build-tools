#! /usr/bin/env node

/* ===========================================================================
    Functions to work with template files
=========================================================================== */

import fs from 'fs-extra';
import chalk from 'chalk';
import fancyLog from 'fancy-log';
import logSymbols from 'log-symbols';

// Build scripts
// import getConfig from './config.js';
import { prefixPath } from './helpers.js';

/**
 * Copy all of the theme files from the src folder to the build folder
 */
const copySrcToBuild = (config) => {
    fancyLog(chalk.magenta('Copying template files to build folder'));
    const srcPath = prefixPath(config.template.src, config.root);
    if (fs.existsSync(srcPath)) {
        fs.copySync(srcPath, prefixPath(config.build.templates, config.root))
        fancyLog(logSymbols.success, chalk.green('Done copying template files to build folder'));
    } else {
        fancyLog(logSymbols.warning, chalk.yellow('Nothing to copy because the source folder does not exist'), chalk.cyan(srcPath));
    }
}

/**
 * Copy the template files from the build folder to the src folder
 * 
 * @param {object} config The configuration object
 */
const copyBuildToSrc = (config) => {
    fancyLog(chalk.magenta('Copying template files from build folder to source folder'));
    const srcPath = prefixPath(config.build.templates, config.root);
    if (fs.existsSync(srcPath)) {
        fs.copySync(srcPath, prefixPath(config.template.src, config.root))
        fancyLog(logSymbols.success, chalk.green('Done copying template files from build folder to source folder'));
    } else {
        fancyLog(logSymbols.warning, chalk.yellow('Nothing to copy because the build folder does not exist'), chalk.cyan(srcPath));
    }
}

/**
 * 
 * @param {object} config The configuration object
 * @param {object} args The command line arguments from calling admin
 */
const templateHandler = (config, args) => {
    if (args.pull) {
        copyBuildToSrc(config);
    } else if (args.push) {
        copySrcToBuild(config);
    } else {
        fancyLog(logSymbols.error, chalk.red('No action specified'));
    }
}

export default templateHandler;