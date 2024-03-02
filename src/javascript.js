/* ===========================================================================
    Javascript file processing
=========================================================================== */

import fs from 'fs-extra';
import chalk from 'chalk';
import { ESLint } from 'eslint';
import { globSync } from 'glob';
import fancyLog from 'fancy-log';
import logSymbols from 'log-symbols';
import { dirname } from 'path';
import { fileURLToPath } from 'url';


// Get the directory name of the current module
const __dirname = dirname(fileURLToPath(import.meta.url));

// Build scripts
import config from './config.js';
import { getGlob, isObjectWithValues, prefixPath, prefixRootPath, prefixRootSrcPath, prefixSrcPath, removeRootPrefix } from './helpers.js';

/**
 * Get the correct source path within the Javascript base directory
 *
 * @param {string} filePath The source path
 * @returns {string}
 */
const getSrcPath = (filePath) => {
    const sourcePath = prefixSrcPath(config.data.javascript.src);
    const basePath = prefixRootPath(sourcePath);
    return prefixPath(filePath, basePath, sourcePath);
}

/**
 * Run eslint on the javascript files
 *
 * @param {string} [fileGlob] The file glob to lint
 */
const lint = async (fileGlob) => {
    // Get the glob of files to lint
    const filesToLint = fileGlob || prefixRootSrcPath(`${config.data.javascript.src}/**/*.js`);

    fancyLog(chalk.magenta('Linting Javascript'), chalk.cyan(removeRootPrefix(filesToLint)));

    // Set up the eslint options. This is different from the linting configuration in "baseConfig".
    // This is the configuration for the eslint API.
    // See options at https://eslint.org/docs/latest/integrate/nodejs-api#-new-eslintoptions
    let options = {
        cwd: config.data.root,
        // Default configuratoin for eslint.
        // https://eslint.org/docs/latest/use/configure/
        baseConfig: {
            extends: ['@aptuitiv/eslint-config-aptuitiv']
        },
        fix: true,
        overrideConfig: null,
    }
    // Get the override configuration from the configuration file in the website project.
    if (isObjectWithValues(config.data.eslint)) {
        options.overrideConfig = config.data.eslint;
    }

    // Create an instance of ESLint with the configuration passed to the function
    const eslint = new ESLint(options);

    let results = await eslint.lintFiles(filesToLint);

    // Apply automatic fixes and output fixed code
    await ESLint.outputFixes(results);

    // Format the results to remove the root directory from the file paths.
    results = results.map((result) => {
        result.filePath = removeRootPrefix(result.filePath);
        return result;
    });

    // Format and output the results
    eslint.loadFormatter('stylish').then((formatter) => {
        console.log(formatter.format(results));
    });

    fancyLog(logSymbols.success, chalk.green('Javascript linting finished'));
}


/**
 * Process a single Javascript file
 *
 * @param {string} filePath The path to the Javascript file
 */
const processJsFile = (filePath) => {
    console.log('PROCESS JS FILE ', filePath);
}

/**
 * Process all the Javascript files
 *
 * @param {boolean} lint Whether to lint the Javascript files
 */
const processAllJs = (lint = true) => {
    console.log('PROCEWS ALL JS');
}

/**
 * Process the Javascript request
 *
 * @param {string} action The action to take
 * @param {object} args The command line arguments
 */
export const jsHandler = (action, args) => {
    if (action === 'process') {
        if (typeof args.file === 'string') {
            if (args.lint) {
                lint();
            }
            const filePath = getSrcPath(args.file);
            processJsFile(filePath);
        } else {
            processAllJs(args.lint);
        }
    } else if (action === 'lint') {
        if (typeof args.path === 'string') {
            const lintPath = getGlob(getSrcPath(args.path));
            lint(lintPath);
        } else {
            lint();
        }
    }
}
