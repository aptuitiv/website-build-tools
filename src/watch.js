import chokidar from 'chokidar';
import chalk from 'chalk';
import fancyLog from 'fancy-log';

// Build scripts
import { deleteFile, deployFile } from './ftp.js';
import { processCss } from './css.js';
import { prefixPath, removePrefix } from './helpers.js';

/**
 * Process the watch request
 * @param {object} config The configuration object
 */
const watchHandler = async (config) => {
    // Watch dist files for any changes and FTP the changes to the website.
    // Do not delete a directory when unlinkDir is called. This is because
    // it's possible to inadvertantly delete all files on the server if the
    // dist folder is deleted.
    // If you want to delete a folder via FTP then run
    // aptuitiv-build delete -p path/to/folder
    const rootDistFolder = prefixPath(config.build.base, config.root);
    const distFolder = `${rootDistFolder}/**/*`;
    fancyLog(chalk.magenta('Watching for changes in the dist folder'), chalk.cyan(config.build.base));
    chokidar
        .watch(distFolder, { ignoreInitial: true })
        .on('add', (path) => { deployFile(config, removePrefix(path, rootDistFolder)); })
        .on('change', (path) => { deployFile(config, removePrefix(path, rootDistFolder)); })
        .on('unlink', (path) => { deleteFile(config, removePrefix(path, rootDistFolder)); });

    // Watch for any CSS changes
    const cssFolder = prefixPath(config.css.files, config.root);
    fancyLog(chalk.magenta('Watching for changes in the CSS folder'), chalk.cyan(config.css.base));
    chokidar
        .watch(cssFolder, { ignoreInitial: true })
        .on('all', () => { processCss(config) })
}

export default watchHandler;