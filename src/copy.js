/* ===========================================================================
    Copy files from one location to another.
    This is typically used to copy files from the node_modules folder to the
    build folder.
=========================================================================== */


import { globSync } from 'glob';

// Build scripts
import config from './config.js';
import { copyFile } from './files.js';
import { removePrefix } from './helpers.js';


/**
 * Copy a file that was changed in the "copy files" watch process
 * 
 * @param {string} src The file source
 * @param {string} dest The file destination
 */
export const copyWatchFile = (src, dest) => {
    copyFile(removePrefix(src, config.data.root), dest, config.data.root, config.data.build.theme);
}

/**
 * Copy the files
 */
const copyFiles = async () => {
    if (Array.isArray(config.data.copy)) {
        config.data.copy.forEach((copy) => {
            if (typeof copy.dest === 'string' && copy.dest.length > 0) {
                let filesToCopy = [];
                if ((typeof copy.src === 'string' && copy.src.length > 0) || (Array.isArray(copy.src) && copy.src.length > 0)) {
                    filesToCopy = globSync(copy.src);
                }
                if (filesToCopy.length > 0) {
                    filesToCopy.forEach((file) => {
                        copyFile(file, copy.dest, config.data.root, config.data.build.theme);
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
export const copyHandler = async () => {
    await copyFiles();
}