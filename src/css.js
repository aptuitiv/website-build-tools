/* ===========================================================================
    Process the CSS with PostCSS
    https://github.com/postcss/postcss
=========================================================================== */

import fs from 'fs-extra';
import chalk from 'chalk';
import deepmerge from 'deepmerge';
import { globSync } from 'glob';
import fancyLog from 'fancy-log';
import logSymbols from 'log-symbols';
import { dirname, parse } from 'path';
import postcss from 'postcss';
import stylelint from 'stylelint';
import { fileURLToPath } from 'url';

// PostCSS plugins
import autoprefixer from 'autoprefixer';
import cssnano from 'cssnano';
import postcssCustomMedia from 'postcss-custom-media';
import postcssImport from 'postcss-import';
import postcssReporter from 'postcss-reporter';

// Build scripts
import config from './config.js';
import {
    getGlob,
    isObjectWithValues,
    prefixPath,
    prefixRootPath,
    prefixRootSrcPath,
    prefixRootThemeBuildPath,
    prefixSrcPath,
    removeRootPrefix,
} from './helpers.js';

// Get the directory name of the current module
const __dirname = dirname(fileURLToPath(import.meta.url));

/**
 * Get the correct CSS source path within the CSS base directory
 *
 * @param {string} filePath The source path
 * @returns {string}
 */
const getSrcPath = (filePath) => {
    const sourcePath = prefixSrcPath(config.data.css.src);
    const basePath = prefixRootPath(sourcePath);
    return prefixPath(filePath, basePath, sourcePath);
};

/**
 * Really basic function to test and see if the file contents are different
 *
 * @param {string} sourceFile The source file contents
 * @param {string} targetPath The path for the target file
 * @returns {boolean}
 */
function areFilesDifferent(sourceFile, targetPath) {
    if (fs.pathExistsSync(targetPath)) {
        const targetData = fs.readFileSync(targetPath, 'utf-8');
        return sourceFile !== targetData;
    }
    return true;
}

/**
 * Run stylelint on the css files
 *
 * @param {string} [fileGlob] The file glob to lint
 */
const runStylelint = async (fileGlob) => {
    const filesToLint =
        fileGlob || prefixRootSrcPath(`${config.data.css.src}/**/*.css`);

    // Set up the configuration.
    // https://stylelint.io/user-guide/node-api
    let options = {
        config: {
            cache: true,
            defaultSeverity: 'warning', // So that stylelint won't stop on errors and the CSS will still build
            extends: ['stylelint-config-standard'],
            fix: true,
            plugins: ['stylelint-order', 'stylelint-selector-bem-pattern'],
            reportDescriptionlessDisables: true, // https://github.com/stylelint/stylelint/blob/main/docs/user-guide/options.md#reportdescriptionlessdisables
            reportInvalidScopeDisables: true, // https://github.com/stylelint/stylelint/blob/main/docs/user-guide/options.md#reportinvalidscopedisables
            reportNeedlessDisables: true, // https://github.com/stylelint/stylelint/blob/main/docs/user-guide/options.md#reportneedlessdisables
            rules: {
                'color-named': 'never',
                // Override the stylelint-config-standard rule to allow custom properties in formats that aren't kebab-case
                'custom-property-pattern': null,
                'import-notation': 'string',
                'order/properties-alphabetical-order': true,
                // Set the BEM pattern rule
                'plugin/selector-bem-pattern': {
                    ignoreCustomProperties: ['.*'],
                    preset: 'suit',
                    utilitySelectors: '^\\.(?:[a-z][a-z-0-9]*)+$',
                },
                'selector-class-pattern': null,
                'selector-id-pattern': null,
            },
        },
        // Set the absolute path to the directory that relative paths defining "extends", "plugins", and "customSyntax" are relative to.
        // Only necessary if these values are relative paths.
        // This is set to the root of the aptuitiv-build project folder.
        configBasedir: dirname(__dirname),

        // The path to the configuration file.
        // This is set to the file path in the root of the aptuitiv-build project folder.
        // Override to the absolute path to the file in your project if you want to use your own stylelint config file.
        // configFile: `${dirname(__dirname)}/.stylelintrc.cjs`
        files: filesToLint,
        formatter: 'string',
    };
    if (isObjectWithValues(config.data.stylelint)) {
        options.config = deepmerge(options.config, config.data.stylelint);
    }

    fancyLog(
        chalk.magenta('Stylelint'),
        chalk.cyan(removeRootPrefix(filesToLint)),
    );
    const results = await stylelint.lint(options);
    if (results.report.length > 0) {
        console.log(results.report);
    }
    if (results.errored) {
        process.exit(2);
    }
    fancyLog(logSymbols.success, chalk.green('Stylelint finished'));
};

