/* ===========================================================================
Utility functions for determining a variable's type and if it can be used
=========================================================================== */

/**
 * Returns if the value is an object
 *
 * https://attacomsian.com/blog/javascript-check-variable-is-object
 *
 * @param {any} thing The value to test
 * @returns {boolean}
 */
export const isObjectWithValues = (thing) => Object.prototype.toString.call(thing) === '[object Object]'
    && Object.keys(thing).length > 0;

/**
 * Returns if the value is a string
 *
 * @param {any} thing The value to test
 * @returns {boolean}
 */
export const isString = (thing) => typeof thing === 'string';

/**
 * Returns if the value is string and has a length greater than 0
 *
 * @param {any} thing The value to test
 * @returns {boolean}
 */
export const isStringWithValue = (thing) => isString(thing) && thing.trim().length > 0;
