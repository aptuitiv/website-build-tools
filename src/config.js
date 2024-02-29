/* ===========================================================================
    Configuration for the build process
=========================================================================== */

import resolveFrom from 'resolve-from';
import { isAbsolute, join, resolve } from 'path';
import deepmerge from 'deepmerge';
import { cosmiconfig } from 'cosmiconfig';
import dotenv from 'dotenv';

import { isObjectWithValues } from './helpers.js';

// The root folder to build files too
const buildFolder = 'dist';
// The theme folder name
const themeFolder = 'custom';

// Set up the default configuration
const defaultConfig = {
    build: {
        // The root build folder for the files to publish to the website. This is used when uploading files via FTP.
        base: buildFolder,
        // The build folder for templates
        templates: `${buildFolder}/theme/${themeFolder}/templates`,
        // The build folder path for all files for the theme. This is used when uploading files via FTP.
        theme: `${buildFolder}/theme/${themeFolder}`
    },
    css: {
        // The base CSS file(s) that import the other CSS files. This is used when building the files.
        base: 'src/css/*.css',
        // The glob for all CSS files. This is used when linting CSS files.
        src: 'src/css/**/*.css'
    },
    copy: [],
    // The root folder for the source files. If the user needs to change this they should put
    // it as the absolute path to the root of their project.
    root: process.cwd(),
    // The source files for the theme twig templates
    template: {
        src: 'src/theme'
    }
}

/**
 * Loads the configuration file and merges it with the default configuration.
 * 
 * The configuration file can follow the cosmiconfig specification. 
 * This means it can be a JSON or YAML file, or a JavaScript file that exports the configuration object.
 * https://github.com/cosmiconfig/cosmiconfig
 * 
 * Or, it can be a file that is specified in the "-c" or "--config" command line argument.
 * 
 * The path searched will either be:
 * - A specificed configuration file path
 * - The root folder of the project
 * - The working directory
 * 
 * This is inspired by the way that stylelint loads its configuration file.
 * https://github.com/stylelint/stylelint/blob/main/lib/cli.mjs
 * 
 * @param {string} [configFile] The name of the configuration file to load
 * @param {string} [rootFolder] The root folder of the project
 * @returns {object} The merged configuration object
 */
const getConfig = async (configFile, rootFolder) => {
    // Set up the config explorer
    const configExplorer = cosmiconfig('aptuitiv-build', {
        transform: (cosmiconfigResult) => {
            // Merge the default configuration with the configuration file contents
            return deepmerge(defaultConfig, isObjectWithValues(cosmiconfigResult) ? cosmiconfigResult.config : {})
        },
        searchStrategy: 'project',
    });

    // Set the initial configuration as the default configuration
    let config = defaultConfig;

    // Set up the root folder
    let overrideRoot = false;
    let root = rootFolder;
    let cwd = process.cwd();
    if (typeof root === 'string' && root.length > 0) {
        if (!isAbsolute(root)) {
            root = resolve(cwd, root);
        }
        cwd = root;
        overrideRoot = true;
    }
    // Load the configuration file if it exists
    if (typeof configFile === 'string') {
        const configPath = resolveFrom.silent(cwd, configFile) || join(cwd, configFile);
        await configExplorer.load(configPath)
            .then((result) => {
                // The specified configuration file exists
                config = result;
            })
            .catch(async (err) => {
                // The specified configuration file doesn't exist so search for for the configuration file based 'aptuitiv-build' in the root folder
                await configExplorer.search()
                    .then((result) => {
                        config = result;
                    })
                    .catch((err) => false);
            });
    } else {
        // NO configuration file was specified so search for for the configuration file based 'aptuitiv-build' in the root folder
        await configExplorer.search()
            .then((result) => {
                config = result;
            });
    }

    // Override the root folder if it was passed in as an argument
    if (overrideRoot) {
        config.root = root;
    }

    // Load the .env file from the root folder for the project
    // The .env file is used to set environment variables for the project
    // such as the FTP credentials.
    dotenv.config({ path: resolve(cwd, '.env') });

    return config;
}

export default getConfig;
