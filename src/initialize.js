/* ===========================================================================
    Helper functions to initialize the environment
=========================================================================== */

import chalk from 'chalk';
import { execa } from 'execa';
import fancyLog from 'fancy-log';
import fs from 'fs-extra';
import logSymbols from 'log-symbols';
import { dirname, parse } from 'path';
import yaml from 'json-to-pretty-yaml';
import { input, select } from '@inquirer/prompts';
import { fileURLToPath } from 'url';
import zl from 'zip-lib';

// Build scripts
import { createEnvFile } from './env.js';
import { getObjectKeysRecursive, setupRoot, sortObjectByKeys } from './helpers.js';
import { logConditionalMessage, logConditionalSuccess, logConditionalWarning, logMessage, logWarning } from './lib/log.js';
import { kebabToCapitalized } from './lib/string.js';
import { isObject, isObjectWithValues, isStringWithValue } from './lib/types.js';
import { addDependency, formatPackageJson, setupLicense } from './package-json.js';
import { hasFilesByExtension } from './lib/files.js';

// Get the directory name of the current module
const __dirname = dirname(fileURLToPath(import.meta.url));

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
    if (!fs.existsSync('.gitignore')) {
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
    }
};

/**
 * Checks to see if the .env file exists and creates it if it doesn't
 *
 * @param {string} [name] The project name
 * @param {boolean} [outputLog] Whether to output the log
 */
const setupEnvFile = async (name, outputLog = true) => {
    if (fs.existsSync('.env')) {
        logConditionalSuccess(outputLog, 'Found the .env file');
    } else {
        await createEnvFile(name);
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
        logConditionalSuccess(outputLog, 'Found the configuration file', configFile);
    } else {
        createConfigFile(configFile);
    }
}

/**
 * Set up the package.json file
 *
 * @param {object} args The command line arguments
 * @param {string} [name] The project name to be used for the package name
 * @param {boolean} [outputLog] Whether to output the log
 */
const setupPackageJson = async (args, name, outputLog = true) => {
    if (fs.existsSync('package.json')) {
        await formatPackageJson(args);
        logConditionalSuccess(outputLog, 'Found and formatted the package.json file');
    } else {
        // Get answers to build the package.json file
        logConditionalMessage(outputLog, 'Creating the package.json file');
        const packageArgs = isObject(args) ? args : {};
        if (isStringWithValue(name)) {
            packageArgs.packageName = name;
        } else {
            packageArgs.packageName = await input({ message: 'What is the project name?', default: process.cwd().split('/').pop().toLowerCase() });
        }
        packageArgs.packageAuthor = await input({ message: 'Who is the package author name?', default: 'Aptuitiv, Inc' });
        packageArgs.packageAuthorEmail = await input({ message: 'What is the package author email?', default: 'hello@aptuitiv.com' });
        packageArgs.packageCopyright = packageArgs.packageAuthor;

        // Create the blank package.json file
        fs.writeFileSync('package.json', `{}`);

        // Format the file and fill in the content
        await formatPackageJson(packageArgs);
        logConditionalSuccess(outputLog, 'package.json file created');
    }
}

/**
 * Remove legacy files
 *
 * @param {boolean} [outputLog] Whether to output the log
 */
const removeFiles = (outputLog = true) => {
    const files = [
        '.eslintignore',
        '.eslintrc.js',
        '.eslintrc.cjs',
        '.stylelintrc',
        '.stylelintrc.cjs'
    ];
    let removed = 0;
    files.forEach((file) => {
        if (fs.existsSync(file)) {
            fs.removeSync(file);
            removed += 1;
            logConditionalSuccess(outputLog, 'Removed legacy file', file);
        }
    });
    if (removed === 0) {
        logConditionalWarning(outputLog, 'No legacy files to remove');
    }
};

/**
 * Set up a new website with basic project files
 *
 * @param {boolean} [outputLog] Whether to output the log
 */
const setupBasicWebsite = async (outputLog) => {
    fs.ensureDirSync('src/config');
    fs.ensureDirSync('src/css');
    fs.ensureDirSync('src/fonts');
    fs.ensureDirSync('src/icons');
    fs.ensureDirSync('src/js');
    fs.ensureDirSync('src/templates');

    // Aptuitiv build configuration
    fs.copyFileSync(`${__dirname}/source-files/.aptuitiv-buildrc.js`, '.aptuitiv-buildrc.js');

    // Theme config files
    if (!hasFilesByExtension('src/config', 'json')) {
        fs.copySync(`${__dirname}/source-files/config`, 'src/config');
    }

    // CSS files
    const cssFiles = fs.readdirSync('src/css');
    if (cssFiles.length === 0) {
        const { stdout: cacaoVersion } = await execa`npm view cacao-css version`;
        addDependency('cacao-css', cacaoVersion);
        fs.copySync(`${__dirname}/source-files/css`, 'src/css');
    }

    // Font files
    if (!fs.existsSync('src/fonts/README.md')) {
        fs.copyFileSync(`${__dirname}/source-files/fonts/README.md`, 'src/fonts/README.md');
    }

    // Icon files
    if (!hasFilesByExtension('src/icons', 'svg')) {
        fs.copySync(`${__dirname}/source-files/icons`, 'src/icons');
    }

    // JS files
    const jsFiles = fs.readdirSync('src/js');
    if (jsFiles.length === 0) {
        fs.copySync(`${__dirname}/source-files/js`, 'src/js');
    }

    // Template files
    if (!hasFilesByExtension('src/templates', 'twig')) {
        fs.copySync(`${__dirname}/source-files/templates`, `src/templates`);
    }

    logConditionalSuccess(outputLog, 'Basic website set up.');
}

