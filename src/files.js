/* ===========================================================================
    File helper functions
=========================================================================== */

import fs from 'fs-extra';
import chalk from 'chalk';
import fancyLog from 'fancy-log';
import logSymbols from 'log-symbols';
import { parse } from 'path';

// Buld files
import config from './config.js';
import { prefixPath, prefixRootPath } from './helpers.js';

/**
 * Copy a single file to the destination folder
 * 
 * @param {string} src The file source
 * @param {string} dest The file destination
 * @param {string} srcRoot The source root folder. This should be an absolute path to the folder.
 * @param {string} destFolder The destination folder
 */
export const copyFile = (src, dest, srcRoot, destFolder) => {
    const srcPath = prefixPath(src, srcRoot);
    const destRoot = prefixRootPath(destFolder);
    let destPath = prefixPath(dest, destRoot, destFolder);
    const destPathParts = parse(destPath);
    if (destPathParts.ext === '') {
        // The destination path is a folder so add the source file to the destination path
        destPath = `${destPath}/${src}`;
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
 * Copy the files from a folder to another folder
 * 
 * @param {string} srcPath The path to the source folder. This is not an absolute path.
 * @param {string} destPath The destination path in the build folder. This is not an absolute path.
 * @param {string} startMessage The message to display when starting the copy
 * @param {string} successMessage The message to display when the copy is successful
 */
const copyFolder = (srcPath, destPath, startMessage, successMessage) => {
    fancyLog(chalk.magenta(startMessage));
    const rootSrcPath = prefixRootPath(srcPath);
    if (fs.existsSync(rootSrcPath)) {
        fs.copySync(rootSrcPath, prefixRootPath(destPath))
        fancyLog(logSymbols.success, chalk.green(successMessage));
    } else {
        fancyLog(logSymbols.warning, chalk.yellow('Nothing to copy because the folder does not exist'), chalk.cyan(srcPath));
    }
}

/**
 * Copy the files from the build folder to the src folder
 * 
 * @param {string} srcPath The path to the source folder. This is not an absolute path.
 * @param {string} destPath The destination path in the build folder. This is not an absolute path.
 * @param {string} type The type of file being copied
 */
export const copyBuildToSrc = (srcPath, destPath, type) => {
    copyFolder(srcPath, destPath, `Copying ${type} from build folder to source folder`, `Done copying ${type} from build folder to source folder`);
}

/**
 * Copy all the files from the src folder to the build folder
 * 
 * @param {object} config The configuration object
 * @param {string} srcPath The path to the source folder. This is not an absolute path.
 * @param {string} destPath The destination path in the build folder. This is not an absolute path.
 * @param {string} type The type of file being copied
 */
export const copySrcToBuild = (srcPath, destPath, type) => {
    copyFolder(srcPath, destPath, `Copying ${type} from source folder to build folder`, `Done copying ${type} from source folder to build folder`);
}

/**
 * Removes a file from the build folder
 * 
 * @param {string} path The path to the file to remove from the build folder
 * @param {string} rootPath The root path to the file in the build folder (not an absolute path)
 * @param {string} itemType The type of item to remove. Used in the messaging.
 */
export const removeFileFromBuild = (path, rootPath, itemType) => {
    const destRoot = prefixRootPath(rootPath);
    const destPath = prefixPath(path, destRoot);
    if (fs.existsSync(destPath)) {
        fs.removeSync(destPath);
        fancyLog(logSymbols.success, chalk.green(`Done removing ${itemType} from the build folder`), chalk.cyan(path));
    } else {
        fancyLog(logSymbols.warning, chalk.yellow('Nothing to remove because the file does not exist in the build folder'), chalk.cyan(path));
    }
}