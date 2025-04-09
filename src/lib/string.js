/* ===========================================================================
    Utility string functions
=========================================================================== */


/**
 * Convert a kebab-case string to a capitalized string with spaces
 *
 * @param {string} str The kebab-case string to convert
 * @returns {string} The formatted string with spaces and capitalized words
 */
export const kebabToCapitalized = (str) => str
    .split('-')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');


/**
 * Trims the string for any whitespace and removes the "characters" value from the start of the string
 *
 * @param {string} value The string value to update
 * @param {string} characters One or more characters to remove from the beginning of the string
 * @returns {string}
 */
export const lTrim = (value, characters) => {
    let returnValue = value.trim();
    if (returnValue.startsWith(characters)) {
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
    let returnValue = value.trim();
    if (returnValue.endsWith(characters)) {
        returnValue = returnValue.substring(0, returnValue.length - characters.length);
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
    let returnValue = value.trim();
    if (typeof characters === 'string') {
        if (returnValue.startsWith(characters)) {
            returnValue = returnValue.substring(characters.length);
        }
        if (returnValue.endsWith(characters)) {
            returnValue = returnValue.substring(0, returnValue.length - characters.length);
        }
    }
    return returnValue;
};