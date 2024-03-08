/* ===========================================================================
    Helper functions to initialize the environment
=========================================================================== */

import chalk from 'chalk';
import fancyLog from 'fancy-log';
import fs from 'fs-extra';
import logSymbols from 'log-symbols';
import { isAbsolute, parse, resolve } from 'path';

// // Build scripts
import { isStringWithValue } from './lib/types.js';

/**
 * Set up the root directory and change the working directory if necessary
 *
 * By default the working directory will be the directory where the command was run.
 * If the --root option is passed in then the root directory will be set to the specified directory.
 *
 * @param {object} args The command line arguments
 */
const setupRoot = (args) => {
    if (isStringWithValue(args.root)) {
        let cwd = process.cwd();
        let { root } = args;
        if (!isAbsolute(root)) {
            root = resolve(cwd, root);
        }
        cwd = root;
    }
};

/**
 * Checks to see if the .env and configuration files exist
 *
 * @param {string} configFile The configuration file to check for
 * @returns {object} An object containing the status of the files
 */
const checkForFiles = (configFile) => {
    const returnValue = {
        env: false,
        config: false,
    };
    if (fs.existsSync('.env')) {
        returnValue.env = true;
        fancyLog(logSymbols.success, chalk.green('Found the .env file'));
    }
    if (fs.existsSync(configFile)) {
        returnValue.config = true;
        fancyLog(logSymbols.success, chalk.green('Found the configuration file'), chalk.cyan(configFile));
    }
    return returnValue;
};

/**
 * Create the JSON config file
 *
 * @param {string} configFile The configuration file name
 */
const createJsonConfigFile = (configFile) => {
    const contents = `{
    "copy": [],
    "javascript": {
        "bundles": [],
        "files": []
    }
}`;
    fs.writeFileSync(configFile, contents);
    fancyLog(logSymbols.success, chalk.green('Config file created'), chalk.cyan(configFile));
};

/**
 * Create the CommonJS config file
 *
 * @param {string} configFile The configuration file name
 */
const createCommonJsConfigFile = (configFile) => {
    const contents = `/**
 * Configuration for the aptuitiv-build package.
 * See https://github.com/aptuitiv/website-build-tools/blob/main/docs/Configuration.md for more information.
 */
module.exports = {
    copy: [],
    javascript: {
        bundles: [],
        files: [],
    }
};`;
    fs.writeFileSync(configFile, contents);
    fancyLog(logSymbols.success, chalk.green('Config file created'), chalk.cyan(configFile));
};

/**
 * Create the ES Module config file
 *
 * @param {string} configFile The configuration file name
 */
const createEsModuleConfigFile = (configFile) => {
    const contents = `/**
 * Configuration for the aptuitiv-build package.
 * See https://github.com/aptuitiv/website-build-tools/blob/main/docs/Configuration.md for more information.
 */
export default {
    copy: [],
    javascript: {
        bundles: [],
        files: [],
    }
};`;
    fs.writeFileSync(configFile, contents);
    fancyLog(logSymbols.success, chalk.green('Config file created'), chalk.cyan(configFile));
};

/**
 * Create the config file
 *
 * @param {string} configFile The config file name
 */
const createConfigFile = (configFile) => {
    const { ext } = parse(configFile);
    if (ext === '.json') {
        createJsonConfigFile(configFile);
    } else if (ext === '.cjs') {
        createCommonJsConfigFile(configFile);
    } else {
        createEsModuleConfigFile(configFile);
    }
};

/**
 * Process the initialize request
 *
 * @param {object} args The command line arguments
 */
const initiaizeHandler = async (args) => {
    setupRoot(args);
    const configFile = args.config || '.aptuitiv-buildrc.js';
    const files = checkForFiles(configFile);
    if (files.env && files.config) {
        fancyLog(logSymbols.success, chalk.green('The environment is already set up. Nothing to do here.'));
    } else {
        if (!files.env) {
            fancyLog(logSymbols.info, chalk.magenta('Creating the .env file.'));
        }
        if (!files.config) {
            createConfigFile(configFile);
        }
    }
};

export default initiaizeHandler;
