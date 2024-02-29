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
 * 
 * @param {object} config The configuration object
 */
const copyAllSrcToBuild = (config) => {
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
 * Copy a template file to the build folder
 * 
 * @param {object} config The configuration object
 * @param {string} path The template file path
 */
export const copyTemplateSrcToBuild = (config, path) => {
    fancyLog(chalk.magenta('Copying template file'), chalk.cyan(path), chalk.magenta('to build folder'));
    const srcRoot = prefixPath(config.template.src, config.root);
    const srcPath = prefixPath(path, srcRoot);
    const destRoot = prefixPath(config.build.templates, config.root);
    const destPath = prefixPath(path, destRoot);
    if (fs.existsSync(srcPath)) {
        fs.copySync(srcPath, destPath)
        fancyLog(logSymbols.success, chalk.green('Done copying template file to the build folder'), chalk.cyan(path));
    } else {
        fancyLog(logSymbols.warning, chalk.yellow('Nothing to copy because the source folder does not exist'), chalk.cyan(srcPath));
    }
}

/**
 * Removes a deleted template file from the build directory
 * 
 * @param {object} config The configuration object
 * @param {string} path The template file path
 */
export const removeTemplateFileFromBuild = (config, path) => {
    const destRoot = prefixPath(config.build.templates, config.root);
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
    const srcPath = prefixPath(config.build.templates, config.root);
    if (fs.existsSync(srcPath)) {
        fs.copySync(srcPath, prefixPath(config.template.src, config.root))
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
