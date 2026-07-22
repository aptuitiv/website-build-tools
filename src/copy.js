/* ===========================================================================
    Copy files from one location to another.
    This is typically used to copy files from the node_modules folder to the
    build folder.
=========================================================================== */

import chalk from 'chalk';
import fancyLog from 'fancy-log';
import { globSync, hasMagic } from 'glob';
import logSymbols from 'log-symbols';
import { parse } from 'path';

// Build scripts
import config from './config.js';
import { copyFileToThemeBuild } from './files.js';
import { removeRootPrefix } from './helpers.js';
import { isStringWithValue } from './lib/types.js';

/**
 * Copy a file that was changed in the "copy files" watch process
 *
 * @param {string} src The file source
 * @param {string} srcRoot The root path to the source file. This is used to remove the root path from the file path to help
 *      build the correct destination path. This is useful when the source path was originally a glob pattern.
 * @param {string} dest The file destination
 */
export const copyWatchFile = (src, srcRoot, dest) => {
    copyFileToThemeBuild(removeRootPrefix(src), srcRoot, dest);
};

/**
 * Build a copy-data entry for a single source path or glob.
 *
 * @param {string} src The source file path or glob pattern
 * @param {string} dest The destination path
 * @returns {?object} The copy entry ({ files, srcRoot, dest }), or null if the source matched no files
 */
const buildCopyEntry = (src, dest) => {
    const files = globSync(src);
    if (files.length === 0) {
        return null;
    }
    // Determine the correct source root path so the destination path can be built correctly.
    let srcRoot;
    if (hasMagic(src)) {
        // Get the source root path before the first "*" (i.e. before the glob pattern)
        srcRoot = src.split('*').shift();
    } else {
        // The source is not a glob so the source root path is the directory of the source file
        srcRoot = parse(src).dir;
    }
    return { files, srcRoot, dest };
};

/**
 * Prepares the data for copying files
 *
 * @returns {Array} An array of objects containing the files to copy, the source root path, and the destination path
 */
export const prepareCopyData = () => {
    const returnData = [];
    if (Array.isArray(config.data.copy)) {
        // Format the copy data
        config.data.copy.forEach((copy) => {
            if (isStringWithValue(copy.dest)) {
                if (isStringWithValue(copy.src)) {
                    const entry = buildCopyEntry(copy.src, copy.dest);
                    if (entry) {
                        returnData.push(entry);
                    }
                } else if (Array.isArray(copy.src) && copy.src.length > 0) {
                    // An array of files/globs was specified.
                    // Treat each one individually to get the correct source root path.
                    copy.src.forEach((file) => {
                        if (isStringWithValue(file)) {
                            const entry = buildCopyEntry(file, copy.dest);
                            if (entry) {
                                returnData.push(entry);
                            }
                        } else {
                            fancyLog(
                                logSymbols.error,
                                chalk.red('The file path is not a string'),
                                chalk.cyan(file),
                            );
                        }
                    });
                }
            }
        });
    }
    return returnData;
};

/**
 * Copy the files
 */
const copyFiles = async () => {
    const copyData = prepareCopyData();
    // Copy the files
    if (copyData.length > 0) {
        copyData.forEach((copy) => {
            copy.files.forEach((file) => {
                copyFileToThemeBuild(file, copy.srcRoot, copy.dest);
            });
        });
    }
};

/**
 * Process the copy request
 *
 * @param {object} args The command line arguments
 */
export const copyHandler = async (args) => {
    // Make sure that the config is the most current version.
    // If the `init` command was run it's possible that the config could be out of date.
    await config.reload(args);

    await copyFiles();
};
