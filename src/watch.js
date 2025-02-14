import chokidar from 'chokidar';
import chalk from 'chalk';
import fancyLog from 'fancy-log';

// Build scripts
import config from './config.js';
import { copyWatchFile, prepareCopyData } from './copy.js';
import { processCss } from './css.js';
import { copyFontSrcToBuild, removeFontFileFromBuild } from './font.js';
import { deleteFile, deployFile } from './ftp.js';
import {
    prefixRootPath,
    prefixRootSrcPath,
    prefixSrcPath,
    removePrefix,
} from './helpers.js';
import { createIconSprite } from './icons.js';
import { processImage, removeImageFileFromBuild } from './image.js';
import { processJsFile } from './javascript.js';
import {
    copyTemplateSrcToBuild,
    removeTemplateFileFromBuild,
} from './template.js';
import { copyThemeSrcToBuild, removeThemeFileFromBuild } from './theme.js';
import { isStringWithValue } from './lib/types.js';

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
    const distFolder = rootDistFolder;
    fancyLog(
        chalk.magenta('Watching for changes in the dist folder'),
        chalk.cyan(config.data.build.base),
    );
    chokidar
        .watch(distFolder, {
            ignoreInitial: true,
            // Wait for 500ms before deploying the file. This is to prevent
            // deploying a file that is still being written to.
            // https://github.com/paulmillr/chokidar?tab=readme-ov-file#performance
            // Also, sometimes chokidar detects multiple changes on a file, even if it's small.
            // This is intended to prevent uploading the file multiple times.
            awaitWriteFinish: { stabilityThreshold: 500 },
        })
        .on('add', (path) => {
            deployFile(removePrefix(path, rootDistFolder));
        })
        .on('change', (path) => {
            deployFile(removePrefix(path, rootDistFolder));
        })
        .on('unlink', (path) => {
            deleteFile(removePrefix(path, rootDistFolder));
        });

    // Watch for any CSS changes
    const cssFolder = prefixRootSrcPath(config.data.css.src);
    fancyLog(
        chalk.magenta('Watching for changes in the CSS folder'),
        chalk.cyan(prefixSrcPath(config.data.css.src)),
    );
    chokidar.watch(cssFolder, {
        // Only watch CSS files
        // https://github.com/paulmillr/chokidar?tab=readme-ov-file#upgrading
        ignored: (path, stats) => stats?.isFile() && !path.endsWith('.css'),
        ignoreInitial: true,
    }).on('all', () => {
        processCss();
    });

    // Watch for any font changes
    const fontSrcFolder = prefixSrcPath(config.data.fonts.src);
    const fontFolder = prefixRootPath(fontSrcFolder);
    fancyLog(
        chalk.magenta('Watching for changes in the font folder'),
        chalk.cyan(fontSrcFolder),
    );
    chokidar
        .watch(fontFolder, { ignoreInitial: true })
        .on('add', (path) => {
            copyFontSrcToBuild(path);
        })
        .on('change', (path) => {
            copyFontSrcToBuild(path);
        })
        .on('unlink', (path) => {
            removeFontFileFromBuild(path);
        });

    // Watch for any CSS changes
    const jsfolder = prefixRootSrcPath(config.data.javascript.src);
    fancyLog(
        chalk.magenta('Watching for changes in the Javascript folder'),
        chalk.cyan(prefixSrcPath(config.data.javascript.src)),
    );
    chokidar.watch(jsfolder, {
        // Only watch JS files
        // https://github.com/paulmillr/chokidar?tab=readme-ov-file#upgrading
        ignored: (path, stats) => stats?.isFile() && !/\.js$|\.cjs$|\.mjs$/.test(path),
        ignoreInitial: true,
    }).on('all', (event, path) => {
        processJsFile(path);
    });

    // Watch for any icon changes
    if (Array.isArray(config.data.icons)) {
        config.data.icons.forEach((iconConfig) => {
            if (isStringWithValue(iconConfig.src) && isStringWithValue(iconConfig.build)) {
                const iconFolder = prefixRootSrcPath(iconConfig.src);
                fancyLog(
                    chalk.magenta('Watching for changes in the icons folder'),
                    chalk.cyan(prefixSrcPath(iconConfig.src)),
                );
                chokidar.watch(iconFolder, {
                    // Only watch SVG files
                    // https://github.com/paulmillr/chokidar?tab=readme-ov-file#upgrading
                    ignored: (path, stats) => stats?.isFile() && !path.endsWith('.svg'),
                    ignoreInitial: true,
                }).on('all', () => {
                    createIconSprite(iconConfig.src, iconConfig.build);
                });
            }
        });
    }

    // Watch for any image file changes
    const imageSrcFolder = prefixSrcPath(config.data.images.src);
    const imageFolder = prefixRootPath(imageSrcFolder);
    fancyLog(
        chalk.magenta('Watching for changes in the images folder'),
        chalk.cyan(imageSrcFolder),
    );
    chokidar
        .watch(imageFolder, { ignoreInitial: true })
        .on('add', (path) => {
            processImage(path);
        })
        .on('change', (path) => {
            processImage(path);
        })
        .on('unlink', (path) => {
            removeImageFileFromBuild(path);
        });

    // Watch for any template file changes
    const templateSrcFolder = prefixSrcPath(config.data.templates.src);
    const templateFolder = prefixRootPath(templateSrcFolder);
    fancyLog(
        chalk.magenta('Watching for changes in the template folder'),
        chalk.cyan(templateSrcFolder),
    );
    chokidar
        .watch(templateFolder, { ignoreInitial: true })
        .on('add', (path) => {
            copyTemplateSrcToBuild(path);
        })
        .on('change', (path) => {
            copyTemplateSrcToBuild(path);
        })
        .on('unlink', (path) => {
            removeTemplateFileFromBuild(path);
        });

    // Watch for any theme configuration file changes
    const themeSrcFolder = prefixSrcPath(config.data.themeConfig.src);
    const themeFolder = prefixRootPath(themeSrcFolder);
    fancyLog(
        chalk.magenta('Watching for changes in the theme folder'),
        chalk.cyan(themeSrcFolder),
    );
    chokidar
        .watch(themeFolder, { ignoreInitial: true })
        .on('add', (path) => {
            copyThemeSrcToBuild(path);
        })
        .on('change', (path) => {
            copyThemeSrcToBuild(path);
        })
        .on('unlink', (path) => {
            removeThemeFileFromBuild(path);
        });

    // Watch an "copy" files
    const copyFilesToWatch = [];
    const copyFilesMap = {};
    const copyData = prepareCopyData();
    copyData.forEach((copy) => {
        copy.files.forEach((file) => {
            const sourceFile = prefixRootPath(file);
            copyFilesToWatch.push(sourceFile);
            copyFilesMap[sourceFile] = {
                dest: copy.dest,
                srcRoot: copy.srcRoot,
            };
        });
    });
    if (copyFilesToWatch.length > 0) {
        fancyLog(
            chalk.magenta(
                'Watching for changes in the copy configuration source files',
            ),
        );
        // This is watching individual files so we're only going to process the "change" event.
        chokidar
            .watch(copyFilesToWatch, { ignoreInitial: true })
            .on('change', (path) => {
                copyWatchFile(path, copyFilesMap[path].srcRoot, copyFilesMap[path].dest);
            });
    }
};

export default watchHandler;
