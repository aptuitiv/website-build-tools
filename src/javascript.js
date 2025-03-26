/* ===========================================================================
    Javascript file processing
=========================================================================== */

import chalk from 'chalk';
import * as esbuild from 'esbuild';
import { ESLint } from 'eslint';
import fancyLog from 'fancy-log';
import fs from 'fs-extra';
import logSymbols from 'log-symbols';
import { dirname, parse } from 'path';
import { minify } from 'terser';
import aptuitivEslint from '@aptuitiv/eslint-config-aptuitiv';
import inlineWorkerPlugin from './esbuild/plugin-inline-worker/index.js';

// Build scripts
import config from './config.js';
import {
    areFilesDifferent,
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
const entryPoints = [];
let files = [];

/**
 * Prepare the bundle for processing
 *
 * @param {object} bundle The bundle data
 * @param {string} [buildPath] An optional build path for the bundle. This is used when combining a bundle with an esbuild build.
 * @returns {object|undefined} The bundle data or undefined if the bundle could not be processed
 */
const prepareBundle = (bundle, buildPath) => {
    let returnData;
    let buildPathParam = buildPath;
    if (!isStringWithValue(buildPathParam) && isStringWithValue(bundle.build)) {
        // Set up the absolute build path
        buildPathParam = prefixRootThemeBuildPath(bundle.build, [config.data.javascript.build]);
    }
    if (isStringWithValue(buildPathParam)) {
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
            returnData = {
                dest: buildPathParam,
                lint: lintFiles,
                src: bundleFiles,
            };
        }
    }
    return returnData;
};

/**
 * Prepare the source Javascript files for processing
 */
const prepareJsConfig = () => {
    if (!isProcessed) {
        // Process Javascript files that should be bundled together and minified
        if (Array.isArray(config.data.javascript.bundles)) {
            config.data.javascript.bundles.forEach((bundle) => {
                const bundleData = prepareBundle(bundle);
                if (isObjectWithValues(bundleData)) {
                    bundles.push(bundleData);
                }
            });
        }

        // Process files with esbuild
        if (Array.isArray(config.data.javascript.entryPoints)) {
            config.data.javascript.entryPoints.forEach((entryPoint) => {
                if (isStringWithValue(entryPoint)) {
                    const entryPointFile = prefixRootSrcPath(entryPoint, [config.data.javascript.src]);
                    entryPoints.push(entryPointFile);
                } else if (isObjectWithValues(entryPoint) && isStringWithValue(entryPoint.in)) {
                    const entryPointFile = prefixRootSrcPath(entryPoint.in, [config.data.javascript.src]);
                    const ep = { in: entryPointFile };
                    if (isStringWithValue(entryPoint.out)) {
                        ep.out = entryPoint.out;
                    }
                    if (isObjectWithValues(entryPoint.config)) {
                        ep.config = entryPoint.config;
                    }
                    if (isObjectWithValues(entryPoint.bundle)) {
                        ep.bundle = entryPoint.bundle;
                    }
                    entryPoints.push(ep);
                }
            });
        }

        // Process individual files
        if (Array.isArray(config.data.javascript.files)) {
            // Prefix each file with the root source path and the javascript source path
            const processedFiles = config.data.javascript.files.map((file) => prefixRootSrcPath(file, [config.data.javascript.src]));
            // Process each file and treat them as a glob
            processedFiles.forEach((file) => {
                files = files.concat(getGlob(file));
            });
        }

        // Mark the configuration as processed
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
    const filesToLint = fileGlob || prefixRootSrcPath(`${config.data.javascript.src}/**/*.{js,cjs,mjs}`);

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
        // Default configuration for eslint.
        // https://eslint.org/docs/latest/use/configure/
        baseConfig: [
            // Because @aptuitiv/eslint-config-aptuitiv exports an array of objects, we need to use the spread operator.
            ...aptuitivEslint,
            {
                rules: {
                    // Allow importing Javascript files
                    'import/extensions': 'off',
                },
            },
        ],
        fix: true,
        overrideConfigFile: true,
        overrideConfig: null,
    };
    // Get the override configuration from the configuration file in the website project.
    if (isObjectWithValues(config.data.eslint)) {
        if (Array.isArray(config.data.eslint.ignores)) {
            // Make sure that the each ignores pattern includes the javascript source path
            config.data.eslint.ignores = config.data.eslint.ignores.map((ignore) => prefixSrcPath(ignore, [config.data.javascript.src]));
        }
        options.overrideConfig = config.data.eslint;
    }

    // Create an instance of ESLint with the configuration passed to the function
    try {
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
    } catch (error) {
        if (isStringWithValue(error.messageTemplate)) {
            let errorFile = '';
            if (isObjectWithValues(error.messageData) && isStringWithValue(error.messageData.pattern)) {
                errorFile = error.messageData.pattern;
            }
            if (error.messageTemplate === 'file-not-found') {
                fancyLog(logSymbols.warning, chalk.yellow('Could not find file to lint'), errorFile);
            } else {
                fancyLog(logSymbols.error, chalk.red('Error running ESLint'), error);
            }
        } else {
            fancyLog(logSymbols.error, chalk.red('Error running ESLint'), error);
        }
    }

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
        try {
            const results = await minify(contents, minifyOptions);
            fs.writeFileSync(buildFile, results.code);
        } catch (error) {
            fancyLog(logSymbols.error, chalk.red('Error minifying Javascript file'), chalk.cyan(fileToProcess));
            fancyLog(chalk.red(error));
        }
    }
    fancyLog(logSymbols.success, chalk.green('Javascript file processing finished', chalk.cyan(fileToProcess)));
};

