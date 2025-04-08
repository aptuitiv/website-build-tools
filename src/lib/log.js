/* ===========================================================================
    Console log helper functions
=========================================================================== */

import chalk from 'chalk';
import fancyLog from 'fancy-log';
import logSymbols from 'log-symbols';


/**
 * Log a success message
 * 
 * @param {string} message The message to output
 * @param {string} [additionalMessage] An additional message to output in cyan
 */
export const logSuccess = (message, additionalMessage) => {
    if (additionalMessage) {
        fancyLog(logSymbols.success, chalk.green(message), chalk.cyan(additionalMessage));
    } else {
        fancyLog(logSymbols.success, chalk.green(message));
    }
}

/**
 * Conditionally log a success message
 * 
 * @param {boolean} [outputLog] Whether to output the log
 * @param {string} message The message to output
 * @param {string} [additionalMessage] An additional message to output in cyan
 */
export const logConditionalSuccess = (outputLog, message, additionalMessage) => {
    if (outputLog) {
        logSuccess(message, additionalMessage);
    }
}

/**
 * Log a message
 * 
 * @param {string} message The message to output
 */
export const logMessage = (message) => {
    fancyLog(chalk.cyan(message));
}

/**
 * Conditionally log a message
 * 
 * @param {boolean} [outputLog] Whether to output the log
 * @param {string} message The message to output
 */
export const logConditionalMessage = (outputLog, message) => {
    if (outputLog) {
        logMessage(message);
    }
}

/**
 * Log a warning message
 * 
 * @param {string} message The message to output
 */
export const logWarning = (message) => {
    fancyLog(logSymbols.success, chalk.green(message));
}

/**
 * Conditionally log a warning message
 * 
 * @param {boolean} [outputLog] Whether to output the log
 * @param {string} message The message to output
 */
export const logConditionalWarning = (outputLog, message) => {
    if (outputLog) {
        logWarning(message);
    }
}
