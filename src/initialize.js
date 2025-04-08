/* ===========================================================================
    Helper functions to initialize the environment
=========================================================================== */

import chalk from 'chalk';
import * as childProcess from 'child_process';
import fancyLog from 'fancy-log';
import fs from 'fs-extra';
import logSymbols from 'log-symbols';
import { parse } from 'path';
import yaml from 'json-to-pretty-yaml';

import { createEnvFile } from './env.js';

// Build scripts
import { getObjectKeysRecursive, setupRoot, sortObjectByKeys } from './helpers.js';
import { isObjectWithValues } from './lib/types.js';

/**
 * Convert the JSON content to a Javascript string
 *
 * @param {string} content The JSON content
 * @returns {string}
 */
const convertJsonToJs = (content) => {
    let js = JSON.stringify(content, null, 4);
    // Replace object keys wrapped in quotes to not be in quotes
    const keys = getObjectKeysRecursive(content);
    keys.forEach((key) => {
        js = js.replaceAll(`"${key}":`, `${key}:`);
    });
    // Replace double quotes with single quotes
    js = js.replaceAll('"', "'");
    return js;
};

/**
 * Create the JSON config file
 *
 * @param {string} configFile The configuration file name
 * @param {object} content A JSON object containing different content to write into the file
 */
const createJsonConfigFile = (configFile, content) => {
    const contents = `${JSON.stringify(content, null, 4)}`;
    fs.writeFileSync(configFile, contents);
    fancyLog(logSymbols.success, chalk.green('Config file created'), chalk.cyan(configFile));
};

/**
 * Create the CommonJS config file
 *
 * @param {string} configFile The configuration file name
 * @param {object} content A JSON object containing different content to write into the file
 */
const createCommonJsConfigFile = (configFile, content) => {
    const contents = `/**
 * Configuration for the aptuitiv-build package.
 * See https://github.com/aptuitiv/website-build-tools/blob/main/docs/Configuration.md for more information.
 */
module.exports = ${convertJsonToJs(content)};`;
    fs.writeFileSync(configFile, contents);
    fancyLog(logSymbols.success, chalk.green('Config file created'), chalk.cyan(configFile));
};

/**
 * Create the ES Module config file
 *
 * @param {string} configFile The configuration file name
 * @param {object} content A JSON object containing different content to write into the file
 */
const createEsModuleConfigFile = (configFile, content) => {
    const contents = `/**
 * Configuration for the aptuitiv-build package.
 * See https://github.com/aptuitiv/website-build-tools/blob/main/docs/Configuration.md for more information.
 */
export default ${convertJsonToJs(content)};`;
    fs.writeFileSync(configFile, contents);
    fancyLog(logSymbols.success, chalk.green('Config file created'), chalk.cyan(configFile));
};

/**
 * Create the YAML config file
 *
 * @param {string} configFile The configuration file name
 * @param {object} content A JSON object containing different content to write into the file
 */
const createYamlConfigFile = (configFile, content) => {
    const yamlContent = yaml.stringify(content);
    const contents = `# Configuration for the aptuitiv-build package.
# See https://github.com/aptuitiv/website-build-tools/blob/main/docs/Configuration.md for more information.
${yamlContent}`;
    fs.writeFileSync(configFile, contents);
    fancyLog(logSymbols.success, chalk.green('Config file created'), chalk.cyan(configFile));
};

/**
 * Create the config file
 *
 * @param {string} configFile The config file name
 * @param {object} content An object containing different content to write into the file
 */
export const createConfigFile = (configFile, content) => {
    const configContent = {
        copy: [],
        javascript: {
            bundles: [],
            files: [],
        },
    };
    if (isObjectWithValues(content)) {
        Object.keys(content).forEach((key) => {
            if (key === 'copy') {
                configContent.copy = content.copy;
            } else if (key === 'css') {
                configContent.css = content.css;
            } else if (key === 'javascript') {
                if (content.javascript.bundles) {
                    configContent.javascript.bundles = content.javascript.bundles;
                }
                if (content.javascript.files) {
                    configContent.javascript.files = content.javascript.files;
                }
            }
        });
    }
    // Sort the configContent object by keys
    const sortedConfigContent = sortObjectByKeys(configContent);

    const { ext } = parse(configFile);
    if (ext === '.json' || configFile === '.aptuitiv-buildrc') {
        createJsonConfigFile(configFile, sortedConfigContent);
    } else if (ext === '.cjs') {
        createCommonJsConfigFile(configFile, sortedConfigContent);
    } else if (['.yaml', '.yml'].includes(ext)) {
        createYamlConfigFile(configFile, sortedConfigContent);
    } else {
        createEsModuleConfigFile(configFile, sortedConfigContent);
    }
};

/**
 * Set up the .gitignore file
 *
 * Make sure that it has all of the necessary patterns
 */
const setupGitIgnore = () => {
    const content = `# This includes files that will be ignored by git
# We want to include the package-lock.json file in git so that everyone is working with the same package files.
# The package-lock.json should not be included in this file.
# Web projects are not dependencies in other projects so this is ok. Reference for that decision:
# https://classic.yarnpkg.com/blog/2016/11/24/lockfiles-for-all/
# https://dev.to/gajus/stop-using-package-lock-json-or-yarn-lock-3ddi
# https://dev.to/saurabhdaware/but-what-the-hell-is-package-lock-json-b04

# Folders to ignore
.idea/
.vscode/
_build/
_export/
dist/
node_modules/

# Files to ignore
.DS_Store
.env
.stylelintcache`;
    fs.writeFileSync('.gitignore', content);
    fancyLog(logSymbols.success, chalk.green('Updated .gitignore file'));
};

/**
 * Checks to see if the .env file exists and creates it if it doesn't
 *
 * @param {boolean} [outputLog] Whether to output the log
 */
const setupEnvFile = async (outputLog = true) => {
    if (fs.existsSync('.env')) {
        if (outputLog) {
            fancyLog(logSymbols.success, chalk.green('Found the .env file'));
        }
    } else {
        await createEnvFile();
    }
}

/**
 * Checks to see if the .env file exists and creates it if it doesn't
 *
 * @param {string} configFile The configuration file to check for
 * @param {boolean} [outputLog] Whether to output the log
 */
const setupConfigFile = (configFile, outputLog = true) => {
    if (fs.existsSync(configFile)) {
        if (outputLog) {
            fancyLog(logSymbols.success, chalk.green('Found the configuration file'), chalk.cyan(configFile));
        }
    } else {
        createConfigFile(configFile);
    }
}

/**
 * Install NPM packages
 */
const installNpm = () => {
    fancyLog(chalk.magenta('Installing packages...'));
    childProcess.execSync('npm install', { stdio: 'inherit' });
};

/**
 * Initialize the environment
 *
 * @param {object} args The command line arguments
 * @param {boolean} [outputLog] Whether to output the log
 */
export const initialize = async (args, outputLog = true) => {
    setupGitIgnore();
    await setupEnvFile(outputLog);
    setupConfigFile(args.config || '.aptuitiv-buildrc.js', outputLog);
    installNpm();
    if (outputLog) {
        fancyLog(logSymbols.success, chalk.green('The build environment is set up now.'));
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
