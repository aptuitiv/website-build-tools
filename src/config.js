/* ===========================================================================
    Configuration for the build process
=========================================================================== */

import resolveFrom from 'resolve-from';
import { isAbsolute, join, resolve } from 'path';
import deepmerge from 'deepmerge';
import { cosmiconfig } from 'cosmiconfig';
import dotenv from 'dotenv';

import { isObjectWithValues } from './lib/types.js';

/* global process */

// Set up the default configuration
const defaultConfig = {
    build: {
        // The root build folder for the files to publish to the website. This is used when uploading files via FTP.
        base: 'dist',
        // The build folder path for all files for the theme. This is used when uploading files via FTP.
        theme: 'dist/theme/custom',
    },
    css: {
        // The folder for the CSS files within the theme build folder. (config.build.theme)
        build: 'css',
        // The glob for CSS file(s) that import the other CSS files.  This is used when building the files.
        // This is within the root source folder. (config.src)
        buildFiles: '*.css',
        // The source folder for the CSS files within the root source folder. (config.src)
        src: 'css',
    },
    // An array of file globs to copy and their destination folders
    copy: [],
    // Eslint linting configuration
    // https://eslint.org/docs/latest/use/configure/
    eslint: {},
    fonts: {
        // The folder for the fonts within the theme build folder. (config.build.theme)
        build: 'fonts',
        // The source folder for the fonts within the root source folder. (config.src)
        src: 'fonts',
    },
    icons: {
        // The path within the src templates folder that the icon sprite will be created in
        build: 'snippets/svg-icons.twig',
        // The source folder for the svg icon files within the root source folder. (config.src)
        src: 'icons',
    },
    images: {
        // The folder for the images within the theme build folder. (config.build.theme)
        build: 'images',
        // Image optimizations
        optimizations: {
            jpg: {
                mozjpeg: true,
                quality: 80,
                progressive: true,
            },
            png: {
                quality: 80,
                progressive: true,
                compressionLevel: 6,
                adaptiveFiltering: true,
            },
            webp: {
                quality: 80,
                lossless: false,
                smartSubsample: true,
            },
        },
        // The source folder for the image files within the root source folder. (config.src)
        src: 'images',
    },
    javascript: {
        // The folder for the javascript files within the theme build folder. (config.build.theme)
        build: 'js',
        // An array of file globs to bundle and their destination folder
        bundles: [],
        // An array of file globs to process.
        files: [],
        // Minification options for terser.
        // https://terser.org/docs/options/
        minify: {},
        // The source folder for the javascript files within the root source folder. (config.src)
        src: 'js',
    },
    // The root folder for all the project files. If the user needs to change this they should put
    // it as the absolute path to the root of their project.
    root: process.cwd(),
    // The root folder to the source files.
    src: 'src',
    // Stylelint configuration options
    // https://stylelint.io/user-guide/configure
    stylelint: {},
    templates: {
        // The folder for the theme twig templates within the theme build folder. (config.build.theme)
        build: 'templates',
        // The source folder for the theme twig templates within the root source folder. (config.src)
        src: 'theme',
    },
    themeConfig: {
        // The folder for the theme config files within the theme build folder. (config.build.theme)
        build: 'config',
        // The source folder for the theme config files within the root source folder. (config.src)
        src: 'config',
    },
};

/**
 * The configuration class
 */
class Config {
    /**
     * Constructor
     */
    constructor() {
        // Holds the configuration object
        this.data = {};
    }

    /**
     * Initializes the configuration object.
     *
     * If it doesn't exist yet then it's set up.
     *
     * @param {object} args An object containing the command line arguments
     */
    async init(args) {
        if (Object.keys(this.data).length === 0) {
            await this.getConfigFromProject(args.config, args.root);
        }
    }

    /**
     * Get the configuration object
     *
     * @returns {object} The configuration object
     */
    getConfig() {
        return this.data;
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
     */
    async getConfigFromProject(configFile, rootFolder) {
        // Set up the config explorer
        const configExplorer = cosmiconfig('aptuitiv-build', {
            transform: (cosmiconfigResult) => {
                let foundConfig = {};
                if (
                    isObjectWithValues(cosmiconfigResult)
                    && isObjectWithValues(cosmiconfigResult.config)
                ) {
                    foundConfig = cosmiconfigResult.config;
                }
                // Merge the default configuration with the configuration file contents
                return deepmerge(defaultConfig, foundConfig);
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
            await configExplorer
                .load(configPath)
                .then((result) => {
                    // The specified configuration file exists
                    config = result;
                })
                .catch(async () => {
                    // The specified configuration file doesn't exist so search for for the configuration file based 'aptuitiv-build' in the root folder
                    await configExplorer
                        .search()
                        .then((result) => {
                            config = result;
                        })
                        .catch(() => false);
                });
        } else {
            // NO configuration file was specified so search for for the configuration file based 'aptuitiv-build' in the root folder
            await configExplorer.search().then((result) => {
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

        this.data = config;
    }
}

const configClass = new Config();

export default configClass;
