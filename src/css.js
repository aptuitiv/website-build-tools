/* ===========================================================================
    Process the CSS with PostCSS
    https://github.com/postcss/postcss
=========================================================================== */

import fs from 'fs-extra';
import chalk from 'chalk';
import { globSync } from 'glob';
import fancyLog from 'fancy-log';
import logSymbols from 'log-symbols';
import { parse } from 'path';
import postcss from 'postcss';
import stylelint from 'stylelint';

// PostCSS plugins
import autoprefixer from 'autoprefixer';
import cssnano from 'cssnano';
import postcssCustomMedia from 'postcss-custom-media';
import postcssImport from 'postcss-import';
import postcssReporter from 'postcss-reporter';

// Build scripts
import config from './config.js';
import { getGlob, prefixPath, prefixRootPath, prefixSrcPath } from './helpers.js';

/**
 * Get the correct CSS source path within the CSS base directory
 *
 * @param {string} filePath The source path
 * @returns {string}
 */
const getSrcPath = (filePath) => {
    const sourcePath = prefixSrcPath(config.data.css.base);
    const basePath = prefixRootPath(sourcePath);
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
 * @param {string} [fileGlob] The file glob to lint
 */
const runStylelint = async (fileGlob) => {
    const filesToLint = fileGlob || prefixSrcPath(config.data.css.files);
    let options = {
        files: filesToLint,
        formatter: "string"
    }
    options = { ...options, ...config.data.stylelint };

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
 * @param {string} filePath The path of the CSS file to process
 */
const runPostCss = (filePath) => {
    const { base: fileName } = parse(filePath);
    const destDir = `${config.data.build.theme}/css`;
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
 * @param {boolean} lint Whether to lint the CSS files
 */
export const processCss = (lint = true) => {
    const paths = globSync(prefixSrcPath(config.data.css.buildFiles));
    if (lint) {
        runStylelint()
            .then(() => {
                paths.forEach((filePath) => {
                    runPostCss(filePath);
                })
            });
    } else {
        paths.forEach((filePath) => {
            runPostCss(filePath);
        })
    }
}

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
}