/* ===========================================================================
    Utility string functions
=========================================================================== */

import { isString } from './types.js';

/**
 * Convert a kebab-case string to a capitalized string with spaces
 *
 * @param {string} str The kebab-case string to convert
 * @returns {string} The formatted string with spaces and capitalized words
 */
export const kebabToCapitalized = (str) => {
    if (!isString(str)) {
        return '';
    }
    return str
        .split('-')
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
};

/**
 * Trims the string for any whitespace and removes the "characters" value from the start of the string
 *
 * @param {string} value The string value to update
 * @param {string} characters One or more characters to remove from the beginning of the string
 * @returns {string}
 */
export const lTrim = (value, characters) => {
    if (!isString(value)) {
        return '';
    }
    let returnValue = value.trim();
    if (isString(characters) && returnValue.startsWith(characters)) {
        returnValue = returnValue.substring(characters.length);
    }
    return returnValue;
};

/**
 * Trims the string for any whitespace and removes the "characters" value from the end of the string
 *
 * @param {string} value The string value to update
 * @param {string} characters One or more characters to remove from the end of the string
 * @returns {string}
 */
export const rTrim = (value, characters) => {
    if (!isString(value)) {
        return '';
    }
    let returnValue = value.trim();
    if (isString(characters) && returnValue.endsWith(characters)) {
        returnValue = returnValue.substring(
            0,
            returnValue.length - characters.length,
        );
    }
    return returnValue;
};

/**
 * Trims the string for any whitespace and removes the "characters" value from the end of the string
 *
 * @param {string} value The string value to update
 * @param {string} [characters] One or more characters to remove from the beginning end of the string
 * @returns {string}
 */
export const trim = (value, characters) => {
    if (!isString(value)) {
        return '';
    }
    let returnValue = value.trim();
    if (isString(characters)) {
        if (returnValue.startsWith(characters)) {
            returnValue = returnValue.substring(characters.length);
        }
        if (returnValue.endsWith(characters)) {
            returnValue = returnValue.substring(
                0,
                returnValue.length - characters.length,
            );
        }
    }
    return returnValue;
};
