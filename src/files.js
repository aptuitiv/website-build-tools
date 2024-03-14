/* ===========================================================================
    File helper functions
=========================================================================== */

import fs from 'fs-extra';
import chalk from 'chalk';
import fancyLog from 'fancy-log';
import logSymbols from 'log-symbols';
import { parse } from 'path';
import recursiveReadDir from 'recursive-readdir';

// Buld files
import {
    prefixPath,
    prefixRootPath,
    prefixRootThemeBuildPath,
    prefixRootSrcPath,
    prefixThemeBuildPath,
    prefixSrcPath,
    removeRootSrcPrefix,
    removeRootPrefix,
} from './helpers.js';

/**
 * Get the file name for the file path
 *
 * @param {string} path The file path
 * @returns {string}
 */
export const getFileName = (path) => {
    const parsed = parse(path);
    return parsed.base;
};

/**
 * Get the root path for the file
 *
 * @param {string} path The file path in the src folder
 * @param {string} filename The file name
 * @returns {string}
 */
const getRootPath = (path, filename) => prefixPath(filename, prefixRootPath(path));

/**
 * Get the root src path for the file
 *
 * @param {string} path The file path in the src folder
 * @param {string} filename The file name
 * @returns {string}
 */
const getRootSrcPath = (path, filename) => prefixPath(filename, prefixRootSrcPath(path));

/**
 * Get the src path for the file
 *
 * @param {string} path The file path in the src folder
 * @param {string} filename The file name
 * @returns {string}
 */
const getSrcPath = (path, filename) => prefixPath(filename, prefixSrcPath(path));

/**
 * Get the root theme build path for the file
 *
 * @param {string} path The file path in the theme build folder
 * @param {string} filename The file name
 * @returns {string}
 */
const getRootThemeBuildPath = (path, filename) => prefixPath(filename, prefixRootThemeBuildPath(path));

/**
 * Get the theme build path for the file
 *
 * @param {string} path The file path in the theme build folder
 * @param {string} filename The file name
 * @returns {string}
 */
const getThemeBuildPath = (path, filename) => prefixPath(filename, prefixThemeBuildPath(path));

/**
 * Copy a file from the source path to the destination path
 *
 * @param {string} src The source path to the file
 * @param {string} dest The destination path to the file
 * @param {string} msgSrc The message to display for the source path
 * @param {string} msgDest The message to display for the destination path
 */
const copyFile = (src, dest, msgSrc, msgDest) => {
    if (fs.existsSync(src)) {
        const stat = fs.statSync(src);
        if (stat.isFile()) {
            fs.copySync(src, dest);
            fancyLog(
                logSymbols.success,
                chalk.green('Copied'),
                chalk.cyan(msgSrc),
                chalk.green('to'),
                chalk.cyan(msgDest),
            );
        }
    } else {
        fancyLog(
            logSymbols.warning,
            chalk.yellow(
                'Nothing to copy because the source file does not exist',
            ),
            chalk.cyan(msgSrc),
        );
    }
};

/**
 * Copy the file from the source path to the theme build path
 *
 * @param {string} path The path to the file
 * @param {string} srcPath The source path to the file in the "src" folder
 * @param {string} destPath The destination path to the file in the "build" folder
 */
export const copySrcFileToThemeBuild = (path, srcPath, destPath) => {
    // Get the path to the file without the root path, root source path, and the srcPath value
    const filePath = removeRootSrcPrefix(path, [srcPath]);

    // Get the paths to the source and destination files
    const copySrc = getRootSrcPath(srcPath, filePath);
    const copyDest = getRootThemeBuildPath(destPath, filePath);

    // Get the message paths for the source and destination file paths
    const msgSrc = getSrcPath(srcPath, filePath);
    const msgDest = getThemeBuildPath(destPath, filePath);

    copyFile(copySrc, copyDest, msgSrc, msgDest);
};

/**
 * Copy the file from the specified path to the theme build path
 *
 * @param {string} path The path to the file not including the root path. Includes the file name.
 * @param {string} srcRoot The root path to the source file. This is used to remove the root path from the file path to help
 *      build the correct destination path. This is useful when the source path was originally a glob pattern.
 * @param {string} destPath The destination path to the file in the "build" folder
 */
export const copyFileToThemeBuild = (path, srcRoot, destPath) => {
    // Get the file name
    const filePath = removeRootPrefix(path, [srcRoot]);

    // Get the paths to the source and destination files
    const copySrc = prefixRootPath(path);
    const copyDest = getRootThemeBuildPath(destPath, filePath);

    // Get the message paths for the source and destination file paths
    const msgSrc = path;
    const msgDest = getThemeBuildPath(destPath, filePath);

    copyFile(copySrc, copyDest, msgSrc, msgDest);
};

/**
 * Copy the file from the specified path to the specified destination
 *
 * @param {string} path The path to the file not including the root path. Includes the file name.
 * @param {string} destPath The destination path to the file in the "build" folder
 */
