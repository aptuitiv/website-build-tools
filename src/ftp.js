/**
 * Upload, download, and delete files via FTP
 */
import * as basicFtp from 'basic-ftp';
import chalk from 'chalk';
import fancyLog from 'fancy-log';
import fs from 'fs-extra';
import { globSync } from 'glob';
import logSymbols from 'log-symbols';
import * as path from 'path';

// Build scripts
import config from './config.js';
import { processGlobPath, prefixPath, prefixRootPath } from './helpers.js';
import { notify } from './lib/notify.js';

/* global Client */

// ---- Retry configuration ----
const MAX_RETRIES = 3;
const BASE_DELAY_MS = 1000;

// ---- Notification batching ----
const NOTIFICATION_DELAY_MS = 1000;
let pendingNotifications = [];
let notificationTimer = null;

/**
 * Flush all pending notifications as a single summary notification
 */
const flushNotifications = () => {
    if (pendingNotifications.length === 0) {
        return;
    }

    const uploaded = pendingNotifications.filter(
        (n) => n.action === 'uploaded',
    );
    const deleted = pendingNotifications.filter((n) => n.action === 'deleted');
    const parts = [];

    if (uploaded.length > 0) {
        const label = uploaded.length === 1 ? 'file' : 'files';
        parts.push(`${uploaded.length} ${label} uploaded`);
    }
    if (deleted.length > 0) {
        const label = deleted.length === 1 ? 'file' : 'files';
        parts.push(`${deleted.length} ${label} deleted`);
    }

    notify({
        title: 'FTP Deploy',
        message: parts.join(', '),
        sound: config.data.ftp.sound,
    });

    pendingNotifications = [];
    notificationTimer = null;
};

/**
 * Queue a notification to be batched and sent as a summary
 *
 * @param {string} action The action performed ('uploaded' or 'deleted')
 * @param {string} filePath The file path
 */
const queueNotification = (action, filePath) => {
    if (!config.data.ftp.notify) {
        return;
    }
    pendingNotifications.push({ action, filePath });
    if (notificationTimer) {
        clearTimeout(notificationTimer);
    }
    notificationTimer = setTimeout(flushNotifications, NOTIFICATION_DELAY_MS);
};

/**
 * Get the source path and make sure it starts with the correct root path
 *
 * @param {string} sourcePath The source path
 * @returns {string}
 */
const getSourcePath = (sourcePath) => {
    const distFolder = prefixRootPath(config.data.build.base);
    return prefixPath(sourcePath, distFolder, config.data.build.base);
};

/**
 * Parse the path to make sure that it does not start with the correct build folder value
 *
 * @param {string} remotePath The file/folder path
 * @returns {string}
 */
const getRemotePath = (remotePath) => {
    let returnValue = remotePath;
    if (returnValue.startsWith(`${config.data.build.base}/`)) {
        returnValue = returnValue.slice(config.data.build.base.length);
    } else if (returnValue === config.data.build.base) {
        returnValue = '/';
    }
    if (returnValue.length === 0) {
        returnValue = '/';
    }
    return returnValue;
};

/**
 * Get FTP credentials from environment variables
 *
 * @returns {{ server: string, user: string, pass: string }} The credentials
 * @throws {Error} If credentials are missing
 */
const getCredentials = () => {
    const env = process.env.FTP_ENVIRONMENT ?? 'live';
    if (env === 'dev') {
        if (
            typeof process.env.FTP_DEV_SERVER === 'string' &&
            typeof process.env.FTP_DEV_USERNAME === 'string' &&
            typeof process.env.FTP_DEV_PASSWORD === 'string'
        ) {
            return {
                server: process.env.FTP_DEV_SERVER,
                user: process.env.FTP_DEV_USERNAME,
                pass: process.env.FTP_DEV_PASSWORD,
            };
        }
        throw new Error('The dev FTP credentials are missing');
    }
    if (
        typeof process.env.FTP_SERVER === 'string' &&
        typeof process.env.FTP_USERNAME === 'string' &&
        typeof process.env.FTP_PASSWORD === 'string' &&
        process.env.FTP_SERVER &&
        process.env.FTP_USERNAME &&
        process.env.FTP_PASSWORD
    ) {
        return {
            server: process.env.FTP_SERVER,
            user: process.env.FTP_USERNAME,
            pass: process.env.FTP_PASSWORD,
        };
    }
    throw new Error('The FTP credentials are missing');
};

