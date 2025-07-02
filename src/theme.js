/* ===========================================================================
    Theme actions
=========================================================================== */

import chalk from 'chalk';
import fancyLog from 'fancy-log';
import fs from 'fs-extra';
import logSymbols from 'log-symbols';

// Lib
import { isObject, isStringWithValue } from './lib/types.js';
import { objectHasValue } from './lib/object.js';

// Build files
import config from './config.js';
import {
    copyBuildFolderToSrc,
    copySrcFileToThemeBuild,
    copySrcFolderToBuild,
    removeFileFromThemeBuild,
} from './files.js';
import {
    prefixSrcPath,
    prefixThemeBuildPath,
} from './helpers.js';

/**
 * Copy the theme file to the build folder
 *
 * @param {string} path The file path
 */
export const copyThemeSrcToBuild = (path) => {
    copySrcFileToThemeBuild(
        path,
        config.data.themeConfig.src,
        config.data.themeConfig.build,
    );
};

/**
 * Removes a deleted theme config file from the build directory
 *
 * @param {string} path The file path
 */
export const removeThemeFileFromBuild = (path) => {
    removeFileFromThemeBuild(path, config.data.themeConfig.build, 'theme file');
};

/**
 * Process the theme request
 *
 * @param {string} action The action to take
 */
export const themeHandler = async (action) => {
    if (action === 'pull') {
        await copyBuildFolderToSrc(
            prefixThemeBuildPath(config.data.themeConfig.build),
            prefixSrcPath(config.data.themeConfig.src),
            'theme config files',
        );
        copySrcFileToThemeBuild(
            'theme.json',
            config.data.src,
            config.data.build.theme,
        );
    } else if (action === 'push') {
        await copySrcFolderToBuild(
            prefixSrcPath(config.data.themeConfig.src),
            prefixThemeBuildPath(config.data.themeConfig.build),
            'theme config files',
            ['*.md'], // Skip any markdown files
        );
        copySrcFileToThemeBuild(
            'theme.json',
            config.data.src,
            config.data.build.theme,
        );
    }
};

/**
 * Reorder the theme config object
 *
 * @param {object} obj The object to reorder
 * @returns {object} The reordered object
 */
const reorderThemeConfig = (obj) => {
    if (Array.isArray(obj)) {
        return obj.map(reorderThemeConfig);
    } if (isObject(obj)) {
        // The data keys and the order that they should be in the object.
        // Any other keys will be added to the end of the object in the order that they already are in the object.
        const reorderKeys = ['name', 'label', 'type', 'description'];
        const newObj = {};
        // Pull out the keys that we want in a specific order
        reorderKeys.forEach((key) => {
            if (objectHasValue(obj, key)) {
                newObj[key] = obj[key];
            }
        });
        // Add the rest of the keys to the end of the object in the order that they already are in the object
        for (const key of Object.keys(obj)) {
            if (!reorderKeys.includes(key)) {
                newObj[key] = reorderThemeConfig(obj[key]);
            }
        }
        return newObj;
    }
    return obj;
};

/**
 * Format a single theme setting file
 *
 * @param {string} [fileName] The name of the file to format.
 */
const formatThemeJsonFile = async (fileName) => {
    const filePath = `${prefixSrcPath(config.data.themeConfig.src)}/${fileName}`;
    if (fs.existsSync(filePath)) {
        const json = await fs.readJson(filePath);
        const formattedJson = reorderThemeConfig(json);
        fs.writeJSONSync(filePath, formattedJson, { spaces: 4 });
        fancyLog(logSymbols.success, chalk.green(`Updated the ${fileName} file`));
    } else {
        fancyLog(logSymbols.error, chalk.red(`The ${fileName} file does not exist`));
    }
};

/**
 * Format a single theme setting file or all theme setting files
 *
 * @param {string} [fileName] The name of the file to format. If not set then all theme setting files will be formatted.
 */
export const formatThemeJson = async (fileName) => {
    if (isStringWithValue(fileName)) {
        await formatThemeJsonFile(fileName);
    } else {
        await formatThemeJsonFile('theme-config.json');
        await formatThemeJsonFile('theme-settings.json');
        await formatThemeJsonFile('theme-styles.json');
    }
};
