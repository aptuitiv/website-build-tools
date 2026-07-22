/* ===========================================================================
    Cursor AI rules actions
=========================================================================== */

import fs from 'fs-extra';
import chalk from 'chalk';
import fancyLog from 'fancy-log';
import logSymbols from 'log-symbols';
import { dirname } from 'path';
import { fileURLToPath } from 'url';

// Build files
import { prefixRootPath } from './helpers.js';

// Get the directory name of the current module
const __dirname = dirname(fileURLToPath(import.meta.url));

/**
 * Copy cursor rules from the ai-source-files to the project's .cursor folder
 *
 * Cursor rules sources:
 * - https://github.com/ivangrynenko/cursorrules
 */
export const copyCursorRules = async () => {
    fancyLog(chalk.magenta('Copying cursor rules to'), chalk.cyan('.cursor'));
    const destPath = prefixRootPath('.cursor');
    // Ensure the destination directory exists
    fs.ensureDirSync(destPath);

    // Copy the cursor rules to the destination directory
    fs.copySync(`${__dirname}/ai-source-files/cursor`, destPath);

    fancyLog(
        logSymbols.success,
        chalk.green('Successfully copied cursor rules to'),
        chalk.cyan(destPath),
    );
};

/**
 * Process the ai tool request
 *
 * @param {object} args The command line arguments
 * @param {string} action The action to take
 */
export const aiHandler = async (args, action) => {
    if (action === 'cursor') {
        await copyCursorRules(args);
    }
};

export default aiHandler;
