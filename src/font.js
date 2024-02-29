/* ===========================================================================
    Font file actions
=========================================================================== */

// Build files
import config from './config.js';
import { copyFile, copySrcToBuild, removeFileFromBuild } from './files.js';
import { prefixRootPath, prefixSrcPath, prefixThemeBuildPath } from './helpers.js';

/**
 * Copy the font file to the build folder
 * 
 * @param {string} path The font file path
 */
export const copyFontSrcToBuild = (path) => {
    const srcRoot = prefixRootPath(prefixSrcPath(config.data.fonts.src));
    copyFile(path, '', srcRoot, prefixThemeBuildPath(config.data.fonts.build));
}

/**
 * Removes a deleted font file from the build directory
 * 
 * @param {string} path The font file path
 */
export const removeFontFileFromBuild = (path) => {
    const destRoot = prefixThemeBuildPath(config.data.fonts.build);
    removeFileFromBuild(path, destRoot, 'font file');
}

/**
 * Process the export request
 */
const fontHandler = async (action) => {
    if (args.pull) {
        copyBuildToSrc(prefixThemeBuildPath(config.data.fonts.build), prefixSrcPath(config.data.fonts.src), 'fonts');
    } else if (action === 'push') {
        copySrcToBuild(prefixSrcPath(config.data.fonts.src), prefixThemeBuildPath(config.data.fonts.build), 'fonts');
    }
}

export default fontHandler;