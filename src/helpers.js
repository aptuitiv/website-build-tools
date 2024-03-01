/* ===========================================================================
    Helper functions for the build scripts
=========================================================================== */

import config from './config.js';

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
 * @param {string} [baseFolder] The base folder to see if the path equals. This base folder would
 *      be the ending part of the basePath
 * @returns {string}
 */
export const prefixPath = (path, basePath, baseFolder) => {
    let returnValue = path;
    if (returnValue.startsWith('/')) {
        returnValue = returnValue.slice(1);
    }
    let base = basePath;
    if (base.endsWith('/')) {
        base = base.slice(0, base.length - 1);
    }
    // First make sure that the path doesn't start with or equal the base folder.
    // The basePath will end with the base folder so this should be removed
    // from the path if it is there.
    if (typeof baseFolder === 'string' && baseFolder.length > 0) {
        if (returnValue.startsWith(`${baseFolder}/`)) {
            returnValue = returnValue.slice(baseFolder.length + 1);
        } else if (returnValue === baseFolder) {
            returnValue = '';
        }
    }
    // Prepend the base path if the path doesn't already start with it or equal to it
    if (!returnValue.startsWith(`${base}/`) && returnValue !== base && returnValue !== baseFolder) {
        returnValue = `${base}/${returnValue}`;
    }
    return returnValue;
}

/**
 * Prefix the build path
 * 
 * @param {string} path The file/glob path
 * @returns {string}
 */
export const prefixBuildPath = (path) => {
    return prefixPath(path, config.data.build.base);
}

/**
 * Prefix the root path
 * 
 * @param {string} path The file/glob path
 * @returns {string}
 */
export const prefixRootPath = (path) => {
    return prefixPath(path, config.data.root);
}

/**
 * Prefix the src path
 * 
 * @param {string} path The file/glob path
 * @returns {string}
 */
export const prefixSrcPath = (path) => {
    return prefixPath(path, config.data.src);
}

/**
 * Prefix the src and root paths
 * 
 * @param {string} path The file/glob path
 * @returns {string}
 */
export const prefixRootSrcPath = (path) => {
    return prefixRootPath(prefixSrcPath(path));
}

/**
 * Prefix the theme build path
 * 
 * @param {string} path The file/glob path
 * @returns {string}
 */
export const prefixThemeBuildPath = (path) => {
    return prefixPath(path, config.data.build.theme);
}

/**
 * Removes the prefix from the path
 * 
 * @param {string} path The file path
 * @param {string} prefix The file path prefix to remove
 * @returns {string}
 */
export const removePrefix = (path, prefix) => {
    if (path.startsWith(prefix)) {
        return path.slice(prefix.length);
    } else if (path.startsWith(`/${prefix}`)) {
        return path.slice(prefix.length + 1);
    }
    return path;
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
