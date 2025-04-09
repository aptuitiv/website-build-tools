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
        const files = fs.readdirSync(path, { recursive: true });
        returnValue = files.length > 0;
    }
    return returnValue
}

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
        const files = fs.readdirSync(path, { recursive: true });
        files.forEach((file) => {
            if (file.endsWith(ext)) {
                returnValue = true;
            }
        });
    }
    return returnValue;
}
