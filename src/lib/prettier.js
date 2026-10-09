/* ===========================================================================
    Prettier formatting helpers
=========================================================================== */

import fs from 'fs-extra';
import { extname, resolve } from 'path';
import prettier from 'prettier';

// Build scripts
import { logWarning } from './log.js';

/**
 * Default Prettier options used when the project does not have its own Prettier configuration.
 * These match the .prettierrc.cjs file that is copied into new projects.
 */
const defaultOptions = {
    arrowParens: 'always',
    endOfLine: 'lf',
    semi: true,
    singleQuote: true,
    tabWidth: 4,
};

/**
 * Default Prettier options for JSON files. These match the "*.json" override in the .prettierrc.cjs file.
 */
const defaultJsonOptions = {
    printWidth: 120,
};

/**
 * Format the content with Prettier
 *
 * The project's Prettier configuration (and .editorconfig) is used if it exists.
 * If Prettier fails to format the content then the original content is returned.
 *
 * @param {string} content The content to format
 * @param {string} filePath The path to the file. Used to resolve the Prettier configuration and to infer the parser.
 * @param {object} [options] Additional Prettier options. For example, set "parser" for files without a known extension.
 * @returns {Promise<string>}
 */
export const formatWithPrettier = async (content, filePath, options = {}) => {
    const absolutePath = resolve(filePath);
    try {
        // Don't use the cache because the Prettier config files may have just been created.
        const projectOptions = await prettier.resolveConfig(absolutePath, {
            editorconfig: true,
            useCache: false,
        });
        const isJson =
            extname(absolutePath) === '.json' || options.parser === 'json';
        return await prettier.format(content, {
            ...defaultOptions,
            ...(isJson ? defaultJsonOptions : {}),
            ...(projectOptions ?? {}),
            ...options,
            filepath: absolutePath,
        });
    } catch (error) {
        logWarning(
            `Unable to format ${filePath} with Prettier: ${error.message}`,
        );
        return content;
    }
};

/**
 * Format the content with Prettier and write it to the file
 *
 * @param {string} filePath The path to the file
 * @param {string} content The content to format and write
 * @param {object} [options] Additional Prettier options
 * @returns {Promise<void>}
 */
export const writeFormattedFile = async (filePath, content, options = {}) => {
    const formatted = await formatWithPrettier(content, filePath, options);
    await fs.writeFile(filePath, formatted);
};

/**
 * Convert the data to JSON, format it with Prettier, and write it to the file
 *
 * @param {string} filePath The path to the file
 * @param {object|Array} data The data to write
 * @param {object} [options] Additional Prettier options
 * @returns {Promise<void>}
 */
export const writeFormattedJson = async (filePath, data, options = {}) => {
    await writeFormattedFile(filePath, JSON.stringify(data, null, 4), options);
};
