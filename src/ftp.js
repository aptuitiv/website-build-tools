/**
 * Upload, download, and delete files via FTP
 */
import * as basicFtp from 'basic-ftp';
import chalk from 'chalk';
import fancyLog from 'fancy-log';
import fs from 'fs-extra';
import { globSync } from 'glob';
import logSymbols from 'log-symbols';
import notifier from 'node-notifier';
import * as path from 'path';

// Build scripts
import config from './config.js';
import {
    processGlobPath,
    prefixBuildPath,
    prefixPath,
    prefixRootPath,
} from './helpers.js';

/* global process */

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

    // Get the FTP connection
    const client = new basicFtp.Client();
    client.trackProgress((info) => {
        fancyLog(
            `${chalk.magenta(`FTP ${info.type}`)
            } ${chalk.cyan(removePath)
            } to ${chalk.cyan(info.name)}`,
        );
    });

    try {
        await client.access({
            host:
                process.env.FTP_ENVIRONMENT === 'live'
                    ? process.env.FTP_SERVER
                    : process.env.FTP_DEV_SERVER,
            user:
                process.env.FTP_ENVIRONMENT === 'live'
                    ? process.env.FTP_USERNAME
                    : process.env.FTP_DEV_USERNAME,
            password:
                process.env.FTP_ENVIRONMENT === 'live'
                    ? process.env.FTP_PASSWORD
                    : process.env.FTP_DEV_PASSWORD,
        });
        await client.remove(removePath);
        fancyLog(
            logSymbols.success,
            chalk.green(`File deleted from server: ${filePath}`),
        );
        if (config.data.ftp.notify) {
            notifier.notify({
                title: 'Deploy',
                message: 'File deleted from FTP server!',
                sound: true,
            });
        }
    } catch (err) {
        fancyLog(chalk.red(err));
    }
    client.close();
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

    // Get the FTP connection
    const client = new basicFtp.Client();
    client.trackProgress((info) => {
        fancyLog(
            `${chalk.magenta(`FTP ${info.type}`)
            } ${chalk.cyan(info.name)
            } ${info.bytes} bytes`,
        );
    });

    try {
        await client.access({
            host:
                process.env.FTP_ENVIRONMENT === 'live'
                    ? process.env.FTP_SERVER
                    : process.env.FTP_DEV_SERVER,
            user:
                process.env.FTP_ENVIRONMENT === 'live'
                    ? process.env.FTP_USERNAME
                    : process.env.FTP_DEV_USERNAME,
            password:
                process.env.FTP_ENVIRONMENT === 'live'
                    ? process.env.FTP_PASSWORD
                    : process.env.FTP_DEV_PASSWORD,
        });
        await client
            .ensureDir(remotePath.substring(0, remotePath.lastIndexOf('/')))
            .then(async () => {
                await client.uploadFrom(srcPath, remotePath).then(() => {
                    fancyLog(
                        logSymbols.success,
                        chalk.green(`Upload complete: ${filePath}`),
                    );
                    if (config.data.ftp.notify) {
                        notifier.notify({
                            title: 'Deploy',
                            message: 'File uploaded to FTP server!',
                            sound: true,
                        });
                    }
                });
            });
    } catch (err) {
        fancyLog(chalk.red(err));
    }
    client.close();
}

/**
 * Download a file from the server
 *
 * @param {string} filePath The file path to downlpad
 */
