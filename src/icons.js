/* ===========================================================================
    Icon actions
=========================================================================== */

import fs from 'fs-extra';
import { globSync } from 'glob';
import { dirname } from 'path';
import chalk from 'chalk';
import fancyLog from 'fancy-log';
import isSvg from 'is-svg';
import logSymbols from 'log-symbols';
import Sprite from 'svg-sprite';

// Build files
import config from './config.js';
import {
    prefixPath, prefixRootSrcPath, removePrefix, removeRootSrcPrefix,
} from './helpers.js';
import { isObjectWithValues, isStringWithValue } from './lib/types.js';

/**
 * Create the icon sprite
 *
 * @param {string} srcFolderPath  The path to the icon source folder. i.e. "icons".
 * @param {string} outputPath The path to the output file. i.e. "snippets/svg-icons.twig".
 * @returns {Promise}
 */
export const createIconSprite = async (srcFolderPath, outputPath) => {
    // Get the absolute path to the icons folder
    const iconPath = prefixRootSrcPath(srcFolderPath);
    let buildPath = prefixRootSrcPath(
        prefixPath(outputPath, config.data.templates.src),
    );
    if (!buildPath.endsWith('.twig')) {
        buildPath = `${buildPath}.twig`;
    }
    fancyLog(
        chalk.magenta('Creating icon sprite from folder'),
        chalk.cyan(removeRootSrcPrefix(iconPath)),
        chalk.magenta('to file'),
        chalk.cyan(removeRootSrcPrefix(buildPath))
    );

    // Get all the svg files in the icons folder
    const files = globSync(`${iconPath}/**/*.svg`);

    // Set up the sprite generator
    const spriteObj = new Sprite({
        mode: {
            symbol: {
                inline: true,
            },
        },
        shape: {
            id: {
                // SVG shape ID related options
                separator: '-', // Separator for directory name traversal
                generator: 'icon-%s',
            },
            transform: [
                {
                    svgo: {
                        // https://svgo.dev/docs/plugins/
                        plugins: ['preset-default', 'removeXMLNS'],
                    },
                },
            ],
        },
    });

    // Add each file to the sprite generator
    files.forEach((file) => {
        const stat = fs.statSync(file);
        if (stat.isFile()) {
            // Get the base path to the file within the icons folder.
            // This handles situations where the file may be in a nested subfolder.
            // In that case, the id will include the folder path.
            const filePath = removePrefix(file, `${iconPath}/`);
            const contents = fs.readFileSync(file, 'utf-8');
            if (isSvg(contents)) {
                spriteObj.add(file, filePath, contents);
            }
        }
    });
    try {
        // Generate the sprite
        const { data } = await spriteObj.compileAsync();

        // Make sure that the build folder folder exists
        fs.ensureDirSync(dirname(buildPath));

        // The result sprite contains some code that we don't want so we use
        // the data object to get the svg code for each icon and build the sprite.
        const stream = fs.createWriteStream(buildPath, { flags: 'w' });
        stream.write(
            '<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">',
        );
        data.symbol.shapes.forEach((shape) => {
            stream.write(shape.svg);
        });
        stream.write('</svg>');
        stream.end();
        fancyLog(logSymbols.success, chalk.green('Done creating icon sprite'));
    } catch (error) {
        // eslint-disable-next-line no-console -- Need to output the error
        console.error(error);
    }
};

/**
 * Process all the icon folders, or a single folder
 *
 * @param {object} args The command line arguments, if there are any
 * @returns {Promise}
 */
const processIcons = async (args) => new Promise((resolve) => {
    const promises = [];
    if (isObjectWithValues(args)) {
        if (isStringWithValue(args.path) && isStringWithValue(args.output)) {
            promises.push(createIconSprite(args.path, args.output));
        } else if (isStringWithValue(args.path)) {
            config.data.icons.forEach((iconConfig) => {
                if (isStringWithValue(iconConfig.src) && iconConfig.src === args.path) {
                    promises.push(createIconSprite(iconConfig.src, iconConfig.build));
                }
            });
            if (promises.length === 0) {
                fancyLog(
                    logSymbols.error,
                    chalk.red(`The path "${args.path}" was not found in the icons configuration`),
                );
            }
        } else {
            fancyLog(
                logSymbols.error,
                chalk.red(`The "path" and "output" arguments are required. You passed: ${Object.keys(args).join(', ')}`),
            );
        }
    } else if (Array.isArray(config.data.icons)) {
        config.data.icons.forEach((iconConfig) => {
            if (isStringWithValue(iconConfig.src) && isStringWithValue(iconConfig.build)) {
                promises.push(createIconSprite(iconConfig.src, iconConfig.build));
            }
        });
    }
    Promise.all(promises).then(() => {
        resolve();
    });
});

/**
 * Process the icon request
 *
 * @param {object} args The command line arguments
 */
export const iconHandler = async (args) => {
    await processIcons(args);
};
