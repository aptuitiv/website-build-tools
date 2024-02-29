/* ===========================================================================
    Copy font files to the build folder
=========================================================================== */

import fs from 'fs-extra';
import chalk from 'chalk';
import fancyLog from 'fancy-log';
import logSymbols from 'log-symbols';

// Build files
import { copyFile } from './copy.js';
import { prefixPath } from './helpers.js';

export const copyFontSrcToBuild = (config, path) => {
    const srcRoot = prefixPath(prefixPath(config.fonts.src, config.src), config.root);
    copyFile(config, path, '', srcRoot, prefixPath(config.fonts.build, config.build.theme));
}

/**
 * Removes a deleted font file from the build directory
 * 
 * @param {object} config The configuration object
 * @param {string} path The template file path
 */
export const removeFontFileFromBuild = (config, path) => {
    const destRoot = prefixPath(prefixPath(config.fonts.build, config.build.theme), config.root);
    const destPath = prefixPath(path, destRoot);
    if (fs.existsSync(destPath)) {
        fs.removeSync(destPath);
        fancyLog(logSymbols.success, chalk.green('Done removing font file from the build folder'), chalk.cyan(path));
    } else {
        fancyLog(logSymbols.warning, chalk.yellow('Nothing to remove because the file does not exist in the build folder'), chalk.cyan(destPath));
    }
}

/**
 * Copy all of the font files from the src folder to the build folder
 * 
 * @param {object} config The configuration object
 */
const copyAllSrcToBuild = (config) => {
    fancyLog(chalk.magenta('Copying font files to build folder'));
    const srcPath = prefixPath(prefixPath(config.fonts.src, config.src), config.root);
    if (fs.existsSync(srcPath)) {
        fs.copySync(srcPath, prefixPath(prefixPath(config.fonts.build, config.build.theme), config.root))
        fancyLog(logSymbols.success, chalk.green('Done copying font files to build folder'));
    } else {
        fancyLog(logSymbols.warning, chalk.yellow('Nothing to copy because the source folder does not exist'), chalk.cyan(srcPath));
    }
}

/**
 * Process the export request
 * 
 * @param {object} config The configuration object
 */
const fontHandler = async (config, action) => {
    if (action === 'copyAll') {
        copyAllSrcToBuild(config);
    }
}

export default fontHandler;