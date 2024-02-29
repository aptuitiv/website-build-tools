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
import { prefixRootPath, prefixSrcPath, prefixThemeBuildPath } from './helpers.js';

/**
 * Copy a template file to the build folder
 * 
 * @param {object} config The configuration object
 * @param {string} path The template file path
 */
export const copyTemplateSrcToBuild = (path) => {
    const srcRoot = prefixRootPath(config.data.templates.src);
    copyFile(path, '', srcRoot, prefixThemeBuildPath(config.data.templates.build));
}

/**
 * Removes a deleted template file from the build directory
 * 
 * @param {object} config The configuration object
 * @param {string} path The template file path
 */
export const removeTemplateFileFromBuild = (path) => {
    const destRoot = prefixThemeBuildPath(config.data.templates.build);
    removeFileFromBuild(path, destRoot, 'template file');
}

/**
 * Processs the template request
 * 
 * @param {object} config The configuration object
 * @param {object} args The command line arguments from calling admin
 */
export const templateHandler = (args) => {
    if (args.pull) {
        copyBuildToSrc(prefixThemeBuildPath(config.data.templates.build), prefixSrcPath(config.data.templates.src), 'templates');
    } else if (args.push) {
        copySrcToBuild(prefixSrcPath(config.data.templates.src), prefixThemeBuildPath(config.data.templates.build), 'templates');
    } else {
        fancyLog(logSymbols.error, chalk.red('No action specified'));
    }
}