/**
 * Process a bundle from the config.javascriopt.bundles array
 *
 * @param {Array} bundle The bundle configuration
 * @param {string} additionalFileContents Additional file contents to add to the bundle
 * @param {boolean} log Whether to log the bundle process
 */
const processBundle = async (bundle, additionalFileContents = '', log = true) => {
    if (log) {
        fancyLog(chalk.magenta('Processing Javascript bundle: '), chalk.cyan(removeRootThemeBuildPrefix(bundle.dest)));
    }
    // Make sure the directory exists
    fs.ensureDirSync(parse(bundle.dest).dir);

    // Create stream.
    // This writes to a temporary file first and then copies it to the destination file if the write is successful.
    // This is done so that a partially written file isn't FTP'd to the server.
    const abortController = new AbortController();
    // The temporary file gets a random name so that it's unique. This is to prevent any issues with the file being written to
    // while another processBundle() call is happening. That can give some weird results where files don't have all
    // the contents that they should.
    const tempDest = prefixRootPath(`${config.data.build.temp}/jsbundle-${Math.random().toString(20).substring(2, 10)}.tmp`);
    fs.ensureDirSync(prefixRootPath(config.data.build.temp));
    const stream = fs.createWriteStream(tempDest, { flags: 'w', signal: abortController.signal });

    stream.on('error', (error) => {
        // There was an error writing the file.
        // This was likely because it was aborted in the code below.
        // eslint-disable-next-line no-console -- We need to output the error.
        console.error(error);
        // Remove the temp file
    });

    stream.on('finish', () => {
        // The stream successfully finished.
        // Copy the temp file to the destination file
        fs.copySync(tempDest, bundle.dest);
        // Remove the temporary file
        fs.removeSync(tempDest);
    });

    // Get the minify optins
    const minifyOptions = getMinifyOptions();

    let hasError = false;

    // Process each file in the bundle
    // Cannot use forEach as it doesn't work with async/await. https://stackoverflow.com/a/37576787

    for (const file of bundle.src) {
        const contents = fs.readFileSync(file, 'utf-8');
        if (config.data.javascript.minify === false || minifyOptions.compress === false) {
            // Don't minify the code
            stream.write(contents);
        } else {
            // Minify the code
            try {
                // eslint-disable-next-line no-await-in-loop -- The files are added sequentially to the stream so we need to wait
                const results = await minify(contents, minifyOptions);
                stream.write(results.code);
            } catch (error) {
                fancyLog(logSymbols.error, chalk.red('Error minifying Javascript file'), chalk.cyan(file));

                // eslint-disable-next-line no-console -- We need to output the error. console.log() is used to make it more visible.
                console.log('\n', logSymbols.error, chalk.red(error), '\n');
                abortController.abort('Error minifying Javascript file');
                hasError = true;
                break;
            }
        }
    }

    // Add additional file contents if necessary
    if (isStringWithValue(additionalFileContents)) {
        stream.write(additionalFileContents);
    }

    // Close stream
    if (!hasError) {
        stream.end();
        if (log) {
            fancyLog(logSymbols.success, chalk.green('Javascript bundle processing finished', chalk.cyan(removeRootThemeBuildPrefix(bundle.dest))));
        }
    } else {
        stream.end();
        fancyLog(logSymbols.error, chalk.red('Javascript bundle processing failed'));
    }
};

