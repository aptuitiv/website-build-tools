#! /usr/bin/env node

/* ===========================================================================
    Functions to work with template files
=========================================================================== */

// Build scripts
import config from './config.js';
import {
    copySrcFileToThemeBuild,
    copySrcFolderToBuild,
    removeFileFromThemeBuild,
} from './files.js';
import { prefixSrcPath, prefixThemeBuildPath } from './helpers.js';

/**
 * Copy a template file to the build folder
 *
 * @param {string} path The template file path
 */
export const copyTemplateSrcToBuild = (path) => {
    copySrcFileToThemeBuild(
        path,
        config.data.templates.src,
        config.data.templates.build,
    );
};

/**
 * Removes a deleted template file from the build directory
 *
 * @param {string} path The template file path
 */
export const removeTemplateFileFromBuild = (path) => {
    removeFileFromThemeBuild(
        path,
        config.data.templates.build,
        'template file',
    );
};

/**
 * Processs the template request
 */
export const pushTemplates = async () => {
    await copySrcFolderToBuild(
        prefixSrcPath(config.data.templates.src),
        prefixThemeBuildPath(config.data.templates.build),
        'templates',
        ['*.md'], // Skip any markdown files
    );
};
