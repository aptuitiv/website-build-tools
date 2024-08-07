/* ===========================================================================
    Javascript file processing
=========================================================================== */

import chalk from 'chalk';
import { ESLint } from 'eslint';
import fancyLog from 'fancy-log';
import fs from 'fs-extra';
import logSymbols from 'log-symbols';
import { parse } from 'path';
import { minify } from 'terser';

// Build scripts
import config from './config.js';
import {
    getGlob,
    processGlobPath,
    prefixPath,
    prefixRootPath,
    prefixRootSrcPath,
    prefixRootThemeBuildPath,
    prefixSrcPath,
    removePrefixes,
    removeRootPrefix,
    removeRootThemeBuildPrefix,
} from './helpers.js';
import { isObjectWithValues, isString, isStringWithValue } from './lib/types.js';

let isProcessed = false;
const bundles = [];
let files = [];

/**
 * Prepare the source Javascript files for processing
 */
const prepareJsConfig = () => {
    if (!isProcessed) {
        if (Array.isArray(config.data.javascript.bundles)) {
            config.data.javascript.bundles.forEach((bundle) => {
                if (isStringWithValue(bundle.build)) {
                    // Set up the absolute build path
                    const buildPath = prefixRootThemeBuildPath(bundle.build, [config.data.javascript.build]);
                    // Set up the bundle files
                    let bundleFiles = [];
                    // Set up a separate array of files to lint.
                    // This is done so that we can exclude the node_modules files from the linting.
                    let lintFiles = [];
                    // Process any node_modules files if there are any
                    if (typeof bundle.nodeModules !== 'undefined') {
                        if (isStringWithValue(bundle.nodeModules)) {
                            bundleFiles = bundleFiles.concat(getGlob(prefixRootPath(bundle.nodeModules, ['node_modules'])));
                        } else if (Array.isArray(bundle.nodeModules)) {
                            bundle.nodeModules.forEach((srcPath) => {
                                // Each source value should be a string
                                if (isStringWithValue(srcPath)) {
                                    bundleFiles = bundleFiles.concat(getGlob(prefixRootPath(srcPath, ['node_modules'])));
                                }
                            });
                        }
                    }
                    // Process the src files
                    if (typeof bundle.src !== 'undefined') {
                        if (isStringWithValue(bundle.src)) {
                            // Set up the bundle files from the string value and treat as a glob
                            const src = prefixRootSrcPath(bundle.src, [config.data.javascript.src]);
                            const srcGlob = getGlob(src);
                            bundleFiles = bundleFiles.concat(srcGlob);
                            lintFiles = lintFiles.concat(srcGlob);
                        } else if (Array.isArray(bundle.src)) {
                            // Process the array of source files and treat them as a glob
                            bundle.src.forEach((srcPath) => {
                                // Each source value should be a string
                                if (isStringWithValue(srcPath)) {
                                    const processedSrc = prefixRootSrcPath(srcPath, [config.data.javascript.src]);
                                    const srcGlob = getGlob(processedSrc);
                                    bundleFiles = bundleFiles.concat(srcGlob);
                                    lintFiles = lintFiles.concat(srcGlob);
                                }
                            });
                        }
                    }

                    if (bundleFiles.length > 0) {
                        bundles.push({
                            dest: buildPath,
                            lint: lintFiles,
                            src: bundleFiles,
                        });
                    }
                }
            });
        }
        // Prefix the root source path to each file
        if (Array.isArray(config.data.javascript.files)) {
            // Prefix each file with the root source path and the javascript source path
            const processedFiles = config.data.javascript.files.map((file) => prefixRootSrcPath(file, [config.data.javascript.src]));
            // Process each file and treat them as a glob
            processedFiles.forEach((file) => {
                files = files.concat(getGlob(file));
            });
        }

        // Mark the files as processed
        isProcessed = true;
    }
};

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
};

/**
 * Run eslint on the javascript files
 *
 * @param {string} [fileGlob] The file glob to lint
 */
