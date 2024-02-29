/* ===========================================================================
    Helper functions for the build scripts
=========================================================================== */

/**
 * Get the processed glob path
 *
 * @param {string} glob The glob path
 * @returns {string}
 */
export const getGlob = (glob) => {
    let returnValue = glob;
    // If the glob ends with "/" then assume that the developer intended to
    // reference all files in the folder
    if (returnValue.endsWith('/')) {
        returnValue = `${returnValue}**/*`;
    }
    // If the return path ends with "**" then change it to "*" because it could match the
    // directory and all files. We don't want that for FTP. We only want the files.
    if (returnValue.endsWith('**')) {
        returnValue = `${returnValue.slice(0, returnValue.length - 2)}*`;
    }
    return returnValue;
}

/**
 * Prefix a base path to a file/glob path if it doesn't already start with the base path.
 *
 * @param {string} path The file/glob path
 * @param {string} basePath The base path to prefix to 'path' if it doesn't already start with it
 * @returns {string}
 */
export const prefixPath = (path, basePath) => {
    let returnValue = path;
    let base = basePath;
    if (base.endsWith('/')) {
        base = base.slice(0, base.length - 1);
    }
    if (!returnValue.startsWith(`${base}/`) && returnValue !== base) {
        returnValue = `${base}/${returnValue}`;
    }
    return returnValue;
}

/**
 * Returns if the value is an object
 *
 * @link https://attacomsian.com/blog/javascript-check-variable-is-object
 *
 * @param {mixed} thing The value to test
 * @returns {boolean}
 */
export const isObjectWithValues = (thing) =>
    Object.prototype.toString.call(thing) === '[object Object]' && Object.keys(thing).length > 0;