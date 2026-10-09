/* ===========================================================================
    Helper functions to initialize the environment
=========================================================================== */

import chalk from 'chalk';
import { execa } from 'execa';
import fancyLog from 'fancy-log';
import fs from 'fs-extra';
import logSymbols from 'log-symbols';
import { tmpdir } from 'os';
import { dirname, join, parse } from 'path';
import yaml from 'json-to-pretty-yaml';
import { confirm, input, select } from '@inquirer/prompts';
import { fileURLToPath } from 'url';
import zl from 'zip-lib';

// Build scripts
import { createEnvFile } from './env.js';
import {
    getObjectKeysRecursive,
    setupRoot,
    sortObjectByKeys,
} from './helpers.js';
import {
    logConditionalMessage,
    logConditionalSuccess,
    logConditionalWarning,
    logMessage,
} from './lib/log.js';
import { kebabToCapitalized } from './lib/string.js';
import {
    isObject,
    isObjectWithValues,
    isStringWithValue,
} from './lib/types.js';
import {
    addDependency,
    formatPackageJson,
    setupLicense,
} from './package-json.js';
import { hasFilesByExtension } from './lib/files.js';
import { writeFormattedFile, writeFormattedJson } from './lib/prettier.js';

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
 * @returns {Promise<void>}
 */
const createJsonConfigFile = async (configFile, content) => {
    // Set the parser because ".aptuitiv-buildrc" doesn't have a file extension
    await writeFormattedJson(configFile, content, { parser: 'json' });
    fancyLog(
        logSymbols.success,
        chalk.green('Config file created'),
        chalk.cyan(configFile),
    );
};

/**
 * Create the CommonJS config file
 *
 * @param {string} configFile The configuration file name
 * @param {object} content A JSON object containing different content to write into the file
 * @returns {Promise<void>}
 */
const createCommonJsConfigFile = async (configFile, content) => {
    const contents = `/**
 * Configuration for the aptuitiv-build package.
 * See https://github.com/aptuitiv/website-build-tools/blob/main/docs/Configuration.md for more information.
 */
module.exports = ${convertJsonToJs(content)};`;
    await writeFormattedFile(configFile, contents);
    fancyLog(
        logSymbols.success,
        chalk.green('Config file created'),
        chalk.cyan(configFile),
    );
};

/**
 * Create the ES Module config file
 *
 * @param {string} configFile The configuration file name
 * @param {object} content A JSON object containing different content to write into the file
 * @returns {Promise<void>}
 */
const createEsModuleConfigFile = async (configFile, content) => {
    const contents = `/**
 * Configuration for the aptuitiv-build package.
 * See https://github.com/aptuitiv/website-build-tools/blob/main/docs/Configuration.md for more information.
 */
export default ${convertJsonToJs(content)};`;
    await writeFormattedFile(configFile, contents);
    fancyLog(
        logSymbols.success,
        chalk.green('Config file created'),
        chalk.cyan(configFile),
    );
};

/**
 * Create the YAML config file
 *
 * @param {string} configFile The configuration file name
 * @param {object} content A JSON object containing different content to write into the file
 * @returns {Promise<void>}
 */
const createYamlConfigFile = async (configFile, content) => {
    const yamlContent = yaml.stringify(content);
    const contents = `# Configuration for the aptuitiv-build package.
# See https://github.com/aptuitiv/website-build-tools/blob/main/docs/Configuration.md for more information.
${yamlContent}`;
    await writeFormattedFile(configFile, contents);
    fancyLog(
        logSymbols.success,
        chalk.green('Config file created'),
        chalk.cyan(configFile),
    );
};

/**
 * Create the config file
 *
 * @param {string} configFile The config file name
 * @param {object} content An object containing different content to write into the file
 * @returns {Promise<void>}
 */
export const createConfigFile = async (configFile, content) => {
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
                    configContent.javascript.bundles =
                        content.javascript.bundles;
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
        await createJsonConfigFile(configFile, sortedConfigContent);
    } else if (ext === '.cjs') {
        await createCommonJsConfigFile(configFile, sortedConfigContent);
    } else if (['.yaml', '.yml'].includes(ext)) {
        await createYamlConfigFile(configFile, sortedConfigContent);
    } else {
        await createEsModuleConfigFile(configFile, sortedConfigContent);
    }
};

