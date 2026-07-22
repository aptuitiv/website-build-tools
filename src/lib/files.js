/* ===========================================================================
    File helpers
=========================================================================== */

import fs from 'fs-extra';

/**
 * Returns if the directory has files
 *
 * @param {string} path The full path to the directory to test for files
 * @returns {boolean} True if the directory has files, false if not
 */
export const hasFiles = (path) => {
    let returnValue = false;
    if (fs.pathExistsSync(path)) {
        // Use withFileTypes so we can exclude directory entries. A recursive
        // readdir includes subdirectories, so a tree of only (empty) folders
        // would otherwise be reported as having files. .some() also short-circuits.
        const entries = fs.readdirSync(path, {
            recursive: true,
            withFileTypes: true,
        });
        returnValue = entries.some((entry) => entry.isFile());
    }
    return returnValue;
};

/**
 * Returns if the directory has files with a file extension
 *
 * @param {string} path The full path to the directory to test for files
 * @param {string} extension The file extension to test for
 * @returns {boolean} True if the directory has files with the file extension, false if not
 */
export const hasFilesByExtension = (path, extension) => {
    const ext = `.${extension}`;
    let returnValue = false;
    if (fs.pathExistsSync(path)) {
        // Use withFileTypes so directory entries (e.g. a folder literally named
        // "foo.svg") aren't counted as matching files. .some() short-circuits
        // once a match is found instead of scanning the whole tree.
        const entries = fs.readdirSync(path, {
            recursive: true,
            withFileTypes: true,
        });
        returnValue = entries.some(
            (entry) => entry.isFile() && entry.name.endsWith(ext),
        );
    }
    return returnValue;
};