/**
 * Connect to the FTP server
 *
 * @param {Client} client The FTP client
 * @returns {Client} The connected FTP client
 */
const connect = async (client) => {
    const env = process.env.FTP_ENVIRONMENT ?? 'live';
    fancyLog(chalk.green('FTP environment: '), chalk.cyan(env));

    const credentials = getCredentials();
    await client.access({
        host: credentials.server,
        user: credentials.user,
        password: credentials.pass,
    });

    return client;
};

/**
 * Execute an FTP operation with automatic retry on transient errors.
 * Creates a fresh client and connection for each attempt.
 *
 * @param {(client: basicFtp.Client) => Promise<void>} operation A function that receives a connected basicFtp.Client and performs the FTP work
 * @param {string} label A label for log messages (e.g. 'Upload file.txt')
 * @param {object} [options] Options
 * @param {boolean} [options.trackProgress] Whether to enable progress tracking on the client
 * @returns {Promise<void>}
 */
const withRetry = async (operation, label, options = {}) => {
    /* eslint-disable no-await-in-loop -- Retries must be sequential */
    for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
        const client = new basicFtp.Client();
        client.ftp.timeout = 30000;
        if (options.trackProgress) {
            client.trackProgress((info) => {
                fancyLog(
                    `${chalk.magenta(`FTP ${info.type}`)} ${chalk.cyan(
                        info.name,
                    )} ${info.bytes} bytes`,
                );
            });
        }
        try {
            await connect(client);
            await operation(client);
            client.close();
            return;
        } catch (err) {
            client.close();
            if (attempt < MAX_RETRIES) {
                const delay = BASE_DELAY_MS * 2 ** (attempt - 1);
                fancyLog(
                    logSymbols.warning,
                    chalk.yellow(
                        `${label} failed (attempt ${attempt}/${MAX_RETRIES}): ${err.message}`,
                    ),
                );
                fancyLog(chalk.yellow(`Retrying in ${delay / 1000}s...`));
                await new Promise((resolve) => {
                    setTimeout(resolve, delay);
                });
            } else {
                fancyLog(
                    logSymbols.error,
                    chalk.red(
                        `${label} failed after ${MAX_RETRIES} attempts: ${err.message}`,
                    ),
                );
            }
        }
    }
    /* eslint-enable no-await-in-loop */
};

/**
 * Delete the file from the FTP server
 *
 * @param {string} filePath The path to the file to delete
 */
export async function deleteFile(filePath) {
    // Remove the file from the dist folder
    const srcPath = getSourcePath(filePath);
    fs.removeSync(srcPath);
    // Get the remote path for the file to remove.
    const removePath = getRemotePath(filePath);

    fancyLog(chalk.magenta('Deleting file'), chalk.cyan(filePath));

    await withRetry(async (client) => {
        await client.remove(removePath);
        fancyLog(
            logSymbols.success,
            chalk.green(`File deleted from server: ${filePath}`),
        );
        queueNotification('deleted', filePath);
    }, `Delete ${filePath}`);
}

/**
 * Deploy the file to the server
 *
 * @param {string} filePath The file path to upload
 */
export async function deployFile(filePath) {
    const srcPath = getSourcePath(filePath);
    const remotePath = getRemotePath(filePath);

    fancyLog(chalk.magenta('Uploading file'), chalk.cyan(filePath));

    await withRetry(
        async (client) => {
            await client.ensureDir(
                remotePath.substring(0, remotePath.lastIndexOf('/')),
            );
            await client.uploadFrom(srcPath, remotePath);
            fancyLog(
                logSymbols.success,
                chalk.green(`Upload complete: ${filePath}`),
            );
            queueNotification('uploaded', filePath);
        },
        `Upload ${filePath}`,
        { trackProgress: true },
    );
}

/**
 * Download a file from the server
 *
 * @param {string} filePath The file path to download
 */
async function downloadFile(filePath) {
    const srcPath = getSourcePath(filePath);
    const remotePath = getRemotePath(filePath);

    fancyLog(chalk.magenta('Downloading file'), chalk.cyan(filePath));

    // Make sure that the destination directory exists
    fs.ensureDirSync(path.dirname(srcPath));

    await withRetry(
        async (client) => {
            await client.downloadTo(srcPath, remotePath);
            fancyLog(
                logSymbols.success,
                chalk.green(`Download complete: ${filePath}`),
            );
        },
        `Download ${filePath}`,
        { trackProgress: true },
    );
}

