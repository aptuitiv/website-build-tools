/* ===========================================================================
    Copy files from one location to another.
    This is typically used to copy files from the node_modules folder to the
    build folder.
=========================================================================== */

import fs from 'fs-extra';
import chalk from 'chalk';
import fancyLog from 'fancy-log';
import { globSync } from 'glob';
import logSymbols from 'log-symbols';
import { parse } from 'path';

// Build scripts
import { prefixPath, removePrefix } from './helpers.js';

/**
 * Copy a single file to the destination folder
 * 
 * @param {object} config The configuration object
 * @param {string} src The file source
 * @param {string} dest The file destination
 * @param {string} srcRoot The source root folder. This should be an absolute path to the folder.
 * @param {string} destFolder The destination folder
 */
export const copyFile = (config, src, dest, srcRoot, destFolder) => {
    const srcPath = prefixPath(src, srcRoot);
    const destRoot = prefixPath(destFolder, config.root);
    let destPath = prefixPath(dest, destRoot, destFolder);
    const destPathParts = parse(destPath);
    if (destPathParts.ext === '') {
        // The destination path is a folder so add the source file name to the destination path
        const pathParts = parse(srcPath);
        destPath = `${destPath}/${pathParts.base}`;
    }

    fancyLog(chalk.magenta('Copying'), chalk.cyan(src), chalk.magenta('to'), chalk.cyan(dest));
    if (fs.existsSync(srcPath)) {
        fs.copySync(srcPath, destPath)
        fancyLog(logSymbols.success, chalk.green('Done copying'), chalk.cyan(src), chalk.green('to'), chalk.cyan(dest));
    } else {
        fancyLog(logSymbols.warning, chalk.yellow('Nothing to copy because the source folder does not exist'), chalk.cyan(src));
    }
}

/**
 * Copy a file that was changed in the "copy files" watch process
 * 
 * @param {object} config The configuration object
 * @param {string} src The file source
 * @param {string} dest The file destination
 */
export const copyWatchFile = (config, src, dest) => {
    copyFile(config, removePrefix(src, config.root), dest, config.root, config.build.theme);
}

/**
 * Copy the files
 * 
 * @param {object} config The configuration object
 */
const copyFiles = async (config) => {
    if (Array.isArray(config.copy)) {
        config.copy.forEach((copy) => {
            if (typeof copy.dest === 'string' && copy.dest.length > 0) {
                let filesToCopy = [];
                if ((typeof copy.src === 'string' && copy.src.length > 0) || (Array.isArray(copy.src) && copy.src.length > 0)) {
                    filesToCopy = globSync(copy.src);
                }
                if (filesToCopy.length > 0) {
                    filesToCopy.forEach((file) => {
                        copyFile(config, file, copy.dest, config.root, config.build.theme);
                    });
                }
            }
        });
    }
}

/**
 * Process the copy request
 * 
 * @param {object} config The configuration object
 */
export const copyHandler = async (config) => {
    await copyFiles(config);
}