const lintJs = async (fileGlob) => {
    // Get the glob of files to lint
    const filesToLint = fileGlob || prefixRootSrcPath(`${config.data.javascript.src}/**/*.js`);

    if (isString(filesToLint)) {
        fancyLog(
            chalk.magenta('Linting Javascript'),
            chalk.cyan(removeRootPrefix(filesToLint)),
        );
    } else if (Array.isArray(filesToLint)) {
        // Make sure that the files are unique
        filesToLint.filter((value, index, arr) => arr.indexOf(value) === index).forEach((file) => {
            fancyLog(
                chalk.magenta('Linting Javascript'),
                chalk.cyan(removeRootPrefix(file)),
            );
        });
    }

    // Set up the eslint options. This is different from the linting configuration in "baseConfig".
    // This is the configuration for the eslint API.
    // See options at https://eslint.org/docs/latest/integrate/nodejs-api#-new-eslintoptions
    const options = {
        // Need to set the current working directory to the package root so that the any
        // "extend" configurations are found. They are looked for in the node_modules of this package,
        // not the site's package. The "extends" configuration is the one thing that the developer
        // can't overwrite because their packages won't be found.
        cwd: config.data.packageRoot,
        // Default configuration for eslint.
        // https://eslint.org/docs/latest/use/configure/
        baseConfig: {
            extends: ['@aptuitiv/eslint-config-aptuitiv'],
        },
        fix: true,
        overrideConfig: null,
    };
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
        const returnValue = result;
        returnValue.filePath = removeRootPrefix(result.filePath);
        return returnValue;
    });

    // Format and output the results
    await eslint.loadFormatter('stylish').then((formatter) => {
        const formatResults = formatter.format(results);
        if (formatResults.length > 0) {
            // eslint-disable-next-line no-console -- Need to output the results
            console.log(formatResults);
        }
    });

    fancyLog(logSymbols.success, chalk.green('Javascript linting finished'));
};

/**
 * Get the minify options
 *
 * @returns {object}
 */
const getMinifyOptions = () => {
    let returnValue = {
        mangle: false,
        compress: {
            defaults: false,
        },
    };
    if (isObjectWithValues(config.data.javascript.minify)) {
        returnValue = { ...returnValue, ...config.data.javascript.minify };
    }
    return returnValue;
};

/**
 * Process a single Javascript file from the config.data.javascript.files array
 *
 * @param {string} filePath The absolute path to the Javascript file within the source directory
 */
const processFile = async (filePath) => {
    // Get the build directory and file path from the source file path
    let buildFile = removeRootPrefix(filePath);
    buildFile = removePrefixes(buildFile, [config.data.src, config.data.javascript.src, '/']);
    const fileToProcess = buildFile;
    fancyLog(chalk.magenta('Processing Javascript file: '), chalk.cyan(fileToProcess));
    const buildDirectory = prefixRootThemeBuildPath(config.data.javascript.build);
    buildFile = prefixPath(buildFile, buildDirectory);
    // Make sure the directory exists
    fs.ensureDirSync(buildDirectory);

    // Write the minified file to the build directory
    const contents = fs.readFileSync(filePath, 'utf-8');
    const minifyOptions = getMinifyOptions();
    if (config.data.javascript.minify === false || minifyOptions.compress === false) {
        // Don't minify the code
        fs.writeFileSync(buildFile, contents);
    } else {
        // Minify the code
        const results = await minify(contents, minifyOptions);
        fs.writeFileSync(buildFile, results.code);
    }
    fancyLog(logSymbols.success, chalk.green('Javascript file processing finished', chalk.cyan(fileToProcess)));
};

/**
 * Process a bundle from the config.javascriopt.bundles array
 *
 * @param {Array} bundle The bundle configuration
 */
