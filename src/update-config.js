/* ===========================================================================
    Update the project configuration files from this package
=========================================================================== */

import chalk from 'chalk';
import fancyLog from 'fancy-log';
import fs from 'fs-extra';

// Build scripts
import config from './config.js';
import { setupRoot } from './helpers.js';
import {
    installNpm,
    setupFormattingFiles,
    setupGitIgnore,
} from './initialize.js';
import { logSuccess, logWarning } from './lib/log.js';
import { isStringWithValue } from './lib/types.js';
import { formatPackageJson, setupLicense } from './package-json.js';

/**
 * Get the theme name from the theme build path in the configuration.
 *
 * For example, "dist/theme/carmine" returns "carmine".
 * This is used so that the theme scripts in the package.json file use the correct theme folder.
 *
 * @returns {string}
 */
const getThemeName = () => {
    const themePath = config.data?.build?.theme;
    if (isStringWithValue(themePath)) {
        const match = themePath.match(/theme\/([^/]+)\/?$/);
        if (match) {
            return match[1];
        }
    }
    return 'custom';
};

/**
 * Update the configuration files in the project.
 *
 * This updates the files in place, and adds them if they are missing:
 * - .editorconfig, .prettierignore, and .prettierrc.cjs
 * - package.json formatting and scripts
 * - .gitignore patterns
 * - LICENSE
 *
 * It does not build the site or upload any files.
 *
 * @param {object} args The command line arguments
 * @param {string} [args.license] The license for the project. Defaults to the license in the package.json file.
 * @param {string} [args.theme] The theme name. Defaults to the theme name in the theme build path.
 * @param {boolean} [args.install] Whether to run "npm install" at the end. Defaults to true.
 * @param {string} [args.root] The root folder of the project
 */
export const updateConfigHandler = async (args) => {
    setupRoot(args.root);
    fancyLog(chalk.magenta('Updating the configuration files'));

    // Formatting files. Update them in place and don't remove any other config files.
    setupFormattingFiles(true, true, false);

    // package.json
    if (fs.existsSync('package.json')) {
        const packageJson = fs.readJsonSync('package.json');
        const packageArgs = {
            ...args,
            // Keep the existing license unless a different one was passed
            license: args.license || packageJson.license,
            theme: args.theme || getThemeName(),
        };
        await formatPackageJson(packageArgs);
        if (setupLicense(packageArgs, true)) {
            logSuccess('Updated the LICENSE file');
        } else {
            logWarning(
                `The LICENSE file was not updated. Only the Apache-2.0 license file is provided and the project license is ${packageArgs.license}.`,
            );
        }
    } else {
        logWarning(
            'The package.json file does not exist. Run "aptuitiv-build init" to create it.',
        );
    }

    // .gitignore
    setupGitIgnore(true);

    if (args.install !== false) {
        await installNpm();
    }

    logSuccess('The configuration files are updated.');
};

export default updateConfigHandler;
