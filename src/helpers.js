/* ===========================================================================
    Helper functions for the build scripts
=========================================================================== */

import fs from 'fs-extra';
import { globSync } from 'glob';
import { isAbsolute, resolve } from 'path';

// Build scripts
import config from './config.js';
import { isStringWithValue, isObjectWithValues } from './lib/types.js';

/**
 * Get the processed glob path
 *
 * @param {string} glob The glob path
 * @returns {string}
 */
export const processGlobPath = (glob) => {
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
};

/**
 * Get the globs from the glob path
 *
 * @param {string} glob The glob path
 * @returns {Array<string>}
 */
export const getGlob = (glob) => globSync(processGlobPath(glob));

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
    if (
        !returnValue.startsWith(`${base}/`)
        && returnValue !== base
        && returnValue !== baseFolder
    ) {
        returnValue = `${base}/${returnValue}`;
    }
    return returnValue;
};

/**
 * Prefixes one or more paths to the path
 *
 * @param {string} path The path to prefix to
 * @param {Array} prefixes The array of paths to prefix to the path
 * @returns {string}
 */
const prefixPaths = (path, prefixes) => {
    let processedPath = path;
    if (Array.isArray(prefixes)) {
        prefixes.forEach((prefix) => {
            processedPath = prefixPath(processedPath, prefix);
        });
    }
    return processedPath;
};

/**
 * Prefix the root path
 *
 * @param {string} path The file/glob path
 * @param {Array} [additionalPrefixes] An array of additional prefixes to add to the path
 * @returns {string}
 */
export const prefixRootPath = (path, additionalPrefixes) => prefixPath(prefixPaths(path, additionalPrefixes), config.data.root);

/**
 * Prefix the build path
 *
 * @param {string} path The file/glob path
 * @returns {string}
 */
export const prefixBuildPath = (path) => prefixPath(path, config.data.build.base);

/**
 * Prefix the root and build paths to the path
 *
 * @param {string} path The file/glob path
 * @returns {string}
 */
export const prefixRootBuildPath = (path) => prefixRootPath(prefixBuildPath(path));

/**
 * Prefix the src path
 *
 * @param {string} path The file/glob path
 * @returns {string}
 */
export const prefixSrcPath = (path) => prefixPath(path, config.data.src);

/**
 * Prefix the src and root paths
 *
 * @param {string} path The file/glob path
 * @param {Array} [additionalPrefixes] An array of additional prefixes to add to the path
 * @returns {string}
 */
export const prefixRootSrcPath = (path, additionalPrefixes) => prefixRootPath(prefixSrcPath(prefixPaths(path, additionalPrefixes)));

/**
 * Prefix the theme build path
 *
 * @param {string} path The file/glob path
 * @param {Array} [additionalPrefixes] An array of additional prefixes to add to the path
 * @returns {string}
 */
export const prefixThemeBuildPath = (path, additionalPrefixes) => prefixPath(prefixPaths(path, additionalPrefixes), config.data.build.theme);

/**
 * Prefix the theme build and root paths to the path
 *
 * @param {string} path The file/glob path
 * @param {Array} [additionalPrefixes] An array of additional prefixes to add to the path
 * @returns {string}
 */
export const prefixRootThemeBuildPath = (path, additionalPrefixes) => prefixRootPath(prefixThemeBuildPath(prefixPaths(path, additionalPrefixes)));

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
    } if (path.startsWith(`/${prefix}`)) {
        return path.slice(prefix.length + 1);
    }
    return path;
};

/**
 * Remove one or more prefixes from a path
 *
 * @param {string} path The original path
 * @param {Array} prefixes An array of prefixes to remove from the path.
 *   They should be in nested order. The first is removed, and then the second, etc.
 * @returns {string}
 */
export const removePrefixes = (path, prefixes) => {
    let returnValue = path;
    prefixes.forEach((prefix) => {
        returnValue = removePrefix(returnValue, prefix);
    });
    return returnValue;
};

/**
 * Removes the root prefix from the path
 *
 * @param {string} path The path
 * @param {Array} [additionalPrefixes] An array of additional prefixes to remove from the path
 * @returns {string}
 */
export const removeRootPrefix = (path, additionalPrefixes) => {
    let returnValue = removePrefix(path, config.data.root);
    if (Array.isArray(additionalPrefixes)) {
        additionalPrefixes.forEach((prefix) => {
            returnValue = removePrefix(returnValue, prefix);
        });
    }
    return removePrefix(returnValue, '/');
};

/**
 * Removes the root source prefix from the path
 *
 * @param {string} path The path
 * @param {Array} [additionalPrefixes] An array of additional prefixes to remove from the path
 * @returns {string}
 */
export const removeRootSrcPrefix = (path, additionalPrefixes) => {
    let prefixes = [config.data.root, config.data.src];
    if (Array.isArray(additionalPrefixes)) {
        prefixes = prefixes.concat(additionalPrefixes);
    }
    prefixes.push('/');
    return removePrefixes(path, prefixes);
};

/**
 * Remove the root theme build prefix from a path
 *
 * @param {string} path The path to the remove the prefixes from
 * @returns {string}
 */
export const removeRootThemeBuildPrefix = (path) => removePrefixes(path, [config.data.build.theme, config.data.root]);

/**
 * Set up the root directory and change the working directory if necessary
 *
 * By default the working directory will be the directory where the command was run.
 * If the --root option is passed in then the root directory will be set to the specified directory.
 *
 * @param {string} rootPath The root path to set up
 */
export const setupRoot = (rootPath) => {
    if (isStringWithValue(rootPath)) {
        let cwd = process.cwd();
        let root = rootPath;
        if (!isAbsolute(root)) {
            root = resolve(cwd, root);
        }
        cwd = root;
    }
};

/**
 * Recursively get the keys from an object
 *
 * @param {object} obj The object to get keys from
 * @returns {string[]} An array of keys
 */
export const getObjectKeysRecursive = (obj) => {
    let keys = [];
    if (isObjectWithValues(obj)) {
        Object.keys(obj).forEach((key) => {
            if (typeof obj[key] === 'object') {
                if (Array.isArray(obj[key])) {
                    obj[key].forEach((item) => {
                        keys = keys.concat(getObjectKeysRecursive(item));
                    });
                } else {
                    keys = keys.concat(getObjectKeysRecursive(obj[key]));
                }
            }
            keys.push(key);
        });
    }
    return [...new Set(keys)];
};

/**
 * Sorts an object by it's keys
 *
 * @param {object} obj The object to sort
 * @returns {object}
 */
export const sortObjectByKeys = (obj) => {
    const sorted = {};
    Object.keys(obj).sort().forEach((key) => {
        sorted[key] = obj[key];
    });
    return sorted;
};

/**
 * Really basic function to test and see if the file contents are different
 *
 * @param {string} sourceFile The source file contents
 * @param {string} targetPath The path for the target file
 * @returns {boolean}
 */
export const areFilesDifferent = (sourceFile, targetPath) => {
    if (fs.pathExistsSync(targetPath)) {
        const targetData = fs.readFileSync(targetPath, 'utf-8');
        return sourceFile !== targetData;
    }
    return true;
};
