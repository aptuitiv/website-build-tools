/* ===========================================================================
    Theme actions
=========================================================================== */


// Build files
import config from './src/config.js';
import { copyFile, copySrcToBuild, removeFileFromBuild } from './files.js';
import { prefixRootPath, prefixSrcPath, prefixThemeBuildPath } from './helpers.js';

export const copyFontSrcToBuild = (path) => {
    const srcRoot = prefixRootPath(config.data.themes.src);
    copyFile(path, '', srcRoot, prefixThemeBuildPath(config.data.themes.build));
}

/**
 * Removes a deleted theme file from the build directory
 * 
 * @param {object} config The configuration object
 * @param {string} path The template file path
 */
export const removeFontFileFromBuild = (path) => {
    const destRoot = prefixThemeBuildPath(config.data.themes.build);
    removeFileFromBuild(path, destRoot, 'theme file');
}

/**
 * Process the export request
 * 
 * @param {object} config The configuration object
 */
const themeHandler = async (action) => {
    if (action === 'copyAll') {
        copySrcToBuild(prefixSrcPath(config.data.themes.src), prefixThemeBuildPath(config.data.themes.build), 'themes');
    }
}

export default themeHandler;