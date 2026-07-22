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
import { logError } from './lib/log.js';
import { isStringWithValue } from './lib/types.js';

/**
 * Wrap a watch event handler so that synchronous throws and asynchronous
 * rejections are logged instead of crashing the long-running watch process.
 *
 * @param {string} message The message to log if the handler fails
 * @param {(...handlerArgs: string[]) => (void | Promise<void>)} handler The event handler (may be synchronous or asynchronous)
 * @returns {(...handlerArgs: string[]) => void} The wrapped handler
 */
const safeHandler =
    (message, handler) =>
    (...handlerArgs) => {
        Promise.resolve()
            .then(() => handler(...handlerArgs))
            .catch((error) => {
                logError(message, error);
            });
    };

/**
 * Create a handler for a chokidar "error" event (e.g. EMFILE or permission
 * errors) that logs the error without terminating the watch process.
 *
 * @param {string} name The name of the watched location, for context
 * @returns {(error: Error) => void} The error handler
 */
const watchError = (name) => (error) => {
    logError(`Error watching the ${name}:`, error);
};

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
        // Tolerate FTP failures so a single failed upload/delete doesn't crash the
        // long-running watch process (withRetry re-throws after exhausting retries).
        .on(
            'add',
            safeHandler('Failed to upload the file:', (path) =>
                deployFile(removePrefix(path, rootDistFolder)),
            ),
        )
        .on(
            'change',
            safeHandler('Failed to upload the file:', (path) =>
                deployFile(removePrefix(path, rootDistFolder)),
            ),
        )
        .on(
            'unlink',
            safeHandler('Failed to delete the file:', (path) =>
                deleteFile(removePrefix(path, rootDistFolder)),
            ),
        )
        .on('error', watchError('dist folder'));

    // Watch for any CSS changes
    const cssFolder = prefixRootSrcPath(config.data.css.src);
    fancyLog(
        chalk.magenta('Watching for changes in the CSS folder'),
        chalk.cyan(prefixSrcPath(config.data.css.src)),
    );
    chokidar
        .watch(cssFolder, {
            // Only watch CSS files
            // https://github.com/paulmillr/chokidar?tab=readme-ov-file#upgrading
            ignored: (path, stats) => stats?.isFile() && !path.endsWith('.css'),
            ignoreInitial: true,
            // Wait for the file to finish being written before processing.
            // Chokidar can emit multiple events for a single save, which would
            // otherwise trigger processCss() (a full rebuild) more than once.
            // https://github.com/paulmillr/chokidar?tab=readme-ov-file#performance
            awaitWriteFinish: { stabilityThreshold: 300, pollInterval: 100 },
        })
        .on(
            'all',
            safeHandler('Error processing the CSS:', () => processCss()),
        )
        .on('error', watchError('CSS folder'));

    // Watch for any font changes
    const fontSrcFolder = prefixSrcPath(config.data.fonts.src);
    const fontFolder = prefixRootPath(fontSrcFolder);
    fancyLog(
        chalk.magenta('Watching for changes in the font folder'),
        chalk.cyan(fontSrcFolder),
    );
    chokidar
        .watch(fontFolder, { ignoreInitial: true })
        .on(
            'add',
            safeHandler('Error copying the font file:', (path) =>
                copyFontSrcToBuild(path),
            ),
        )
        .on(
            'change',
            safeHandler('Error copying the font file:', (path) =>
                copyFontSrcToBuild(path),
            ),
        )
        .on(
            'unlink',
            safeHandler('Error removing the font file:', (path) =>
                removeFontFileFromBuild(path),
            ),
        )
        .on('error', watchError('font folder'));

    // Watch for any CSS changes
    const jsfolder = prefixRootSrcPath(config.data.javascript.src);
    fancyLog(
        chalk.magenta('Watching for changes in the Javascript folder'),
        chalk.cyan(prefixSrcPath(config.data.javascript.src)),
    );
    chokidar
        .watch(jsfolder, {
            // Only watch JS files
            // https://github.com/paulmillr/chokidar?tab=readme-ov-file#upgrading
            ignored: (path, stats) =>
                stats?.isFile() && !/\.js$|\.cjs$|\.mjs$/.test(path),
            ignoreInitial: true,
        })
        // Split the events (instead of using "all") so that directory events
        // (addDir/unlinkDir) are ignored and a just-deleted file is never processed.
        .on(
            'add',
            safeHandler('Error processing the Javascript file:', (path) =>
                processJsFile(path),
            ),
        )
        .on(
            'change',
            safeHandler('Error processing the Javascript file:', (path) =>
                processJsFile(path),
            ),
        )
        .on('unlink', (path) => {
            // A bundled source file was removed; there is no 1:1 build file to
            // delete here, so note it so the developer knows to rebuild the JS.
            fancyLog(
                chalk.yellow('Javascript source file removed:'),
                chalk.cyan(
                    removePrefix(
                        path,
                        prefixRootSrcPath(config.data.javascript.src),
                    ),
                ),
            );
        })
        .on('error', watchError('Javascript folder'));

    // Watch for any icon changes
    if (Array.isArray(config.data.icons)) {
        config.data.icons.forEach((iconConfig) => {
            if (
                isStringWithValue(iconConfig.src) &&
                isStringWithValue(iconConfig.build)
            ) {
                const iconFolder = prefixRootSrcPath(iconConfig.src);
                fancyLog(
                    chalk.magenta('Watching for changes in the icons folder'),
                    chalk.cyan(prefixSrcPath(iconConfig.src)),
                );
                chokidar
                    .watch(iconFolder, {
                        // Only watch SVG files
                        // https://github.com/paulmillr/chokidar?tab=readme-ov-file#upgrading
                        ignored: (path, stats) =>
                            stats?.isFile() && !path.endsWith('.svg'),
                        ignoreInitial: true,
                    })
                    .on(
                        'all',
                        safeHandler('Error creating the icon sprite:', () =>
                            createIconSprite(iconConfig.src, iconConfig.build),
                        ),
                    )
                    .on('error', watchError('icons folder'));
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
        .on(
            'add',
            safeHandler('Error processing the image:', (path) =>
                processImage(path),
            ),
        )
        .on(
            'change',
            safeHandler('Error processing the image:', (path) =>
                processImage(path),
            ),
        )
        .on(
            'unlink',
            safeHandler('Error removing the image file:', (path) =>
                removeImageFileFromBuild(path),
            ),
        )
        .on('error', watchError('images folder'));

    // Watch for any template file changes
    const templateSrcFolder = prefixSrcPath(config.data.templates.src);
    const templateFolder = prefixRootPath(templateSrcFolder);
    fancyLog(
        chalk.magenta('Watching for changes in the template folder'),
        chalk.cyan(templateSrcFolder),
    );
    chokidar
        .watch(templateFolder, { ignoreInitial: true })
        .on(
            'add',
            safeHandler('Error copying the template file:', (path) =>
                copyTemplateSrcToBuild(path),
            ),
        )
        .on(
            'change',
            safeHandler('Error copying the template file:', (path) =>
                copyTemplateSrcToBuild(path),
            ),
        )
        .on(
            'unlink',
            safeHandler('Error removing the template file:', (path) =>
                removeTemplateFileFromBuild(path),
            ),
        )
        .on('error', watchError('template folder'));

    // Watch for any theme configuration file changes
    const themeSrcFolder = prefixSrcPath(config.data.themeConfig.src);
    const themeFolder = prefixRootPath(themeSrcFolder);
    fancyLog(
        chalk.magenta('Watching for changes in the theme folder'),
        chalk.cyan(themeSrcFolder),
    );
    chokidar
        .watch(themeFolder, {
            ignoreInitial: true,
            // We use this to allow the theme processor to validate and write a reconfigured file
            // to the watched theme file.
            // Without doing this the written changes will not be applied to the watched file.
            // I lowered the stability threshold to 500ms from the default 2000ms to reduce the
            // lag from editing the file to when it's processed.
            // If the file is written to then it'll trigger another "change" event and the file will be
            // uploaded to the server twice. I couldn't find a way to prevent this. It only happens if the
            // json file has to be reformatted.
            // https://github.com/paulmillr/chokidar
            awaitWriteFinish: {
                stabilityThreshold: 500,
                pollInterval: 100,
            },
        })
        .on(
            'add',
            safeHandler('Error copying the theme file:', (path) =>
                copyThemeSrcToBuild(path),
            ),
        )
        .on(
            'change',
            safeHandler('Error copying the theme file:', (path) =>
                copyThemeSrcToBuild(path),
            ),
        )
        .on(
            'unlink',
            safeHandler('Error removing the theme file:', (path) =>
                removeThemeFileFromBuild(path),
            ),
        )
        .on('error', watchError('theme folder'));

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
            .on(
                'change',
                safeHandler('Error copying the file:', (path) => {
                    // Guard against a path that isn't a key in the map (e.g. due to
                    // path normalization/casing) so we don't throw on undefined.
                    const entry = copyFilesMap[path];
                    if (entry) {
                        copyWatchFile(path, entry.srcRoot, entry.dest);
                    }
                }),
            )
            .on('error', watchError('copy configuration source files'));
    }
};

export default watchHandler;
