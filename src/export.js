/* ===========================================================================
    Export the files for copying to another website
=========================================================================== */

import { globSync } from 'glob';

// Build files
import config from './config.js';
import { copyFileToDest } from './files.js';
import { prefixPath } from './helpers.js';

/**
 * Copy the files to an export folder
 */
const exportFiles = async () => {
    const files = [
        `${config.data.src}/**/*`,
        '.aptuitiv-buildrc.js',
        '.editorconfig',
        '.gitignore',
        '.prettierignore',
        '.prettierrc.cjs',
        '.prettierrc.js',
        'LICENSE',
        'package.json',
        'package-lock.json',
        'README.md',
    ];

    files.forEach((copy) => {
        const filesToCopy = globSync(copy);
        if (filesToCopy.length > 0) {
            filesToCopy.forEach((file) => {
                let dest = file;
                if (file.indexOf('/') === -1) {
                    // This is a file in the root directory.
                    // Set the destination to the root directory
                    dest = '';
                }
                copyFileToDest(file, prefixPath(dest, '_export'));
            });
        }
    });
};

/**
 * Process the export request
 */
const exportHandler = async () => {
    exportFiles();
};

export default exportHandler;
