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
import { prefixPath, prefixRootSrcPath, removePrefix } from './helpers.js';

/**
 * Create the icon sprite
 *
 * @returns {Promise}
 */
export const createIconSprite = async () => {
    fancyLog(chalk.magenta('Creating icon sprite'));
    // Get the absolute path to the icons folder
    const iconPath = prefixRootSrcPath(config.data.icons.src);

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

        // Set up the build path and make sure that the folder exists
        const buildPath = prefixRootSrcPath(
            prefixPath(config.data.icons.build, config.data.templates.src),
        );
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
 * Process the icon request
 */
export const iconHandler = async () => {
    await createIconSprite();
};