/**
 * Run PostCSS on the file
 *
 * @param {string} filePath The path of the CSS file to process
 */
const runPostCss = (filePath) => {
    const { base: fileName } = parse(filePath);
    const destDir = prefixRootThemeBuildPath(config.data.css.build);
    const dest = prefixPath(fileName, destDir);
    // Make sure that the destination directory exists
    if (!fs.existsSync(destDir)) {
        fs.mkdirSync(destDir, { recursive: true });
    }
    fs.readFile(filePath, (err, css) => {
        if (err) {
            console.error('Reading CSS file error: ', err);
        }
        fancyLog(chalk.magenta('Building CSS'), chalk.cyan(filePath));

        postcss([
            postcssReporter({ clearReportedMessages: true }),
            postcssImport(),
            postcssCustomMedia,
            autoprefixer,
            // cssnano needs to be run last
            cssnano({
                preset: 'default',
            }),
        ])
            .process(css, { from: filePath, to: dest })
            .then((result) => {
                if (areFilesDifferent(result.css, dest)) {
                    fs.writeFile(dest, result.css, () => {
                        fancyLog(
                            logSymbols.success,
                            chalk.green('Process CSS complete'),
                            chalk.cyan(filePath),
                        );
                    });
                    if (result.map) {
                        fs.writeFile(
                            `${dest}.map`,
                            result.map.toString(),
                            () => true,
                        );
                    }
                } else {
                    fancyLog(
                        chalk.yellow(
                            `Skipping ${filePath} because the built content is the same as ${dest}`,
                        ),
                    );
                }
            });
    });
};

/**
 * Process all the CSS files
 *
 * @param {boolean} lint Whether to lint the CSS files
 */
export const processCss = (lint = true) => {
    const buildFiles = config.data.css.buildFiles;
    let paths = [];
    if (typeof buildFiles === 'string') {
        paths = globSync(
            prefixRootSrcPath(prefixPath(buildFiles, config.data.css.src)),
        );
    } else if (Array.isArray(buildFiles)) {
        buildFiles.forEach((file) => {
            paths = paths.concat(
                globSync(
                    prefixRootSrcPath(prefixPath(file, config.data.css.src)),
                ),
            );
        });
    }
    if (lint) {
        runStylelint().then(() => {
            paths.forEach((filePath) => {
                runPostCss(filePath);
            });
        });
    } else {
        paths.forEach((filePath) => {
            runPostCss(filePath);
        });
    }
};

/**
 * Process the css request
 *
 * @param {string} action The action to take
 * @param {object} args The command line arguments
 */
export const cssHandler = (action, args) => {
    if (action === 'css') {
        if (typeof args.file === 'string') {
            if (args.lint) {
                runStylelint();
            }
            const filePath = getSrcPath(args.file);
            runPostCss(filePath);
        } else {
            processCss(args.lint);
        }
    } else if (action === 'lint') {
        if (typeof args.path === 'string') {
            const lintPath = getGlob(getSrcPath(args.path));
            runStylelint(lintPath);
        } else {
            runStylelint();
        }
    }
};
