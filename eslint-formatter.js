/**
 * Custom ESLint formatter used by the "watch" script.
 * It uses the default "stylish" formatter, but outputs a success message
 * when there are no problems so that it's clear that the latest run passed.
 */

import { ESLint } from 'eslint';
import chalk from 'chalk';
import logSymbols from 'log-symbols';

/**
 * Format the ESLint results
 *
 * @param {object[]} results The lint results
 * @param {object} context The formatter context
 * @returns {Promise<string>} The formatted output
 */
export default async function format(results, context) {
    const stylish = await new ESLint().loadFormatter('stylish');
    const output = await stylish.format(results, context);
    if (output) {
        return output;
    }
    const time = new Date().toLocaleTimeString();
    return results.length > 0
        ? `${logSymbols.success} ${chalk.green('No lint problems')} (${results.length} file(s)) — ${time}`
        : '';
}
