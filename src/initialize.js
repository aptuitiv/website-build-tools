/* ===========================================================================
    Helper functions to initialize the environment
=========================================================================== */

import chalk from 'chalk';
import fancyLog from 'fancy-log';
import fs from 'fs-extra';
import logSymbols from 'log-symbols';
import { parse } from 'path';
import * as readline from 'node:readline/promises';

// Build scripts
import { setupRoot } from './helpers.js';

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
 * Create the YAML config file
 *
 * @param {string} configFile The configuration file name
 */
const createYamlConfigFile = (configFile) => {
    const contents = `# Configuration for the aptuitiv-build package.
# See https://github.com/aptuitiv/website-build-tools/blob/main/docs/Configuration.md for more information.
copy: null
javascript:
  bundles: null
  files: null`;
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
    if (ext === '.json' || configFile === '.aptuitiv-buildrc') {
        createJsonConfigFile(configFile);
    } else if (ext === '.cjs') {
        createCommonJsConfigFile(configFile);
    } else if (['.yaml', '.yml'].includes(ext)) {
        createYamlConfigFile(configFile);
    } else {
        createEsModuleConfigFile(configFile);
    }
};

/**
 * Create the .env file
 */
const createEnvFile = async () => {
    fancyLog(chalk.magenta('Creating the .env file'));
    fancyLog(chalk.blue('Setting up the FTP credentials. You can get the username and password from the Settings -> Domain / FTP / DNS  section in the website administration.'));
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout,
    });
    const name = await rl.question('What is the name of this website? ');
    const username = await rl.question('What is the FTP username? ');
    const password = await rl.question('What is the FTP password? ');
    rl.close();
    const contents = `# ${name} FTP
FTP_ENVIRONMENT = live
FTP_SERVER = ftp1.branchcms.com
FTP_USERNAME = ${username}
FTP_PASSWORD = ${password} `;
    fs.writeFileSync('.env', contents);
    fancyLog(logSymbols.success, chalk.green('Environment file created'), chalk.cyan('.env'));
};

/**
 * Initialize the environment
 *
 * @param {object} args The command line arguments
 */
export const initialize = async (args) => {
    const configFile = args.config || '.aptuitiv-buildrc.js';
    const files = checkForFiles(configFile);
    if (files.env && files.config) {
        fancyLog(logSymbols.success, chalk.green('The environment is already set up. Go forth and build!'));
    } else {
        if (!files.env) {
            await createEnvFile();
        }
        if (!files.config) {
            createConfigFile(configFile);
        }
        fancyLog(logSymbols.success, chalk.green('All set! Ready for you to build.'));
    }
};

/**
 * Process the initialize request
 *
 * @param {object} args The command line arguments
 */
export const initiaizeHandler = async (args) => {
    setupRoot(args.root);
    await initialize(args);
};
