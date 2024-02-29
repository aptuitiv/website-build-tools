import chokidar from 'chokidar';
import chalk from 'chalk';
import fancyLog from 'fancy-log';
import { globSync } from 'glob';

// Build scripts
import config from './config.js';
import { copyWatchFile } from './copy.js';
import { processCss } from './css.js';
import { copyFontSrcToBuild, removeFontFileFromBuild } from './font.js';
import { deleteFile, deployFile } from './ftp.js';
import { prefixRootPath, prefixRootSrcPath, prefixSrcPath, removePrefix } from './helpers.js';
import { copyTemplateSrcToBuild, removeTemplateFileFromBuild } from './template.js';
import { copyThemeSrcToBuild, removeThemeFileFromBuild } from './theme.js';

/**
 * Process the watch request
 */
const watchHandler = async () => {
    // Watch dist files for any changes and FTP the changes to the website.
    // Do not delete a directory when unlinkDir is called. This is because
    // it's possible to inadvertantly delete all files on the server if the
    // dist folder is deleted.
    // If you want to delete a folder via FTP then run
    // aptuitiv-build delete -p path/to/folder
    const rootDistFolder = prefixRootPath(config.data.build.base);
    const distFolder = `${rootDistFolder}/**/*`;
    fancyLog(chalk.magenta('Watching for changes in the dist folder'), chalk.cyan(config.data.build.base));
    chokidar
        .watch(distFolder, { ignoreInitial: true })
        .on('add', (path) => { deployFile(removePrefix(path, rootDistFolder)); })
        .on('change', (path) => { deployFile(removePrefix(path, rootDistFolder)); })
        .on('unlink', (path) => { deleteFile(removePrefix(path, rootDistFolder)); });

    // Watch for any CSS changes
    const cssFolder = prefixRootSrcPath(config.data.css.files);
    fancyLog(chalk.magenta('Watching for changes in the CSS folder'), chalk.cyan(prefixSrcPath(config.data.css.base)));
    chokidar
        .watch(cssFolder, { ignoreInitial: true })
        .on('all', () => { processCss() });

    // Watch for any font changes
    const fontSrcFolder = prefixSrcPath(config.data.fonts.src);
    const rootFontFolder = `${prefixRootPath(fontSrcFolder)}/`;
    const fontFolder = `${rootFontFolder}**/*`;
    fancyLog(chalk.magenta('Watching for changes in the font folder'), chalk.cyan(fontSrcFolder));
    chokidar
        .watch(fontFolder, { ignoreInitial: true })
        .on('add', (path) => { copyFontSrcToBuild(removePrefix(path, rootFontFolder)); })
        .on('change', (path) => { copyFontSrcToBuild(removePrefix(path, rootFontFolder)); })
        .on('unlink', (path) => { removeFontFileFromBuild(removePrefix(path, rootFontFolder)); });

    // Watch for any template changes
    const templateSrcFolder = prefixSrcPath(config.data.templates.src);
    const rootTemplateFolder = `${prefixRootPath(templateSrcFolder)}/`;
    const templateFolder = `${rootTemplateFolder}**/*`;
    fancyLog(chalk.magenta('Watching for changes in the template folder'), chalk.cyan(templateSrcFolder));
    chokidar
        .watch(templateFolder, { ignoreInitial: true })
        .on('add', (path) => { copyTemplateSrcToBuild(removePrefix(path, rootTemplateFolder)); })
        .on('change', (path) => { copyTemplateSrcToBuild(removePrefix(path, rootTemplateFolder)); })
        .on('unlink', (path) => { removeTemplateFileFromBuild(removePrefix(path, rootTemplateFolder)); });

    // Watch for any theme file changes
    const themeSrcFolder = prefixSrcPath(config.data.themeConfig.src);
    const rootThemeFolder = `${prefixRootPath(themeSrcFolder)}/`;
    const themeFolder = `${rootThemeFolder}**/*`;
    fancyLog(chalk.magenta('Watching for changes in the theme folder'), chalk.cyan(themeSrcFolder));
    chokidar
        .watch(themeFolder, { ignoreInitial: true })
        .on('add', (path) => { copyThemeSrcToBuild(removePrefix(path, rootThemeFolder)); })
        .on('change', (path) => { copyThemeSrcToBuild(removePrefix(path, rootThemeFolder)); })
        .on('unlink', (path) => { removeThemeFileFromBuild(removePrefix(path, rootThemeFolder)); });

    // Watch an "copy" files
    const copyFilesToWatch = [];
    const copyFilesMap = {};
    config.data.copy.forEach((copy) => {
        if (typeof copy.dest === 'string' && copy.dest.length > 0) {
            let filesToCopy = [];
            if ((typeof copy.src === 'string' && copy.src.length > 0) || (Array.isArray(copy.src) && copy.src.length > 0)) {
                filesToCopy = globSync(copy.src);
            }
            if (filesToCopy.length > 0) {
                filesToCopy.forEach((file) => {
                    const sourceFile = prefixRootPath(file);
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
                copyWatchFile(path, copyFilesMap[path]);
            });
    }
}

export default watchHandler;