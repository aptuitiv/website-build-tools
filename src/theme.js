/* ===========================================================================
    Theme actions
=========================================================================== */

import chalk from 'chalk';
import fancyLog from 'fancy-log';
import fs from 'fs-extra';
import logSymbols from 'log-symbols';
import path from 'path';

// Lib
import { isObject, isStringWithValue } from './lib/types.js';
import { objectHasValue } from './lib/object.js';

// Build files
import config from './config.js';
import {
    copySrcFileToThemeBuild,
    removeFileFromThemeBuild,
} from './files.js';
import {
    prefixSrcPath,
} from './helpers.js';

/**
 * Removes a deleted theme config file from the build directory
 *
 * @param {string} filePath The file path
 */
export const removeThemeFileFromBuild = (filePath) => {
    removeFileFromThemeBuild(filePath, config.data.themeConfig.build, 'theme file');
};

/**
 * Reorder the JSON object by the "name" property of each object in an array
 *
 * @param {object} json The JSON object to reorder
 * @returns {object} The reordered object
 */
const reorderJsonByName = (json) => {
    let returnValue = json;
    if (Array.isArray(json)) {
        returnValue = json.toSorted((a, b) => a.name.localeCompare(b.name));
    }
    return returnValue;
};

/**
 * Reorder the theme config top level groups or sections
 *
 * @param {object} obj The object to reorder
 * @returns {object} The reordered object
 */
const reorderThemeConfigGroupsOrSections = (obj) => {
    const returnValue = obj;
    if (isObject(returnValue)) {
        if (objectHasValue(returnValue, 'groups') && Array.isArray(returnValue.groups)) {
            returnValue.groups = reorderJsonByName(returnValue.groups);
        } else if (objectHasValue(returnValue, 'sections') && Array.isArray(returnValue.sections)) {
            returnValue.sections = reorderJsonByName(returnValue.sections);
        }
    }

    return returnValue;
};

/**
 * Reorder the theme config object
 *
 * @param {object} obj The object to reorder
 * @returns {object} The reordered object
 */
const reorderThemeConfigProperties = (obj) => {
    if (Array.isArray(obj)) {
        return obj.map(reorderThemeConfigProperties);
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
                newObj[key] = reorderThemeConfigProperties(obj[key]);
            }
        }
        return newObj;
    }
    return obj;
};

/**
 * Reorder the theme config object
 *
 * @param {object} json The JSON object to reorder
 * @returns {object} The reordered object
 */
const reorderThemeConfig = (json) => {
    let returnValue = reorderThemeConfigProperties(json);
    returnValue = reorderThemeConfigGroupsOrSections(returnValue);
    return returnValue;
};


/**
 * Validate the theme config fields
 *
 * @param {string} json The JSON object to validate
 * @param {string} parentName The name of the parent object from the parent object's "name" property.
 * @param {string} parentType The type of the parent object. "group" or "section"
 * @returns {boolean} True if the fields are valid, false otherwise
 */
const validateThemeJsonFields = (json, parentName, parentType) => {
    let returnValue = false;
    let parentError = '';
    if (isStringWithValue(parentName) && isStringWithValue(parentType)) {
        parentError = ` in the ${parentType} "${parentName}" `;
    }
    if (Array.isArray(json)) {
        for (let i = 0; i < json.length; i++) {
            const item = json[i];
            if (isObject(item)) {
                if (objectHasValue(item, 'name') && objectHasValue(item, 'label') && objectHasValue(item, 'type')) {
                    returnValue = true;
                } else {
                    returnValue = false;
                    fancyLog(logSymbols.error, chalk.bold.red(`One of the "fields" items ${parentError} is missing a "name" property. The item is:`), "\n", chalk.red(JSON.stringify(item, null, 4)));
                    break;
                }
            } else {
                returnValue = false;
                fancyLog(logSymbols.error, chalk.bold.red(`One of the "fields" items ${parentError} is not an object. The item is:`), "\n", chalk.red(JSON.stringify(item, null, 4)));
                break;
            }
        }
    } else {
        fancyLog(logSymbols.error, chalk.bold.red(`The "fields" property ${parentError} is not an array. The item is:`), "\n", chalk.red(JSON.stringify(json, null, 4)));
    }
    return returnValue;
};

