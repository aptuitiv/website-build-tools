import chokidar from 'chokidar';
import chalk from 'chalk';
import fancyLog from 'fancy-log';
import { globSync } from 'glob';

// Build scripts
import { copyWatchFile } from './copy.js';
import { processCss } from './css.js';
import { deleteFile, deployFile } from './ftp.js';
import { prefixPath, removePrefix } from './helpers.js';
import { copyTemplateSrcToBuild, removeTemplateFileFromBuild } from './template.js';

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
        .on('all', () => { processCss(config) });

    // Watch for any template changes
    const rootTemplateFolder = `${prefixPath(config.template.src, config.root)}/`;
    const templateFolder = `${rootTemplateFolder}**/*`;
    fancyLog(chalk.magenta('Watching for changes in the template folder'), chalk.cyan(config.template.src));
    chokidar
        .watch(templateFolder, { ignoreInitial: true })
        .on('add', (path) => { copyTemplateSrcToBuild(config, removePrefix(path, rootTemplateFolder)); })
        .on('change', (path) => { copyTemplateSrcToBuild(config, removePrefix(path, rootTemplateFolder)); })
        .on('unlink', (path) => { removeTemplateFileFromBuild(config, removePrefix(path, rootTemplateFolder)); });

    // Watch an "copy" files
    const copyFilesToWatch = [];
    const copyFilesMap = {};
    config.copy.forEach((copy) => {
        if (typeof copy.dest === 'string' && copy.dest.length > 0) {
            let filesToCopy = [];
            if ((typeof copy.src === 'string' && copy.src.length > 0) || (Array.isArray(copy.src) && copy.src.length > 0)) {
                filesToCopy = globSync(copy.src);
            }
            if (filesToCopy.length > 0) {
                filesToCopy.forEach((file) => {
                    const sourceFile = prefixPath(file, config.root);
                    copyFilesToWatch.push(sourceFile);
                    copyFilesMap[sourceFile] = copy.dest;
                });
            }
        }
    });
    if (copyFilesToWatch.length > 0) {
        fancyLog(chalk.magenta('Watching for changes in the copy configuration source files'));
        // This is watching individual files so we're only going to process the "change" event.
        chokidar
            .watch(copyFilesToWatch, { ignoreInitial: true })
            .on('change', (path) => {
                copyWatchFile(config, path, copyFilesMap[path]);
            });
    }
}

export default watchHandler;