/* ===========================================================================
    Copy files from one location to another.
    This is typically used to copy files from the node_modules folder to the
    build folder.
=========================================================================== */

import { globSync, hasMagic } from 'glob';
import { parse } from 'path';

// Build scripts
import config from './config.js';
import { copyFileToThemeBuild } from './files.js';
import { removeRootPrefix } from './helpers.js';

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
 * Copy the files
 */
const copyFiles = async () => {
    if (Array.isArray(config.data.copy)) {
        config.data.copy.forEach((copy) => {
            if (typeof copy.dest === 'string' && copy.dest.length > 0) {
                let filesToCopy = [];
                // Need to set the correct source root path for the file(s) to copy
                // so that the destination path can be built correctly
                let srcRoot = '';
                if (
                    (typeof copy.src === 'string' && copy.src.length > 0)
                    || (Array.isArray(copy.src) && copy.src.length > 0)
                ) {
                    filesToCopy = globSync(copy.src);
                    if (hasMagic(copy.src)) {
                        // Get the source root path before the first "*" (i.e. before the glob pattern)
                        srcRoot = copy.src.split('*').shift();
                    } else {
                        // The source is not a glob so the source root path will be the directory of the source file
                        srcRoot = parse(copy.src).dir;
                    }
                }
                if (filesToCopy.length > 0) {
                    filesToCopy.forEach((file) => {
                        copyFileToThemeBuild(file, srcRoot, copy.dest);
                    });
                }
            }
        });
    }
};

/**
 * Process the copy request
 */
export const copyHandler = async () => {
    await copyFiles();
};
