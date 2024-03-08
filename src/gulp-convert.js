/* ===========================================================================
    Convert the old Gulp build process to use the build tools
=========================================================================== */

import chalk from 'chalk';
import fancyLog from 'fancy-log';
import fs from 'fs-extra';
import logSymbols from 'log-symbols';

// Build scripts
import { setupRoot } from './helpers.js';
import { initialize } from './initialize.js';
import { formatPackageJson } from './package-json.js';

/**
 * Remove legacy files
 */
const removeFiles = () => {
    const files = [
        '.eslintignore',
        '.eslintrc.js',
        '.eslintrc.cjs',
        '.stylelintrc',
        'gulpfile.js',
    ];
    let removed = 0;
    files.forEach((file) => {
        if (fs.existsSync(file)) {
            fs.removeSync(file);
            removed += 1;
            fancyLog(logSymbols.success, chalk.green('Removed the file'), chalk.cyan(file));
        }
    });
    if (removed === 0) {
        fancyLog(logSymbols.info, chalk.yellow('No files to remove'));
    }
};

/**
 * Process the gulp convert request
 *
 * @param {object} args The command line arguments
 */
const gulpConvertHandler = async (args) => {
    fancyLog(chalk.magenta('Converting the Gulp build process to use the build tools'));
    setupRoot(args.root);
    // Remove the files that are not needed
    removeFiles();
    // Format the package.json file
    await formatPackageJson(args);
    // Initialize the environment
    initialize(args);
};

export default gulpConvertHandler;