/**
 * Process the Javascript files with esbuild
 *
 * https://esbuild.github.io/
 *
 * The format of the build is IIFE (Immediately Invoked Function Expression)
 * https://esbuild.github.io/api/#format-iife
 * If your entry point has exports that you want to expose as a global in the browser, you can configure that global's name using the global name setting.
 * https://esbuild.github.io/api/#global-name
 *
 * @param {string|object} entry The entry points for the build
 */
const processEsbuild = async (entry) => {
    // Set up the entry point data
    let entryFile = '';
    let logEntryFile = '';
    let entryConfig = {};
    if (isString(entry)) {
        entryFile = entry;
        logEntryFile = entry;
    } else if (isObjectWithValues(entry) && isStringWithValue(entry.in)) {
        if (isStringWithValue(entry.out)) {
            entryFile = { in: entry.in, out: entry.out };
            logEntryFile = entry.in;
        } else {
            entryFile = entry.in;
        }
        if (isObjectWithValues(entry.config)) {
            entryConfig = entry.config;
        }
    }
    fancyLog(chalk.magenta('Building Javascript'), chalk.cyan(removeRootPrefix(logEntryFile)));

    const buildPath = prefixRootThemeBuildPath(config.data.javascript.build);

    // Set up the default configuration
    let esConfig = {
        minify: true,
    };

    // Combine the user configuration with the default configuration
    if (isObjectWithValues(config.data.javascript.esConfig)) {
        esConfig = { ...esConfig, ...config.data.javascript.esConfig };
    }

    // Set some configuration options that should not be overwritten.
    // Also include the configuration specific to the entry point.
    esConfig = {
        ...esConfig,
        ...entryConfig,
        bundle: true,
        entryPoints: [entryFile],
        format: 'iife',
        outdir: buildPath,
        platform: 'browser',
        write: false,
        plugins: [inlineWorkerPlugin()]
    };

    // Get the esbuild context
    const ctx = await esbuild.context(esConfig);

    // Build/rebuild the files
    const result = await ctx.rebuild();

    result.outputFiles.forEach((out) => {
        let processAsBundle = false;
        if (entry.bundle) {
            // The build contents are included with other Javascript files in a bundle.
            // This is useful if you want to build with esbuild and you want to include
            // some other libraries in a single Javascript file.
            const bundleData = prepareBundle(entry.bundle, out.path);
            if (isObjectWithValues(bundleData)) {
                processAsBundle = true;
                processBundle(bundleData, out.text, false);
            }
        }
        if (!processAsBundle) {
            // The build contents are simply written to a file
            // and are not included in a bundle with other javascript files.
            if (areFilesDifferent(out.text, out.path)) {
                // Make sure that the destination directory exists
                const destDir = dirname(out.path);
                if (!fs.existsSync(destDir)) {
                    fs.mkdirSync(destDir, { recursive: true });
                }
                // The file is different so write it to the build directory
                fs.writeFileSync(out.path, out.text);
                fancyLog(
                    logSymbols.success,
                    chalk.green('Javascript built:'),
                    chalk.cyan(removeRootPrefix(out.path)),
                );
            } else {
                fancyLog(
                    chalk.yellow(
                        `Skipping ${removeRootPrefix(out.path)} because the built content is the same as the destination file`,
                    ),
                );
            }
        }
    });

    // Call "dispose" when you're done to free up resources
    ctx.dispose();

    fancyLog(logSymbols.success, chalk.green('Javascript build finished'), chalk.cyan(removeRootPrefix(logEntryFile)));
};

/**
 * Process all of the entry points with esbuild.
 *
 * esbuild supports multiple entry points passed to the "entryPoint" option.
 * However, we are processing them separately so that we can have different configuration
 * for each entry point, if necessary. This allows the web developer to have different
 * configurations for different entry points.
 *
 * @param {Array} entries The entry points for the build
 * @returns {Promise}
 */
const processEsbuilds = (entries) => new Promise((resolve) => {
    const promises = [];
    entries.forEach((entry) => {
        promises.push(processEsbuild(entry));
    });
    Promise.all(promises).then(() => {
        resolve();
    });
});

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
    if (entryPoints.length > 0) {
        jsPromises.push(processEsbuilds(entryPoints));
    }
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
        } else if (entryPoints.length > 0) {
            // Assume that this file is part of a build
            if (lint) {
                await lintJs(file);
            }
            processEsbuilds(entryPoints);
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
