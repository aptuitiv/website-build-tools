#! /usr/bin/env node

/* ===========================================================================
    Functions to work with template files
=========================================================================== */

import chalk from 'chalk';
import fancyLog from 'fancy-log';
import logSymbols from 'log-symbols';

// Build scripts
import config from './config.js';
import { copyBuildToSrc, copyFile, copySrcToBuild, removeFileFromBuild } from './files.js';
import { prefixRootSrcPath, prefixSrcPath, prefixThemeBuildPath } from './helpers.js';

/**
 * Copy a template file to the build folder
 * 
 * @param {string} path The template file path
 */
export const copyTemplateSrcToBuild = (path) => {
    const srcRoot = prefixRootSrcPath(config.data.templates.src);
    copyFile(path, '', srcRoot, prefixThemeBuildPath(config.data.templates.build));
}

/**
 * Removes a deleted template file from the build directory
 * 
 * @param {string} path The template file path
 */
export const removeTemplateFileFromBuild = (path) => {
    const destRoot = prefixThemeBuildPath(config.data.templates.build);
    removeFileFromBuild(path, destRoot, 'template file');
}

/**
 * Processs the template request
 * 
 * @param {string} action The action to take
 */
export const templateHandler = (action) => {
    if (action === 'pull') {
        copyBuildToSrc(prefixThemeBuildPath(config.data.templates.build), prefixSrcPath(config.data.templates.src), 'templates');
    } else if (action === 'push') {
        copySrcToBuild(prefixSrcPath(config.data.templates.src), prefixThemeBuildPath(config.data.templates.build), 'templates');
    }
}
