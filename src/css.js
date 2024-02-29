/* ===========================================================================
    Process the CSS with PostCSS
    https://github.com/postcss/postcss

    This can be run from the command line.

    Process all files:
    node css.js -a

    Run stylelint on all files:
    node css.js -l

    Lint a specific file
    (The path must be within the config.css.base path)
    node css.js -l path/to/file.css

    Lint a glob of files
    (The path must be within the config.css.base path)
    node css.js -l path/to/*.css

    Process a specific file:
    (The path must be within the config.css.base path)
    node css.js -f main.css
    or
    node css.js -f src/css/main.css
=========================================================================== */

import fs from 'fs-extra';
import { Command } from 'commander';
import chalk from 'chalk';
import { globSync } from 'glob';
import fancyLog from 'fancy-log';
import logSymbols from 'log-symbols';
import * as path from 'path';
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
import { getGlob, prefixPath } from './helpers.js';

/**
 * Get the correct CSS source path within the CSS base directory
 *
 * @param {string} filePath The source path
 * @returns {string}
 */
const getSrcPath = (filePath) => {
    const basePath = path.dirname(config.css.base);
    return prefixPath(filePath, basePath);
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
 */
const runStylelint = async (fileGlob) => {
    const filesToLint = fileGlob || config.css.src;
    fancyLog(chalk.magenta('Stylelint'), chalk.cyan(filesToLint));
    const results = await stylelint.lint({
        files: filesToLint,
        formatter: "string"
    });
    console.log(results.output);
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
    const { base: fileName } = path.parse(filePath);
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
 */
const processCss = () => {
    runStylelint()
        .then(() => {
            const paths = globSync(config.css.base);
            paths.forEach((filePath) => {
                runPostCss(filePath);
            })
        });
}

/**
 * Parse the command lines arguments and call the correct deploy function
 */
const program = new Command();
program
    .option('-a, --all', 'Process all CSS files')
    .option('-l, --lint [fileGlob]', 'Lint CSS files. By default it lints all files. If you pass a file glob then only those files will be linted.')
    .option('-f, --file <filePath>', 'Process a specific file')

program.parse();
const options = program.opts();

if (Object.keys(options).length > 0) {
    if (options.all) {
        // Process all css files
        processCss();
    } else if (typeof options.file === 'string') {
        // Process a specific file
        const filePath = getSrcPath(options.file);
        if (options.lint) {
            runStylelint().then(() => {
                runPostCss(filePath);
            });
        } else {
            runPostCss(filePath);
        }
    } else if (options.lint) {
        // Stylelint
        if (typeof options.lint === 'string') {
            const lintPath = getGlob(getSrcPath(options.lint));
            console.log('lintPath: ', lintPath);
            runStylelint(lintPath);
        } else {
            runStylelint();
        }
    }
}

export default processCss;
