#! /usr/bin/env node

/* ===========================================================================
    Functions to work with template files
=========================================================================== */

import fs, { copy } from 'fs-extra';
import chalk from 'chalk';
import fancyLog from 'fancy-log';
import logSymbols from 'log-symbols';

// Build scripts
import { prefixPath } from './helpers.js';
import { copyFile } from './copy.js';

/**
 * Copy all of the theme files from the src folder to the build folder
 * 
 * @param {object} config The configuration object
 */
const copyAllSrcToBuild = (config) => {
    fancyLog(chalk.magenta('Copying template files to build folder'));
    const srcPath = prefixPath(prefixPath(config.templates.src, config.src), config.root);
    if (fs.existsSync(srcPath)) {
        fs.copySync(srcPath, prefixPath(prefixPath(config.templates.build, config.build.theme), config.root))
        fancyLog(logSymbols.success, chalk.green('Done copying template files to build folder'));
    } else {
        fancyLog(logSymbols.warning, chalk.yellow('Nothing to copy because the source folder does not exist'), chalk.cyan(srcPath));
    }
}

/**
 * Copy a template file to the build folder
 * 
 * @param {object} config The configuration object
 * @param {string} path The template file path
 */
export const copyTemplateSrcToBuild = (config, path) => {
    const srcRoot = prefixPath(prefixPath(config.templates.src, config.src), config.root);
    copyFile(config, path, '', srcRoot, prefixPath(config.templates.build, config.build.theme));
}

/**
 * Removes a deleted template file from the build directory
 * 
 * @param {object} config The configuration object
 * @param {string} path The template file path
 */
export const removeTemplateFileFromBuild = (config, path) => {
    const destRoot = prefixPath(prefixPath(config.templates.build, config.build.theme), config.root);
    const destPath = prefixPath(path, destRoot);
    if (fs.existsSync(destPath)) {
        fs.removeSync(destPath);
        fancyLog(logSymbols.success, chalk.green('Done removing template file from the build folder'), chalk.cyan(path));
    } else {
        fancyLog(logSymbols.warning, chalk.yellow('Nothing to remove because the file does not exist in the build folder'), chalk.cyan(destPath));
    }
}

/**
 * Copy the template files from the build folder to the src folder
 * 
 * @param {object} config The configuration object
 */
const copyAllBuildToSrc = (config) => {
    fancyLog(chalk.magenta('Copying template files from build folder to source folder'));
    const srcPath = prefixPath(prefixPath(config.templates.build, config.build.theme), config.root);
    if (fs.existsSync(srcPath)) {
        fs.copySync(srcPath, prefixPath(prefixPath(config.templates.src, config.src), config.root))
        fancyLog(logSymbols.success, chalk.green('Done copying template files from build folder to source folder'));
    } else {
        fancyLog(logSymbols.warning, chalk.yellow('Nothing to copy because the build folder does not exist'), chalk.cyan(srcPath));
    }
}

/**
 * Processs the template request
 * 
 * @param {object} config The configuration object
 * @param {object} args The command line arguments from calling admin
 */
export const templateHandler = (config, args) => {
    if (args.pull) {
        copyAllBuildToSrc(config);
    } else if (args.push) {
        copyAllSrcToBuild(config);
    } else {
        fancyLog(logSymbols.error, chalk.red('No action specified'));
    }
}