/**
 * Validate the theme config groups or sections
 *
 * @param {string} json The JSON object to validate
 * @param {string} type Whether this is a "group" or a "section"
 * @returns {boolean} True if the groups or sections are valid, false otherwise
 */
const validateThemeJsonGroupsOrSections = (json, type) => {
    let returnValue = false;
    if (Array.isArray(json)) {
        for (let i = 0; i < json.length; i++) {
            const item = json[i];
            if (isObject(item)) {
                if (objectHasValue(item, 'name')) {
                    returnValue = true;
                    // Validate any fields in the group or section
                    if (objectHasValue(item, 'fields')) {
                        returnValue = validateThemeJsonFields(item.fields, item.name, type);
                        if (!returnValue) {
                            break;
                        }
                    } else if (type === 'group') {
                        // The group doesn't have fields, which could be ok. Check to see if it has a "groups" or "sections" property.
                        if (objectHasValue(item, 'groups')) {
                            returnValue = validateThemeJsonGroupsOrSections(item.groups, 'group');
                            if (!returnValue) {
                                break;
                            }
                        } else if (objectHasValue(item, 'sections')) {
                            returnValue = validateThemeJsonGroupsOrSections(item.sections, 'section');
                            if (!returnValue) {
                                break;
                            }
                        } else {
                            // The group doesn't have a "groups" or "sections" property.
                            fancyLog(logSymbols.warning, chalk.yellow(`The "${type}" "${item.name}" is missing a "fields", "groups" or "sections" property. A group with no fields, groups or sections will not be displayed.`));
                        }
                    } else {
                        // This is a section with no fields.
                        fancyLog(logSymbols.warning, chalk.yellow(`The "${type}" "${item.name}" is missing a "fields" property. A section with no fields will not be displayed.`));
                    }
                } else {
                    returnValue = false;
                    fancyLog(logSymbols.error, chalk.bold.red(`One of the "${type}s" items is missing a "name" property. The item is:`), "\n", chalk.red(JSON.stringify(item, null, 4)));
                    break;
                }
            } else {
                returnValue = false;
                fancyLog(logSymbols.error, chalk.bold.red(`One of the "${type}s" items is not an object. The item is:`), "\n", chalk.red(JSON.stringify(item, null, 4)));
                break;
            }
        }
    } else {
        fancyLog(logSymbols.error, chalk.bold.red(`The "${type}s" property is not an array. The item is:`), "\n", chalk.red(JSON.stringify(json, null, 4)));
    }
    return returnValue;
};


/**
 * Validate the theme config file
 *
 * @param {string} json The JSON object to validate
 * @param {string} fileName The name of the theme config file to validate
 * @returns {boolean} True if the file is valid, false otherwise
 */
const validateThemeJsonFile = (json, fileName) => {
    let returnValue = false;
    // eslint-disable-next-line no-console -- We do this to add a blank line to the console
    console.log('');
    fancyLog(logSymbols.info, chalk.blue(`Validating the ${fileName} file`));
    if (isObject(json)) {
        if (Object.keys(json).length > 0) {
            if (objectHasValue(json, 'groups')) {
                returnValue = validateThemeJsonGroupsOrSections(json.groups, 'group');
            } else if (objectHasValue(json, 'sections')) {
                returnValue = validateThemeJsonGroupsOrSections(json.sections, 'section');
            } else if (objectHasValue(json, 'fields')) {
                returnValue = validateThemeJsonFields(json.fields);
            } else {
                fancyLog(logSymbols.error, chalk.red(`The ${fileName} file should have a "groups" or "fields" property`));
            }
        } else {
            // This is an empty object. Mark it as valid.
            // This allows the file to intially have an empty object like {}.
            returnValue = true;
        }
    }
    if (Array.isArray(json)) {
        returnValue = json.every((item) => isObject(item));
    }
    return returnValue;
};