// The default .gitignore file content
const gitIgnoreContent = `# This includes files that will be ignored by git
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
.stylelintcache

# Claude Code local settings
.claude/*.local.json
claude.local.md
`;

/**
 * Set up the .gitignore file
 *
 * Creates the file if it doesn't exist. If "update" is true and the file exists then
 * any missing patterns are added to the end of the file. Existing patterns are not changed.
 *
 * @param {boolean} [update] Whether to add missing patterns to an existing .gitignore file
 * @param {boolean} [outputLog] Whether to output the log
 */
export const setupGitIgnore = (update = false, outputLog = true) => {
    if (!fs.existsSync('.gitignore')) {
        fs.writeFileSync('.gitignore', gitIgnoreContent);
        logConditionalSuccess(outputLog, 'Created the .gitignore file');
    } else if (update) {
        const currentContent = fs.readFileSync('.gitignore', 'utf8');
        const currentPatterns = currentContent
            .split('\n')
            .map((line) => line.trim());
        const missingPatterns = gitIgnoreContent
            .split('\n')
            .map((line) => line.trim())
            .filter(
                (line) =>
                    line.length > 0 &&
                    !line.startsWith('#') &&
                    !currentPatterns.includes(line),
            );
        if (missingPatterns.length > 0) {
            const separator = currentContent.endsWith('\n') ? '\n' : '\n\n';
            fs.writeFileSync(
                '.gitignore',
                `${currentContent}${separator}${missingPatterns.join('\n')}\n`,
            );
            logConditionalSuccess(
                outputLog,
                'Added patterns to the .gitignore file',
                missingPatterns.join(', '),
            );
        } else {
            logConditionalSuccess(
                outputLog,
                'The .gitignore file is up to date',
            );
        }
    }
};

/**
 * Copy the formatting configuration files (.editorconfig, .prettierignore, .prettierrc.cjs)
 * into the project.
 *
 * This gives all projects consistent formatting rules. By default, existing files are not overwritten.
 * If "force" is true then the existing files are overwritten.
 * If "removeOtherConfigs" is true then any other Prettier configuration files are removed so that
 * they don't conflict with the .prettierrc.cjs file. Otherwise a warning is shown if they exist.
 *
 * @param {boolean} [outputLog] Whether to output the log
 * @param {boolean} [force] Whether to overwrite the existing files
 * @param {boolean} [removeOtherConfigs] Whether to remove other Prettier configuration files. Defaults to the "force" value.
 */
