/* ===========================================================================
    Pull the theme files from the build directory to the source directory
=========================================================================== */

// Build scripts
import config from './config.js';
import { copyBuildFolderToSrc, copySrcFileToThemeBuild } from './files.js';
import {
    prefixBuildPath,
    prefixSrcPath,
    prefixThemeBuildPath,
} from './helpers.js';
import { logError } from './lib/log.js';
import { isStringWithValue } from './lib/types.js';

/**
 * Pull a specific directory from the build directory to the source directory
 *
 * This will pull the files from the build directory to the same folder in the source directory.
 *
 * @param {object} args The arguments from the command line
 */
export const pullHandler = async (args) => {
    const path = args?.path;
    if (!isStringWithValue(path)) {
        logError(
            'You must provide a path to pull. For example: aptuitiv-build pull -p theme/custom/templates',
        );
        return;
    }
    const buildPath = prefixBuildPath(path);
    await copyBuildFolderToSrc(buildPath, path, path);
};

/**
 * Pull the fonts from the build theme directory to the source theme directory
 */
export const pullFonts = async () => {
    await copyBuildFolderToSrc(
        prefixThemeBuildPath(config.data.fonts.build),
        prefixSrcPath(config.data.fonts.src),
        'fonts',
    );
};

/**
 * Pull the images from the build theme directory to the source theme directory
 */
export const pullImages = async () => {
    await copyBuildFolderToSrc(
        prefixThemeBuildPath(config.data.images.build),
        prefixSrcPath(config.data.images.src),
        'images',
    );
};

/**
 * Pull the templates from the build directory to the source directory
 */
export const pullTemplates = async () => {
    await copyBuildFolderToSrc(
        prefixThemeBuildPath(config.data.templates.build),
        prefixSrcPath(config.data.templates.src),
        'templates',
    );
};

/**
 * Pull the theme config files from the build directory to the source directory
 */
export const pullThemeConfig = async () => {
    await copyBuildFolderToSrc(
        prefixThemeBuildPath(config.data.themeConfig.build),
        prefixSrcPath(config.data.themeConfig.src),
        'theme config files',
    );
    copySrcFileToThemeBuild(
        'theme.json',
        config.data.src,
        config.data.build.theme,
    );
};