/**
 * Download an Aptuitiv theme from Github
 *
 * @param {object} args The command line arguments along with other arguments for the package.json file.
 * @param {string} theme The name of the theme to download
 * @param {boolean} [outputLog] Whether to output the log
 * @returns {Promise<void>}
 */
const downloadTheme = async (args, theme, outputLog = true) => new Promise((resolve, reject) => {
    (async () => {
        logConditionalMessage(outputLog, 'Downloading the theme', theme);
        await execa`curl -L -O https://github.com/aptuitiv/${theme}/archive/main.zip`;
        zl.extract('./main.zip', './').then(() => {
            fs.removeSync('./main.zip');
            // The theme is downloaded to "theme-name-main" folder. Need to move all contents of
            // that folder to the current directory.
            fs.copySync(`./${theme}-main`, './');
            fs.removeSync(`./${theme}-main`);
            // Format the package json file
            formatPackageJson(args).then(() => {
                logConditionalSuccess(outputLog, 'Theme downloaded and extracted');
                resolve();
            });
        }, (err) => {
            logWarning('Error extracting the theme zip file', err);
            reject(err);
        })
    })();
})

/**
 * Install NPM packages
 */
const installNpm = async () => {
    logMessage('Installing NPM packages');
    await execa`npm install`;
};

/**
 * Initialize the environment
 *
 * @param {object} args The command line arguments
 * @param {boolean} [outputLog] Whether to output the log
 */
export const initialize = async (args, outputLog = true) => {
    // If the .env or the package.json file is missing get the project name.
    // We do it here so that we don't potentially ask for the project name twice.
    let name = null;
    if (args.name) {
        name = args.name;
    }
    if (name === null && (!fs.existsSync('.env') || !fs.existsSync('package.json'))) {
        name = await input({ message: 'What is the project name?', default: kebabToCapitalized(process.cwd().split('/').pop()) });
    }

    let projectType = args.type ?? null;
    const allowedTypes = [
        'existing',
        'basic',
        'theme-arlo',
        'theme-carmine',
        'theme-caro',
        'theme-harvest',
        'theme-mallard',
        'theme-rivera',
        'theme-skeleton'
    ];
    if (projectType === null || !allowedTypes.includes(projectType)) {
        projectType = await select({
            message: 'What type of project is this?',
            choices: [
                { name: 'Existing website with project files', value: 'existing' },
                { name: 'New basic website', value: 'basic' },
                // { name: 'Arlo theme', value: 'theme-arlo' },
                { name: 'Carmine theme', value: 'theme-carmine' },
                // { name: 'Caro theme', value: 'theme-caro' },
                { name: 'Harvest theme', value: 'theme-harvest' },
                { name: 'Mallard theme', value: 'theme-mallard' },
                { name: 'Rivera theme', value: 'theme-rivera' },
                { name: 'Skeleton theme', value: 'theme-skeleton' },
            ],
        });
    }
    projectType = projectType.toLowerCase();

    if (projectType.substring(0, 6) === 'theme-') {
        const themeArgs = isObject(args) ? args : {};
        if (name) {
            themeArgs.packageName = name;
        }
        await downloadTheme(themeArgs, projectType, outputLog);
    } else {
        // Not a theme site. Could be an existing site or a new website
        setupLicense(args);
        await setupPackageJson(args, name, outputLog);
        setupGitIgnore();
        await setupEnvFile(name, outputLog);
        setupConfigFile(args.config || '.aptuitiv-buildrc.js', outputLog);
        removeFiles(outputLog);
        if (projectType === 'basic') {
            await setupBasicWebsite(outputLog);
        }
    }
    await installNpm();
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
    let returnValue = false;
    try {
        setupRoot(args.root);
        await initialize(args);
        returnValue = true;
    } catch (error) {
        if (error instanceof Error && error.name === 'ExitPromptError') {
            // This is an "error" likely from pressing CTRL+C
            // We want to exit gracefully
            // https://www.npmjs.com/package/@inquirer/prompts#handling-ctrlc-gracefully
            fancyLog(chalk.red('Exiting...'));
        } else {
            throw error;
        }
    }
    return returnValue;
};
