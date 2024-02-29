/* ===========================================================================
    Configuration for the build process
=========================================================================== */

import resolveFrom from 'resolve-from';
import { join } from 'path';
import deepmerge from 'deepmerge';
import { cosmiconfig, cosmiconfigSync } from 'cosmiconfig';
import { type } from 'os';

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
 * Loads the configuration file and merges it with the default configuration
 * 
 * @param {string|undefined} configFile The name of the configuration file to load
 * @returns {object} The merged configuration object
 */
const getConfig = async (configFile) => {
    // Set up the config explorer
    const configExplorer = cosmiconfig('aptuitiv-build', {
        transform: (cosmiconfigResult) => {
            return deepmerge(defaultConfig, isObjectWithValues(cosmiconfigResult) ? cosmiconfigResult.config : {})
        },
        searchStrategy: 'project',
    });

    let config = defaultConfig;
    // Load the configuration file if it exists
    if (configFile) {
        await configExplorer.load(configFile)
            .then((result) => {
                config = result;
            })
            .catch(async (err) => {
                // The specified configuration file doesn't exist so search for for the configuration file
                await configExplorer.search()
                    .then((result) => {
                        config = result;
                    })
                    .catch((err) => false);
            });
    } else {
        await configExplorer.search()
            .then((result) => {
                config = result;
            });
    }

    config.root = process.cwd();

    return config;
}

export default getConfig;