/**
 * Delete all files in a directory
 *
 * @param {string} dir The directory path to delete
 */
export async function deleteDir(dir) {
    const srcPath = getSourcePath(dir);
    fs.removeSync(srcPath);
    const removePath = getRemotePath(dir);

    fancyLog(chalk.magenta('Deleting directory'), chalk.cyan(dir));

    await withRetry(async (client) => {
        await client.removeDir(removePath);
        fancyLog(
            logSymbols.success,
            chalk.green(`Directory deleted from server: ${dir}`),
        );
    }, `Delete directory ${dir}`);
}

/**
 * Deploy all files in a directory
 *
 * @param {string} dir The directory path to upload from
 */
async function deployDir(dir) {
    const srcPath = getSourcePath(dir);
    const remotePath = getRemotePath(dir);

    fancyLog(chalk.magenta('Uploading directory'), chalk.cyan(dir));

    fs.ensureDirSync(srcPath);

    await withRetry(
        async (client) => {
            await client.uploadFromDir(srcPath, remotePath);
            fancyLog(
                logSymbols.success,
                chalk.green(`Directory upload complete: ${dir}`),
            );
        },
        `Upload directory ${dir}`,
        { trackProgress: true },
    );
}

/**
 * Download a folder of files via FTP to the dist folder
 *
 * @param {string} dir The directory path to upload from
 */
async function downloadDir(dir) {
    const localPath = getSourcePath(dir);
    const remotePath = getRemotePath(dir);

    fancyLog(chalk.magenta('Downloading directory'), chalk.cyan(dir));

    await withRetry(
        async (client) => {
            await client.downloadToDir(localPath, remotePath);
            fancyLog(
                logSymbols.success,
                chalk.green(`Directory download complete: ${dir}`),
            );
        },
        `Download directory ${dir}`,
        { trackProgress: true },
    );
}

/**
 * Show a message that no valid command line options were set
 */
const showNoActionSpecified = () => {
    fancyLog(
        logSymbols.error,
        chalk.red(
            'No valid command line options were set for uploading files. Use --help for more information.',
        ),
    );
};

/**
 * Process the FTP request
 *
 * @param {string} action The action to tak
 * @param {object} args Any command line arguments
 */
const ftpHander = async (action, args) => {
    if (action === 'upload') {
        if (typeof args.path === 'string') {
            // Upload a single file, a directory, or a glob of files
            const glob = processGlobPath(args.path);
            const parsedGlobPath = path.parse(glob);
            if (parsedGlobPath.ext === '' && parsedGlobPath.name !== '*') {
                // A directory path was set
                await deployDir(glob);
            } else {
                fancyLog(chalk.green(`Uploading: ${args.path}`));
                const paths = globSync(glob);
                if (paths.length > 0) {
                    // Upload sequentially so that a large glob doesn't open a flood
                    // of simultaneous FTP connections (each deployFile opens its own).
                    for (const filePath of paths) {
                        // eslint-disable-next-line no-await-in-loop -- Uploads must be sequential
                        await deployFile(filePath);
                    }
                } else {
                    fancyLog(
                        chalk.red(
                            'Your path did not match any files to upload. ',
                        ) + args.path,
                    );
                }
            }
        } else {
            // No path was set (with or without --theme). Upload the root build folder.
            fancyLog(
                chalk.green(
                    `No path set. Using the default build path: ${config.data.build.base}`,
                ),
            );
            await deployDir(config.data.build.base);
        }
    } else if (action === 'download') {
        if (typeof args.path === 'string') {
            // Download a single file or a directory
            const parsedPath = path.parse(args.path);
            if (parsedPath.ext.length > 0) {
                // A single file will be downloaded
                await downloadFile(args.path);
            } else {
                // A directory is set to be downloaded
                await downloadDir(args.path);
            }
        } else {
            // No path was set (with or without --theme). Download the root build folder.
            fancyLog(
                chalk.green(
                    `No path set. Using the default build path: ${config.data.build.base}`,
                ),
            );
            await downloadDir(config.data.build.base);
        }
    } else if (action === 'delete') {
        if (typeof args.path === 'string') {
            // Delete a single file or a directory
            const parsedPath = path.parse(args.path);
            if (parsedPath.ext.length > 0) {
                // A single file will be deleted
                await deleteFile(args.path);
            } else {
                // A directory is set to be deleted
                await deleteDir(args.path);
            }
        } else {
            // No valid command line options were set
            showNoActionSpecified();
        }
    }
};

export default ftpHander;