export const copyFileToDest = (path, destPath) => {
    // Get the file name
    const filename = getFileName(path);

    // Get the paths to the source and destination files
    const copySrc = prefixRootPath(path);
    const copyDest = getRootPath(destPath, filename);

    // Get the message paths for the source and destination file paths
    const msgSrc = path;
    const msgDest = prefixPath(filename, destPath);

    copyFile(copySrc, copyDest, msgSrc, msgDest);
};

/**
 * Copy the files from a folder to another folder
 *
 * @param {string} srcPath The path to the source folder. This is not an absolute path.
 * @param {string} destPath The destination path in the build folder. This is not an absolute path.
 * @param {string} startMessage The message to display when starting the copy
 * @param {string} successMessage The message to display when the copy is successful
 * @param {string[]} skipFiles The files to skip when copying. This can be an array of file names, or glob patterns.
 *      See https://www.npmjs.com/package/recursive-readdir for more information.
 */
const copyFolder = async (srcPath, destPath, startMessage, successMessage, skipFiles = []) => {
    fancyLog(chalk.magenta(startMessage));
    if (fs.existsSync(prefixRootPath(srcPath))) {
        await recursiveReadDir(prefixRootPath(srcPath), skipFiles)
            .then((files) => {
                if (Array.isArray(files) && files.length > 0) {
                    files.forEach((file) => {
                        const fileWithoutRoot = removeRootPrefix(file, [srcPath]);
                        const fileDest = getRootPath(destPath, fileWithoutRoot);
                        fancyLog(chalk.cyan(`Copying ${removeRootPrefix(file)}`), '=>', chalk.cyan(prefixPath(fileWithoutRoot, destPath)));
                        fs.copySync(file, fileDest);
                    });
                    fancyLog(logSymbols.success, chalk.green(successMessage));
                } else {
                    let msg = `Nothing to copy because ${srcPath} is empty`;
                    if (skipFiles.length > 0) {
                        msg += ` or there are no files that don't match the skip patterns: ${skipFiles.join(', ')}`;
                    }
                    fancyLog(
                        logSymbols.warning,
                        chalk.yellow(msg),
                    );
                }
            })
            .catch((err) => {
                // eslint-disable-next-line no-console -- Need to output the error message
                console.error('Error reading files: ', err);
            });
    } else {
        fancyLog(
            logSymbols.warning,
            chalk.yellow(`Nothing to copy because ${srcPath} does not exist`),
        );
    }
};

/**
 * Copy the files from the build folder to the src folder
 *
 * @param {string} srcPath The path to the source folder. This is not an absolute path.
 * @param {string} destPath The destination path in the build folder. This is not an absolute path.
 * @param {string} type The type of file being copied
 * @param {string[]} skipFiles The files to skip when copying. This can be an array of file names, or glob patterns.
 *      See https://www.npmjs.com/package/recursive-readdir for more information.
 */
export const copyBuildFolderToSrc = async (srcPath, destPath, type, skipFiles = []) => {
    await copyFolder(
        srcPath,
        destPath,
        `Copying ${type} from build folder to source folder`,
        `Done copying ${type} from build folder to source folder`,
        skipFiles,
    );
};

/**
 * Copy all the files from the src folder to the build folder
 *
 * @param {string} srcPath The path to the source folder. This is not an absolute path.
 * @param {string} destPath The destination path in the build folder. This is not an absolute path.
 * @param {string} type The type of file being copied
 * @param {string[]} skipFiles The files to skip when copying. This can be an array of file names, or glob patterns.
 *      See https://www.npmjs.com/package/recursive-readdir for more information.
 */
export const copySrcFolderToBuild = async (srcPath, destPath, type, skipFiles = []) => {
    await copyFolder(
        srcPath,
        destPath,
        `Copying ${type} from source folder to build folder`,
        `Done copying ${type} from source folder to build folder`,
        skipFiles,
    );
};

/**
 * Remove the file
 *
 * @param {string} path The path to the file to remove
 * @param {string} msgPath The path to use in the log messages
 * @param {string} itemType The type of item to remove. Used in the messaging.
 * @param {string} folderName The descriptive name for the folder. used in the messaging.
 */
const removeFile = (path, msgPath, itemType, folderName) => {
    if (fs.existsSync(path)) {
        fs.removeSync(path);
        fancyLog(
            logSymbols.success,
            chalk.green(
                `Done removing ${itemType} from the ${folderName} folder`,
            ),
            chalk.cyan(msgPath),
        );
    } else {
        fancyLog(
            logSymbols.warning,
            chalk.yellow(
                `Nothing to remove because the file does not exist in the ${folderName} folder`,
            ),
            chalk.cyan(msgPath),
        );
    }
};

/**
 * Removes the file from the theme build folder
 *
 * @param {string} path The path to th efile
 * @param {string} buildPath The path to the file in the theme build folder
 * @param {string} itemType The type of item to remove. Used in the messaging.
 */
export const removeFileFromThemeBuild = (path, buildPath, itemType) => {
    const filename = getFileName(path);
    const removePath = getRootThemeBuildPath(buildPath, filename);
    const msgPath = getThemeBuildPath(buildPath, filename);
    removeFile(removePath, msgPath, itemType, 'theme build');
};