export const setupFormattingFiles = (
    outputLog = true,
    force = false,
    removeOtherConfigs = force,
) => {
    const files = ['.editorconfig', '.prettierignore', '.prettierrc.cjs'];
    // Other Prettier config files. If one of these exists, and we're not forcing the update,
    // then we don't add .prettierrc.cjs.
    // https://prettier.io/docs/configuration
    const otherPrettierConfigFiles = [
        '.prettierrc',
        '.prettierrc.json',
        '.prettierrc.yml',
        '.prettierrc.yaml',
        '.prettierrc.json5',
        '.prettierrc.js',
        '.prettierrc.mjs',
        '.prettierrc.toml',
        '.prettierrc.ts',
        '.prettierrc.mts',
        '.prettierrc.cts',
        'prettier.config.js',
        'prettier.config.mjs',
        'prettier.config.cjs',
        'prettier.config.ts',
        'prettier.config.mts',
        'prettier.config.cts',
    ];

    // Handle the other Prettier config files. Prettier uses them before .prettierrc.cjs.
    otherPrettierConfigFiles.forEach((file) => {
        if (fs.existsSync(file)) {
            if (removeOtherConfigs) {
                fs.removeSync(file);
                logConditionalSuccess(
                    outputLog,
                    'Removed the Prettier configuration file',
                    file,
                );
            } else if (force) {
                logConditionalWarning(
                    outputLog,
                    `The ${file} file exists. Prettier will use it instead of .prettierrc.cjs. Remove it to use .prettierrc.cjs.`,
                );
            }
        }
    });

    files.forEach((file) => {
        const fileExists = fs.existsSync(file);
        let exists = fileExists;
        if (!exists && file === '.prettierrc.cjs') {
            exists = otherPrettierConfigFiles.some((configFile) =>
                fs.existsSync(configFile),
            );
        }
        if (exists && !force) {
            logConditionalSuccess(outputLog, 'Found the formatting file', file);
        } else {
            fs.copyFileSync(`${__dirname}/source-files/${file}`, file);
            logConditionalSuccess(
                outputLog,
                fileExists
                    ? 'Updated the formatting file'
                    : 'Created the formatting file',
                file,
            );
        }
    });

    // Prettier also reads configuration from the "prettier" key in package.json.
    // It takes precedence over .prettierrc.cjs so warn about it instead of changing package.json.
    if (fs.existsSync('package.json')) {
        const packageJson = fs.readJsonSync('package.json', { throws: false });
        if (isObject(packageJson) && packageJson.prettier !== undefined) {
            logConditionalWarning(
                outputLog,
                'The package.json file has a "prettier" key. Prettier will use it instead of .prettierrc.cjs. Remove it to use .prettierrc.cjs.',
            );
        }
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
};

/**
 * Checks to see if the configuration file exists and creates it if it doesn't
 *
 * @param {string} configFile The configuration file to check for
 * @param {boolean} [outputLog] Whether to output the log
 * @returns {Promise<void>}
 */
const setupConfigFile = async (configFile, outputLog = true) => {
    if (fs.existsSync(configFile)) {
        logConditionalSuccess(
            outputLog,
            'Found the configuration file',
            configFile,
        );
    } else {
        await createConfigFile(configFile);
    }
};

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
        logConditionalSuccess(
            outputLog,
            'Found and formatted the package.json file',
        );
    } else {
        // Get answers to build the package.json file
        logConditionalMessage(outputLog, 'Creating the package.json file');
        const packageArgs = isObject(args) ? args : {};
        if (isStringWithValue(name)) {
            packageArgs.packageName = name;
        } else {
            packageArgs.packageName = await input({
                message: 'What is the project name?',
                default: process.cwd().split('/').pop().toLowerCase(),
            });
        }
        packageArgs.packageAuthor = await input({
            message: 'Who is the package author name?',
            default: 'Aptuitiv, Inc',
        });
        packageArgs.packageAuthorEmail = await input({
            message: 'What is the package author email?',
            default: 'hello@aptuitiv.com',
        });
        packageArgs.packageCopyright = packageArgs.packageAuthor;

        // Create the blank package.json file
        fs.writeFileSync('package.json', `{}`);

        // Format the file and fill in the content
        await formatPackageJson(packageArgs);
        logConditionalSuccess(outputLog, 'package.json file created');
    }
};

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
        '.stylelintrc.cjs',
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
    fs.copyFileSync(
        `${__dirname}/source-files/.aptuitiv-buildrc.js`,
        '.aptuitiv-buildrc.js',
    );

    // Theme config files
    if (!hasFilesByExtension('src/config', 'json')) {
        fs.copySync(`${__dirname}/source-files/config`, 'src/config');
    }

    // CSS files
    const cssFiles = fs.readdirSync('src/css');
    if (cssFiles.length === 0) {
        const { stdout: cacaoVersion } =
            await execa`npm view cacao-css version`;
        await addDependency('cacao-css', cacaoVersion);
        fs.copySync(`${__dirname}/source-files/css`, 'src/css');
    }

    // Font files
    if (!fs.existsSync('src/fonts/README.md')) {
        fs.copyFileSync(
            `${__dirname}/source-files/fonts/README.md`,
            'src/fonts/README.md',
        );
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
};

/**
 * Download an Aptuitiv theme from Github
 *
 * @param {object} args The command line arguments along with other arguments for the package.json file.
 * @param {string} theme The name of the theme to download
 * @param {boolean} [outputLog] Whether to output the log
 * @returns {Promise<void>}
 */