async function downloadFile(filePath) {
    const srcPath = getSourcePath(filePath);
    const remotePath = getRemotePath(filePath);

    fancyLog(chalk.magenta('Downloading file'), chalk.cyan(filePath));

    // Get the FTP connection
    const client = new basicFtp.Client();
    client.trackProgress((info) => {
        if (info.bytes > 0) {
            fancyLog(
                `${chalk.magenta(`FTP ${info.type}`)
                } ${chalk.cyan(filePath)
                } to ${chalk.cyan(prefixBuildPath(info.name))
                } ${info.bytes} bytes`,
            );
        }
    });

    try {
        // Make sure that the destination directory exists
        fs.ensureDirSync(path.dirname(srcPath));

        await client.access({
            host:
                process.env.FTP_ENVIRONMENT === 'live'
                    ? process.env.FTP_SERVER
                    : process.env.FTP_DEV_SERVER,
            user:
                process.env.FTP_ENVIRONMENT === 'live'
                    ? process.env.FTP_USERNAME
                    : process.env.FTP_DEV_USERNAME,
            password:
                process.env.FTP_ENVIRONMENT === 'live'
                    ? process.env.FTP_PASSWORD
                    : process.env.FTP_DEV_PASSWORD,
        });
        await client.downloadTo(srcPath, remotePath);
        fancyLog(
            logSymbols.success,
            chalk.green(`Download complete: ${filePath}`),
        );
    } catch (err) {
        fancyLog(chalk.red(err));
    }
    client.close();
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
    // Get the FTP connection
    const client = new basicFtp.Client();

    fancyLog(chalk.magenta('Deleting directory'), chalk.cyan(dir));

    try {
        await client.access({
            host:
                process.env.FTP_ENVIRONMENT === 'live'
                    ? process.env.FTP_SERVER
                    : process.env.FTP_DEV_SERVER,
            user:
                process.env.FTP_ENVIRONMENT === 'live'
                    ? process.env.FTP_USERNAME
                    : process.env.FTP_DEV_USERNAME,
            password:
                process.env.FTP_ENVIRONMENT === 'live'
                    ? process.env.FTP_PASSWORD
                    : process.env.FTP_DEV_PASSWORD,
        });
        await client.removeDir(removePath);
        fancyLog(
            logSymbols.success,
            chalk.green(`Directory deleted from server: ${dir}`),
        );
    } catch (err) {
        fancyLog(chalk.red(err));
    }
    client.close();
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
    // Get the FTP connection
    const client = new basicFtp.Client();
    client.trackProgress((info) => {
        fancyLog(
            `${chalk.magenta(`FTP ${info.type}`)
            } ${chalk.cyan(info.name)
            } ${info.bytes} bytes`,
        );
    });

    try {
        await client.access({
            host:
                process.env.FTP_ENVIRONMENT === 'live'
                    ? process.env.FTP_SERVER
                    : process.env.FTP_DEV_SERVER,
            user:
                process.env.FTP_ENVIRONMENT === 'live'
                    ? process.env.FTP_USERNAME
                    : process.env.FTP_DEV_USERNAME,
            password:
                process.env.FTP_ENVIRONMENT === 'live'
                    ? process.env.FTP_PASSWORD
                    : process.env.FTP_DEV_PASSWORD,
        });
        await client.uploadFromDir(srcPath, remotePath);
        fancyLog(
            logSymbols.success,
            chalk.green(`Directory upload complete: ${dir}`),
        );
    } catch (err) {
        fancyLog(chalk.red(err));
    }
    client.close();
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

    // Get the FTP connection
    const client = new basicFtp.Client();
    client.trackProgress((info) => {
        if (info.type === 'download') {
            fancyLog(
                `${chalk.magenta(`FTP ${info.type}`)
                } ${chalk.cyan(info.name)
                } ${info.bytes} bytes`,
            );
        }
    });

    try {
        await client.access({
            host:
                process.env.FTP_ENVIRONMENT === 'live'
                    ? process.env.FTP_SERVER
                    : process.env.FTP_DEV_SERVER,
            user:
                process.env.FTP_ENVIRONMENT === 'live'
                    ? process.env.FTP_USERNAME
                    : process.env.FTP_DEV_USERNAME,
            password:
                process.env.FTP_ENVIRONMENT === 'live'
                    ? process.env.FTP_PASSWORD
                    : process.env.FTP_DEV_PASSWORD,
        });
        await client.downloadToDir(localPath, remotePath);
        fancyLog(
            logSymbols.success,
            chalk.green(`Directory download complete: ${dir}`),
        );
    } catch (err) {
        fancyLog(chalk.red(err));
    }
    client.close();
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
const ftpHander = (action, args) => {
    if (action === 'upload') {
        if (Object.keys(args).length > 0) {
            if (typeof args.path === 'string') {
                // Upload a single file, a directory, or a glob of files
                const glob = processGlobPath(args.path);
                const parsedGlobPath = path.parse(glob);
                if (parsedGlobPath.ext === '' && parsedGlobPath.name !== '*') {
                    // A directory path was set
                    deployDir(glob);
                } else {
                    fancyLog(chalk.green(`Uploading: ${args.path}`));
                    const paths = globSync(glob);
                    if (paths.length > 0) {
                        paths.forEach((filePath) => {
                            deployFile(filePath);
                        });
                    } else {
                        fancyLog(
                            chalk.red(
                                'Your path did not match any files to upload. ',
                            ) + args.path,
                        );
                    }
                }
            } else if (args.theme) {
                // Deploy the theme files
                deployDir(config.data.build.theme);
            } else {
                // No valid command line options were set
                showNoActionSpecified();
            }
        } else {
            // Upload all files
            deployDir(config.data.build.base);
        }
    } else if (action === 'download') {
        if (typeof args.path === 'string') {
            // Download a single file or a directory
            const parsedPath = path.parse(args.path);
            if (parsedPath.ext.length > 0) {
                // A single file will be downloaded
                downloadFile(args.path);
            } else {
                // A directory is set to be downloaded
                downloadDir(args.path);
            }
        } else if (args.theme) {
            // Download the theme files
            downloadDir(config.data.build.theme);
        } else {
            // No valid command line options were set
            showNoActionSpecified();
        }
    } else if (action === 'delete') {
        if (typeof args.path === 'string') {
            // Delete a single file or a directory
            const parsedPath = path.parse(args.path);
            if (parsedPath.ext.length > 0) {
                // A single file will be deleted
                deleteFile(args.path);
            } else {
                // A directory is set to be deleted
                deleteDir(args.path);
            }
        } else {
            // No valid command line options were set
            showNoActionSpecified();
        }
    }
};

export default ftpHander;