const processBundle = async (bundle) => {
    fancyLog(chalk.magenta('Processing Javascript bundle: '), chalk.cyan(removeRootThemeBuildPrefix(bundle.dest)));
    // Make sure the directory exists
    fs.ensureDirSync(parse(bundle.dest).dir);

    // Create stream
    const stream = fs.createWriteStream(bundle.dest, { flags: 'w' });

    // Get the minify optins
    const minifyOptions = getMinifyOptions();

    // Process each file in the bundle
    // Cannot use forEach as it doesn't work with async/await. https://stackoverflow.com/a/37576787
    // eslint-disable-next-line no-restricted-syntax -- We need to use a for loop to use await
    for (const file of bundle.src) {
        const contents = fs.readFileSync(file, 'utf-8');
        if (config.data.javascript.minify === false || minifyOptions.compress === false) {
            // Don't minify the code
            stream.write(contents);
        } else {
            // Minify the code
            // eslint-disable-next-line no-await-in-loop -- The files are added sequentially to the stream so we need to wait
            const results = await minify(contents, minifyOptions);
            stream.write(results.code);
        }
    }

    // Close stream
    stream.end();
    fancyLog(logSymbols.success, chalk.green('Javascript bundle processing finished', chalk.cyan(removeRootThemeBuildPrefix(bundle.dest))));
};

/**
 * Process all the Javascript files
 *
 * @returns {Promise}
 */
const processAllJs = async () => new Promise((resolve) => {
    prepareJsConfig();

    const jsPromises = [];
    bundles.forEach((bundle) => {
        jsPromises.push(processBundle(bundle));
    });
    files.forEach((file) => {
        jsPromises.push(processFile(file));
    });
    Promise.all(jsPromises).then(() => {
        resolve();
    });
});

/**
 * Process a single Javascript file
 *
 * This is called either from the API or from a watch.
 *
 * @param {string} filePath The path to the Javascript file
 * @param {boolean} lint Whether to lint the Javascript files that are being proccessed
 */
export const processJsFile = async (filePath, lint = true) => {
    prepareJsConfig();

    // Remove any prefixes from the file. This is done to normalize the file path.
    // We will add the prefixes back in before we process it. They are in case
    // the file path contains one or more of the prefixes.
    let file = removeRootPrefix(filePath);
    file = removePrefixes(file, [config.data.src, config.data.javascript.src, '/']);

    // Add all the prefixes back in to get the absolute path to the file
    file = prefixRootSrcPath(file, [config.data.javascript.src]);

    // Find the file in the bundles or the individual files
    // The file could be in one or more bundles
    const matchedBundles = bundles.filter((bundle) => bundle.src.includes(file) || bundle.dest === file);
    if (matchedBundles.length > 0) {
        if (lint) {
            // Join all of the files to lint from each bundle together
            let filesToLint = [];
            matchedBundles.forEach((bundle) => {
                filesToLint = [...filesToLint, ...bundle.lint];
            });
            await lintJs(filesToLint);
        }
        // Process each bundle
        matchedBundles.forEach((bundle) => {
            processBundle(bundle);
        });
    } else {
        const matchedFile = files.find((f) => f === file);
        if (matchedFile) {
            if (lint) {
                await lintJs(file);
            }
            processFile(file);
        } else {
            fancyLog(logSymbols.error, chalk.red('The file could not be found in the Javascript configuration'), chalk.cyan(filePath));
        }
    }
};

/**
 * Process the Javascript request
 *
 * @param {string} action The action to take
 * @param {object} args The command line arguments
 * @returns {Promise}
 */
export const jsHandler = async (action, args) => {
    if (action === 'process') {
        if (isString(args.file)) {
            await processJsFile(args.file, args.lint);
        } else {
            if (args.lint) {
                await lintJs();
            }
            await processAllJs();
        }
    } else if (action === 'lint') {
        if (isString(args.path)) {
            const lintPath = processGlobPath(getSrcPath(args.path));
            await lintJs(lintPath);
        } else {
            await lintJs();
        }
    }
};