const downloadTheme = async (args, theme, outputLog = true) => {
    logConditionalMessage(outputLog, 'Downloading the theme', theme);

    // Download and extract into a unique temp directory. This avoids leaving
    // artifacts (main.zip / <theme>-main) in the project directory and avoids
    // reusing stale artifacts from a previous failed run.
    // Resolve the real path because on macOS os.tmpdir() is a symlink
    // (/var/folders -> /private/var/folders). zip-lib compares each entry's
    // resolved real path against the target directory and would otherwise refuse
    // to write ("Refuse to write file outside ...") due to the symlink mismatch.
    const tmpDir = fs.realpathSync(
        fs.mkdtempSync(join(tmpdir(), 'aptuitiv-theme-')),
    );
    const zipPath = join(tmpDir, 'main.zip');
    const extractDir = join(tmpDir, 'extracted');

    try {
        await execa`curl -L -o ${zipPath} https://github.com/aptuitiv/${theme}/archive/main.zip`;
        fs.ensureDirSync(extractDir);
        await zl.extract(zipPath, extractDir);

        // The archive extracts to a "<theme>-main" folder. We copy its contents
        // into the current directory.
        const themeFolder = join(extractDir, `${theme}-main`);
        if (!fs.existsSync(themeFolder)) {
            throw new Error(
                `The extracted theme folder "${theme}-main" could not be found.`,
            );
        }

        // Guard against clobbering existing project files. Prompt before
        // overwriting anything that already exists in the current directory.
        const conflicts = fs
            .readdirSync(themeFolder)
            .filter((entry) => fs.existsSync(entry));
        let overwrite = true;
        if (conflicts.length > 0) {
            logConditionalWarning(
                outputLog,
                `These files/folders already exist and would be overwritten by the theme: ${conflicts.join(', ')}`,
            );
            overwrite = await confirm({
                message: 'Overwrite the existing files with the theme files?',
                default: false,
            });
            if (!overwrite) {
                throw new Error(
                    'Theme installation cancelled to avoid overwriting existing files.',
                );
            }
        }

        // Copy the theme contents into the current directory.
        fs.copySync(themeFolder, './', { overwrite });

        // Format the package json file
        await formatPackageJson(args);
        logConditionalSuccess(outputLog, 'Theme downloaded and extracted');
    } finally {
        // Always clean up the temp directory, even on failure. Errors propagate
        // to initializeHandler, which handles CTRL+C gracefully and reports the rest.
        fs.removeSync(tmpDir);
    }
};

/**
 * Install NPM packages
 */
export const installNpm = async () => {
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
    if (
        name === null &&
        (!fs.existsSync('.env') || !fs.existsSync('package.json'))
    ) {
        name = await input({
            message: 'What is the project name?',
            default: kebabToCapitalized(process.cwd().split('/').pop()),
        });
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
        'theme-skeleton',
    ];
    if (projectType === null || !allowedTypes.includes(projectType)) {
        projectType = await select({
            message: 'What type of project is this?',
            choices: [
                {
                    name: 'Existing website with project files',
                    value: 'existing',
                },
                { name: 'New basic website', value: 'basic' },
                { name: 'Arlo theme', value: 'theme-arlo' },
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

    // Whether to overwrite the existing formatting configuration files
    const forceFormattingFiles = args.updateFormattingConfig === true;

    if (projectType.substring(0, 6) === 'theme-') {
        const themeArgs = isObject(args) ? args : {};
        if (name) {
            themeArgs.packageName = name;
        }
        await downloadTheme(themeArgs, projectType, outputLog);
        setupFormattingFiles(outputLog, forceFormattingFiles);
        await setupEnvFile(name, outputLog);
    } else {
        // Not a theme site. Could be an existing site or a new website
        // Set up the formatting files first so that the files created below are formatted with them.
        setupFormattingFiles(outputLog, forceFormattingFiles);
        setupLicense(args);
        await setupPackageJson(args, name, outputLog);
        setupGitIgnore(false, outputLog);
        await setupEnvFile(name, outputLog);
        await setupConfigFile(args.config || '.aptuitiv-buildrc.js', outputLog);
        removeFiles(outputLog);
        if (projectType === 'basic') {
            await setupBasicWebsite(outputLog);
        }
    }
    await installNpm();
    if (outputLog) {
        fancyLog(
            logSymbols.success,
            chalk.green('The build environment is set up now.'),
        );
    }
};

/**
 * Process the initialize request
 *
 * @param {object} args The command line arguments
 * @returns {Promise<boolean>} Returns true if the initialization was successful, false otherwise
 */
export const initializeHandler = async (args) => {
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

/**
 * Process the request to update the formatting configuration files
 *
 * Copies the .editorconfig, .prettierignore, and .prettierrc.cjs files into the project,
 * overwriting the existing files.
 *
 * @param {object} args The command line arguments
 */
export const updateFormattingConfigHandler = (args) => {
    setupRoot(args.root);
    setupFormattingFiles(true, true);
    fancyLog(
        logSymbols.success,
        chalk.green('The formatting configuration files are updated.'),
    );
};
