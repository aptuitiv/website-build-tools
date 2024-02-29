/* ===========================================================================
    Theme actions
=========================================================================== */


// Build files
import config from './config.js';
import { copyBuildToSrc, copyFile, copySrcToBuild, removeFileFromBuild } from './files.js';
import { prefixRootSrcPath, prefixSrcPath, prefixThemeBuildPath } from './helpers.js';

/**
 * Copy the theme file to the build folder
 * 
 * @param {string} path The file path
 */
export const copyThemeSrcToBuild = (path) => {
    const srcRoot = prefixRootSrcPath(config.data.themeConfig.src);
    copyFile(path, '', srcRoot, prefixThemeBuildPath(config.data.themeConfig.build));
}

/**
 * Removes a deleted theme config file from the build directory
 * 
 * @param {string} path The file path
 */
export const removeThemeFileFromBuild = (path) => {
    const destRoot = prefixThemeBuildPath(config.data.themeConfig.build);
    removeFileFromBuild(path, destRoot, 'theme file');
}

/**
 * Process the theme request
 * 
 * @param {string} action The action to take
 */
export const themeHandler = async (action) => {
    if (action === 'pull') {
        copyBuildToSrc(prefixThemeBuildPath(config.data.themeConfig.build), prefixSrcPath(config.data.themeConfig.src), 'theme config files');
    } else if (action === 'push') {
        copySrcToBuild(prefixSrcPath(config.data.themeConfig.src), prefixThemeBuildPath(config.data.themeConfig.build), 'theme config files');
    }
}

export default themeHandler;