/**
 * Validate and format the theme config file
 *
 * @param {string} fileName The name of the theme config file to process
 */
const processThemeJsonFile = async (fileName) => {
    const filePath = `${prefixSrcPath(config.data.themeConfig.src)}/${fileName}`;
    if (fs.existsSync(filePath)) {
        const content = await fs.readFile(filePath, 'utf8');
        if (content.trim().length > 0) {
            const json = await fs.readJson(filePath);
            if (validateThemeJsonFile(json, fileName)) {
                fancyLog(logSymbols.success, chalk.green(`${fileName} file is valid`));
                const formattedJson = reorderThemeConfig(json);
                if (JSON.stringify(json) !== JSON.stringify(formattedJson)) {
                    fs.writeJSONSync(filePath, formattedJson, { spaces: 4 });
                }
                fancyLog(logSymbols.success, chalk.green(`Formatted the ${fileName} file`));
            } else {
                fancyLog(logSymbols.error, chalk.red(`The ${fileName} file is not valid. Please fix the file and try again.`));
            }
        } else {
            // This is an empty file. Mark it as valid.
            fancyLog(logSymbols.success, chalk.green(`${fileName} is empty, but that's ok.`));
        }
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
        await processThemeJsonFile(fileName);
        fancyLog(logSymbols.success, chalk.green('Done formatting the theme configuration JSON file'));
    } else {
        await processThemeJsonFile('theme-settings.json');
        await processThemeJsonFile('theme-styles.json');
        // eslint-disable-next-line no-console -- We do this to add a blank line to the console
        console.log('');
        fancyLog(logSymbols.success, chalk.green('Done formatting the theme configuration JSON files'));
    }
};

/**
 * Copy the theme file to the build folder
 *
 * @param {string} filePath The file path
 */
export const copyThemeSrcToBuild = async (filePath) => {
    const fileName = path.basename(filePath);
    let isValid = true;
    if (fileName !== 'theme-config.json') {
        // @todo Validate the theme-config.json file.
        try {
            await formatThemeJson(fileName);
        } catch (error) {
            isValid = false;
            fancyLog(logSymbols.error, chalk.red(`Error formatting the ${fileName} file`), error);
        }
    }
    if (isValid) {
        copySrcFileToThemeBuild(
            fileName,
            config.data.themeConfig.src,
            config.data.themeConfig.build,
        );
    } else {
        fancyLog(logSymbols.error, chalk.red(`Stopped processing ${fileName} due to a validation error`));
    }
};


/**
 * Process the theme request
 */
export const pushTheme = async () => {
    fancyLog(chalk.magenta('Copying theme config files from source folder to build folder'));
    // Copy the legacy theme.json file to the build directory if it exists.
    copySrcFileToThemeBuild(
        'theme.json',
        config.data.src,
        config.data.build.theme,
    );

    // Copy the theme config file to build directory.
    // @todo Validate this file.
    copySrcFileToThemeBuild(
        'theme-config.json',
        config.data.themeConfig.src,
        config.data.themeConfig.build,
    );

    // Process and copy the theme-settings.json file to the build directory.
    try {
        await processThemeJsonFile('theme-settings.json');
        copySrcFileToThemeBuild(
            'theme-settings.json',
            config.data.themeConfig.src,
            config.data.themeConfig.build,
        );
    } catch (error) {
        fancyLog(logSymbols.error, chalk.red('Error processing the theme-settings.json file'), error);
    }
    // Process and copy the theme-styles.json file to the build directory.
    try {
        await processThemeJsonFile('theme-styles.json');
        copySrcFileToThemeBuild(
            'theme-styles.json',
            config.data.themeConfig.src,
            config.data.themeConfig.build,
        );
    } catch (error) {
        fancyLog(logSymbols.error, chalk.red('Error processing the theme-styles.json file'), error);
    }
    fancyLog(logSymbols.success, chalk.green('Done copying theme config files from source folder to build folder'));
};
