/* ===========================================================================
    Image processing
    Based on https://github.com/1000ch/gulp-image/blob/main/lib/optimize.js
=========================================================================== */

import fs from 'fs-extra';
import chalk from 'chalk';
import fancyLog from 'fancy-log';
import { globSync } from 'glob';
import logSymbols from 'log-symbols';
import imageType, { minimumBytes } from 'image-type';
import { dirname, parse } from 'path';
import { readChunk } from 'read-chunk';
import sharp from 'sharp';
import { optimize } from 'svgo';

// Build files
import config from './config.js';
import { copySrcFileToThemeBuild, removeFileFromThemeBuild } from './files.js';
import { prefixPath, prefixRootSrcPath, prefixRootThemeBuildPath, removeRootPrefix, removePrefixes } from './helpers.js';

/**
 * Removes a deleted image file from the build directory
 * 
 * @param {string} path The image file path
 */
export const removeImageFileFromBuild = (path) => {
    removeFileFromThemeBuild(path, config.data.images.build, 'image');
}

/**
 * Optimize the SVG
 * 
 * @param {string} filePath The path to the SVG file
 * @returns {string}
 */
const optimizeSvg = (filePath) => {
    const result = optimize(fs.readFileSync(filePath, 'utf8'), {
        path: filePath,
        plugins: [
            'preset-default'
        ]
    });
    return result.data;
}

/**
 * Process the file name part of the path and clean up the file name and extension
 * 
 * @param {string} filePath The path to the file
 * @returns {string}
 */
const prepareFileName = (filePath) => {
    const parsed = parse(filePath);
    const name = parsed.name
        // Replace one or more spaces with a hyphen
        .replaceAll(/-? +/g, '-')
        // Remove all non-alphanumeric characters
        .replaceAll(/[^\w\-.]+/g, '');

    // Lowercase the file extension    
    const ext = parsed.ext.toLowerCase();

    // Return the path with the updated file name
    return `${parsed.dir}/${name}${ext}`;
}

/**
 * Get the optimization options for the jpg image
 * 
 * @returns {object}
 */
const getJpgOptimizations = () => {
    let opts = {
        mozjpeg: true,
        quality: 80,
        progressive: true
    };
    if (config.data.images.optimizations && config.data.images.optimizations.jpg) {
        opts = { ...opts, ...config.data.images.optimizations.jpg };
    }
    return opts;
}

/**
 * Get the optimization options for the png image
 * 
 * @returns {object}
 */
const getPngOptimizations = () => {
    let opts = {
        quality: 80,
        progressive: true,
        compressionLevel: 6,
        adaptiveFiltering: true
    };
    if (config.data.images.optimizations && config.data.images.optimizations.png) {
        opts = { ...opts, ...config.data.images.optimizations.png };
    }
    return opts;
}

/**
 * Get the optimization options for the webp image
 * 
 * @returns {object}
 */
const getWebPOptimizations = () => {
    let opts = {
        quality: 80,
        lossless: false,
        smartSubsample: true
    };
    if (config.data.images.optimizations && config.data.images.optimizations.webp) {
        opts = { ...opts, ...config.data.images.optimizations.webp };
    }
    return opts;
}

/**
 * Process the image and copy it to the build folder
 * 
 * @param {string} imageSrc The absolute path to the image
 */
export const processImage = async (imageSrc) => {
    const stat = fs.statSync(imageSrc);
    if (stat.isFile()) {
        // Get the path to the image within the images source folder
        const imagePath = removePrefixes(imageSrc, [config.data.root, config.data.src, config.data.images.src]);
        // Set up the destination path
        const destPath = prefixRootThemeBuildPath(config.data.images.build);
        const destImagePath = prepareFileName(prefixPath(imagePath, destPath));

        // Get the image file type. If it's an svg or not a supported image type then false is returned.
        // https://www.npmjs.com/package/image-type#supported-file-types
        const buffer = await readChunk(imageSrc, { length: minimumBytes });
        const fileType = await imageType(buffer);

        // Make sure that the destination folder for the image exists
        fs.ensureDirSync(dirname(destImagePath));


        // Process the image
        if (fileType && ['gif', 'jpg', 'jpeg', 'png', 'webp'].includes(fileType.ext)) {
            const { ext } = fileType;
            fancyLog(chalk.magenta(`Processing ${ext} image`), chalk.cyan(removeRootPrefix(imageSrc)), ' to ', chalk.cyan(removeRootPrefix(destImagePath)));
            const img = sharp(imageSrc);

            // Do the optimization
            if (ext === 'gif') {
                // See if we can optimize gifs. https://sharp.pixelplumbing.com/api-output#gif
                img.gif();
            } else if (['jpg', 'jpeg'].includes(ext)) {
                img.jpeg(getJpgOptimizations());
            } else if (ext === 'png') {
                img.png(getPngOptimizations());
            } else if (ext === 'webp') {
                img.webp(getWebPOptimizations());
            }

            // Write the image to the build folder
            img.toFile(destImagePath);
        } else {
            // const ext = parse(imageSrc).ext.replace('.', '').toLowerCase();
            const ext = parse(imageSrc).ext.toLowerCase();
            console.log('EXT: ', ext);
            // Check to see if the file extension is svg. If so process it.
            if (ext === 'svg') {
                fancyLog(chalk.magenta('Processing SVG image'), chalk.cyan(removeRootPrefix(imageSrc)), ' to ', chalk.cyan(removeRootPrefix(destImagePath)));
                const svg = optimizeSvg(imageSrc);
                fs.writeFileSync(destImagePath, svg);
            } else {
                // The file is not a gif, jpg, jpeg, png, or svg. 
                // It could be a different image format that can't be optimized or a different file type (like a txt file)
                // Just copy it to the build folder
                fancyLog(chalk.magenta('Copying unprocessed "image" file'), chalk.cyan(removeRootPrefix(imageSrc)), ' to ', chalk.cyan(removeRootPrefix(destImagePath)));
                copySrcFileToThemeBuild(imagePath, config.data.images.src, config.data.images.build);
            }
        }
    }
}

/**
 * Process all images in the images folder
 */
const processImages = async () => {
    const imageSrc = prefixRootSrcPath(config.data.images.src);
    // Get all the files in the images folder
    const files = globSync(`${imageSrc}/**/*`);
    if (files.length > 0) {
        fancyLog(chalk.magenta(`Processing ${files.length} files in the ${config.data.images.src} folder`));
        files.forEach((file) => {
            processImage(file);
        });
        fancyLog(logSymbols.success, chalk.green(`Done processing images`));
    } else {
        fancyLog(logSymbols.warning, chalk.yellow(`Nothing to process as there are no images found in the ${config.data.images.src} folder`));
    }
}

/**
 * Process the image request
 */
export const imageHandler = async (action) => {
    processImages();
}