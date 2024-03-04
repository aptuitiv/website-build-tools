/* ===========================================================================
    Font file actions
=========================================================================== */

// Build files
import config from './config.js';
import {
    copyBuildFolderToSrc,
    copySrcFileToThemeBuild,
    copySrcFolderToBuild,
    removeFileFromThemeBuild,
} from './files.js';
import { prefixSrcPath, prefixThemeBuildPath } from './helpers.js';

/**
 * Copy the font file to the build folder
 *
 * @param {string} path The path to the file
 */
export const copyFontSrcToBuild = (path) => {
    copySrcFileToThemeBuild(
        path,
        config.data.fonts.src,
        config.data.fonts.build,
    );
};

/**
 * Removes a deleted font file from the build directory
 *
 * @param {string} path The font file path
 */
export const removeFontFileFromBuild = (path) => {
    removeFileFromThemeBuild(path, config.data.fonts.build, 'font file');
};

/**
 * Process the font request
 *
 * @param {string} action The action to take
 */
export const fontHandler = (action) => {
    if (action === 'pull') {
        copyBuildFolderToSrc(
            prefixThemeBuildPath(config.data.fonts.build),
            prefixSrcPath(config.data.fonts.src),
            'fonts',
        );
    } else if (action === 'push') {
        copySrcFolderToBuild(
            prefixSrcPath(config.data.fonts.src),
            prefixThemeBuildPath(config.data.fonts.build),
            'fonts',
        );
    }
};

export default fontHandler;
