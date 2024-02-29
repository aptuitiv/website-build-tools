/* ===========================================================================
    Export the files for copying to another website
=========================================================================== */

import { globSync } from 'glob';

// Build files
import { copyFile } from './copy.js';

/**
 * Copy the files to an export folder
 * 
 * @param {object} config The configuration object
 */
const exportFiles = async (config) => {
    const files = [
        config.src + '/**/*',
        '.editorconfig',
        '.eslintignore',
        '.eslintrc.cjs',
        '.gitignore',
        '.prettierignore',
        '.prettierrc.js',
        'package.json',
    ];

    files.forEach((copy) => {
        const filesToCopy = globSync(copy.src);
        if (filesToCopy.length > 0) {
            filesToCopy.forEach((file) => {
                let dest = file;
                if (file.startsWith('.')) {
                    // This is a config file in the root directory.
                    // Set the destination to the root directory
                    dest = '';
                }
                copyFile(config, file, dest, config.root, '_export');
            });
        }
    });
}

/**
 * Process the export request
 * 
 * @param {object} config The configuration object
 */
const exportHandler = async (config) => {
    exportFiles(config);
}

export default exportHandler;