/* ===========================================================================
    Process the CSS with PostCSS
    https://github.com/postcss/postcss
=========================================================================== */

import fs from 'fs-extra';
import chalk from 'chalk';
import { globSync } from 'glob';
import fancyLog from 'fancy-log';
import logSymbols from 'log-symbols';
import { dirname, parse } from 'path';
import postcss from 'postcss';
import stylelint from 'stylelint';

// PostCSS plugins
import autoprefixer from 'autoprefixer';
import cssnano from 'cssnano';
import postcssCustomMedia from 'postcss-custom-media';
import postcssImport from 'postcss-import';
import postcssReporter from 'postcss-reporter';

// Build scripts
import { getGlob, prefixPath } from './helpers.js';

/**
 * Get the correct CSS source path within the CSS base directory
 *
 * @param {string} filePath The source path
 * @returns {string}
 */
const getSrcPath = (config, filePath) => {
    const sourcePath = prefixPath(config.css.base, config.src);
    const basePath = prefixPath(sourcePath, config.root);
    return prefixPath(filePath, basePath, sourcePath);
}

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
 * @param {object} config The configuration object
 * @param {string} [fileGlob] The file glob to lint
 */
const runStylelint = async (config, fileGlob) => {
    const filesToLint = fileGlob || prefixPath(config.css.files, config.src);
    let options = {
        files: filesToLint,
        formatter: "string"
    }
    options = { ...options, ...config.stylelint };

    fancyLog(chalk.magenta('Stylelint'), chalk.cyan(filesToLint));
    const results = await stylelint.lint(options);
    if (results.report.length > 0) {
        console.log(results.report);
    }
    if (results.errored) {
        process.exit(2);
    }
    fancyLog(logSymbols.success, chalk.green('Stylelint finished'));
}

/**
 * Run PostCSS on the file
 *
 * @param {object} config The configuration object
 * @param {string} filePath The path of the CSS file to process
 */
const runPostCss = (config, filePath) => {
    const { base: fileName } = parse(filePath);
    const destDir = `${config.build.theme}/css`;
    const dest = `${destDir}/${fileName}`;
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
            })
        ])
            .process(css, { from: filePath, to: dest })
            .then(result => {
                if (areFilesDifferent(result.css, dest)) {
                    fs.writeFile(dest, result.css, () => {
                        fancyLog(logSymbols.success, chalk.green('Process CSS complete'), chalk.cyan(filePath));
                    })
                    if (result.map) {
                        fs.writeFile(`${dest}.map`, result.map.toString(), () => true)
                    }
                } else {
                    fancyLog(chalk.yellow(`Skipping ${filePath} because the built content is the same as ${dest}`));
                }
            });
    })
}

/**
 * Process all the CSS files
 * 
 * @param {object} config The configuration object
 * @param {boolean} lint Whether to lint the CSS files
 */
export const processCss = (config, lint = true) => {
    const paths = globSync(prefixPath(config.css.buildFiles, config.src));
    if (lint) {
        runStylelint(config)
            .then(() => {
                paths.forEach((filePath) => {
                    runPostCss(config, filePath);
                })
            });
    } else {
        paths.forEach((filePath) => {
            runPostCss(config, filePath);
        })
    }
}

/**
 * Process the css request
 * 
 * @param {object} config The configuration object
 * @param {string} action The action to take
 * @param {object} args The command line arguments
 */
export const cssHandler = (config, action, args) => {
    if (action === 'css') {
        if (typeof args.file === 'string') {
            if (args.lint) {
                runStylelint(config);
            }
            const filePath = getSrcPath(config, args.file);
            runPostCss(config, filePath);
        } else {
            processCss(config, args.lint);
        }
    } else if (action === 'lint') {
        if (typeof args.path === 'string') {
            const lintPath = getGlob(getSrcPath(config, args.path));
            runStylelint(config, lintPath);
        } else {
            runStylelint(config);
        }
    }
}