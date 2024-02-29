/**
 * Upload, download, and delete files via FTP
 */
import * as basicFtp from 'basic-ftp';
import chalk from 'chalk';
import fancyLog from 'fancy-log'
import fs from 'fs-extra';
import { globSync } from 'glob';
import logSymbols from 'log-symbols';
import * as path from 'path';

// Build scripts
import { getGlob, prefixPath } from './helpers.js';

/**
 * Get the source path and make sure it starts with the correct root path
 *
 * @param {string} sourcePath The source path
 * @returns {string}
 */
const getSourcePath = (config, sourcePath) => {
    const distFolder = prefixPath(config.build.base, config.root);
    return prefixPath(sourcePath, distFolder, config.build.base);
}

/**
 * Parse the path to make sure that it does not start with the correct build folder value
 *
 * @param {string} remotePath The file/folder path
 * @returns {string}
 */
const getRemotePath = (config, remotePath) => {
    let returnValue = remotePath;
    if (returnValue.startsWith(`${config.build.base}/`)) {
        returnValue = returnValue.slice(config.build.base.length);
    } else if (returnValue === config.build.base) {
        returnValue = '/';
    }
    if (returnValue.length === 0) {
        returnValue = '/';
    }
    return returnValue;
}

/**
 * Delete the file from the FTP server
 *
 * @param {string} filePath The path to the file to delete
 * @param {object} config The configuration object
 */
export async function deleteFile(config, filePath) {
    // Remove the file from the dist folder
    const srcPath = getSourcePath(config, filePath);
    fs.removeSync(srcPath);
    // Get the remote path for the file to remove.
    let removePath = getRemotePath(config, filePath);

    // Get the FTP connection
    const client = new basicFtp.Client();
    client.trackProgress(info => {
        fancyLog(chalk.magenta(`FTP ${info.type}`) + ' ' + chalk.cyan(removePath) + ' to ' + chalk.cyan(info.name));
    })

    try {
        await client.access({
            host: process.env.FTP_ENVIRONMENT === 'live' ? process.env.FTP_SERVER : process.env.FTP_DEV_SERVER,
            user: process.env.FTP_ENVIRONMENT === 'live' ? process.env.FTP_USERNAME : process.env.FTP_DEV_USERNAME,
            password: process.env.FTP_ENVIRONMENT === 'live' ? process.env.FTP_PASSWORD : process.env.FTP_DEV_PASSWORD,
        });
        await client.remove(removePath);
        fancyLog(logSymbols.success, chalk.green(`File deleted: ${filePath}`));
    } catch (err) {
        fancyLog(chalk.red(err));
    }
    client.close();
}

/**
 * Deploy the file to the server
 *
 * @param {string} filePath The file path to upload
 * @param {object} config The configuration object
 */
export async function deployFile(config, filePath) {
    let srcPath = getSourcePath(config, filePath)
    let remotePath = getRemotePath(config, filePath);

    fancyLog(`Uploading file: ${filePath}`);

    // Get the FTP connection
    const client = new basicFtp.Client();
    client.trackProgress(info => {
        fancyLog(chalk.magenta(`FTP ${info.type}`) + ' ' + chalk.cyan(info.name) + ` ${info.bytes} bytes`);
    })

    try {
        await client.access({
            host: process.env.FTP_ENVIRONMENT === 'live' ? process.env.FTP_SERVER : process.env.FTP_DEV_SERVER,
            user: process.env.FTP_ENVIRONMENT === 'live' ? process.env.FTP_USERNAME : process.env.FTP_DEV_USERNAME,
            password: process.env.FTP_ENVIRONMENT === 'live' ? process.env.FTP_PASSWORD : process.env.FTP_DEV_PASSWORD,
        });
        await client.ensureDir(remotePath.substring(0, remotePath.lastIndexOf("/")))
            .then(async () => {
                await client.uploadFrom(srcPath, remotePath)
                    .then(() => {
                        fancyLog(logSymbols.success, chalk.green(`Upload complete: ${filePath}`));
                    })
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
 * @param {object} config The configuration object
 */
async function downloadFile(config, filePath) {
    let srcPath = getSourcePath(config, filePath)
    let remotePath = getRemotePath(config, filePath);

    // Get the FTP connection
    const client = new basicFtp.Client();
    client.trackProgress(info => {
        if (info.bytes > 0) {
            fancyLog(chalk.magenta(`FTP ${info.type}`) + ' ' + chalk.cyan(filePath) + ' to ' + chalk.cyan(prefixPath(info.name, config.build.base)) + ` ${info.bytes} bytes`);
        }
    })

    try {
        // Make sure that the destination directory exists
        fs.ensureDirSync(path.dirname(srcPath));

        await client.access({
            host: process.env.FTP_ENVIRONMENT === 'live' ? process.env.FTP_SERVER : process.env.FTP_DEV_SERVER,
            user: process.env.FTP_ENVIRONMENT === 'live' ? process.env.FTP_USERNAME : process.env.FTP_DEV_USERNAME,
            password: process.env.FTP_ENVIRONMENT === 'live' ? process.env.FTP_PASSWORD : process.env.FTP_DEV_PASSWORD,
        });
        await client.downloadTo(srcPath, remotePath);
        fancyLog(logSymbols.success, chalk.green(`Download complete: ${filePath}`));
    } catch (err) {
        fancyLog(chalk.red(err));
    }
    client.close();
}

/**
 * Delete all files in a directory
 *
 * @param {string} dir The directory path to delete
 * @param {object} config The configuration object
 */
export async function deleteDir(config, dir) {
    let srcPath = getSourcePath(config, dir);
    fs.removeSync(srcPath);
    let removePath = getRemotePath(config, dir);
    // Get the FTP connection
    const client = new basicFtp.Client();

    try {
        await client.access({
            host: process.env.FTP_ENVIRONMENT === 'live' ? process.env.FTP_SERVER : process.env.FTP_DEV_SERVER,
            user: process.env.FTP_ENVIRONMENT === 'live' ? process.env.FTP_USERNAME : process.env.FTP_DEV_USERNAME,
            password: process.env.FTP_ENVIRONMENT === 'live' ? process.env.FTP_PASSWORD : process.env.FTP_DEV_PASSWORD,
        });
        await client.removeDir(removePath);
        fancyLog(logSymbols.success, chalk.green(`Directory deleted: ${dir}`));
    } catch (err) {
        fancyLog(chalk.red(err));
    }
    client.close();
}

/**
 * Deploy all files in a directory
 *
 * @param {string} dir The directory path to upload from
 * @param {object} config The configuration object
 */
async function deployDir(config, dir) {
    const srcPath = getSourcePath(config, dir);
    const remotePath = getRemotePath(config, dir);

    fs.ensureDirSync(srcPath);
    // Get the FTP connection
    const client = new basicFtp.Client();
    client.trackProgress(info => {
        fancyLog(chalk.magenta(`FTP ${info.type}`) + ' ' + chalk.cyan(info.name) + ` ${info.bytes} bytes`);
    })

    try {
        await client.access({
            host: process.env.FTP_ENVIRONMENT === 'live' ? process.env.FTP_SERVER : process.env.FTP_DEV_SERVER,
            user: process.env.FTP_ENVIRONMENT === 'live' ? process.env.FTP_USERNAME : process.env.FTP_DEV_USERNAME,
            password: process.env.FTP_ENVIRONMENT === 'live' ? process.env.FTP_PASSWORD : process.env.FTP_DEV_PASSWORD,
        });
        await client.uploadFromDir(srcPath, remotePath);
        fancyLog(logSymbols.success, chalk.green(`Directory upload complete: ${dir}`));
    } catch (err) {
        fancyLog(chalk.red(err));
    }
    client.close();
}

/**
 * Download a folder of files via FTP to the dist folder
 *
 * @param {string} dir The directory path to upload from
 * @param {object} config The configuration object
 */
async function downloadDir(config, dir) {
    const localPath = getSourcePath(config, dir);
    const remotePath = getRemotePath(config, dir);

    // Get the FTP connection
    const client = new basicFtp.Client();
    client.trackProgress(info => {
        if (info.type === 'download') {
            fancyLog(chalk.magenta(`FTP ${info.type}`) + ' ' + chalk.cyan(info.name) + ` ${info.bytes} bytes`);
        }
    })

    try {
        await client.access({
            host: process.env.FTP_ENVIRONMENT === 'live' ? process.env.FTP_SERVER : process.env.FTP_DEV_SERVER,
            user: process.env.FTP_ENVIRONMENT === 'live' ? process.env.FTP_USERNAME : process.env.FTP_DEV_USERNAME,
            password: process.env.FTP_ENVIRONMENT === 'live' ? process.env.FTP_PASSWORD : process.env.FTP_DEV_PASSWORD,
        });
        await client.downloadToDir(localPath, remotePath);
        fancyLog(logSymbols.success, chalk.green(`Directory download complete: ${dir}`));
    } catch (err) {
        fancyLog(chalk.red(err));
    }
    client.close();
}


/**
 * Show a message that no valid command line options were set
 */
const showNoActionSpecified = () => {
    fancyLog(logSymbols.error, chalk.red('No valid command line options were set for uploading files. Use --help for more information.'));
}

/**
 * Process the FTP request
 * 
 * @param {object} config The configuration object
 * @param {string} action The action to tak
 * @param {object} args Any command line arguments
 */
const ftpHander = (config, action, args) => {
    if (action === 'upload') {
        if (Object.keys(args).length > 0) {
            if (typeof args.path === 'string') {
                // Upload a single file, a directory, or a glob of files
                const glob = getGlob(args.path);
                const parsedGlobPath = path.parse(glob);
                if (parsedGlobPath.ext === '' && parsedGlobPath.name != '*') {
                    // A directory path was set
                    fancyLog(chalk.green(`Uploading directory: ${args.path}`));
                    deployDir(config, glob);
                } else {
                    fancyLog(chalk.green(`Uploading: ${args.path}`));
                    const paths = globSync(glob);
                    if (paths.length > 0) {
                        paths.forEach((path) => {
                            deployFile(config, path);
                        });
                    } else {
                        fancyLog(chalk.red('Your path did not match any files to upload. ') + args.path);
                    }
                }
            } else if (args.theme) {
                // Deploy the theme files
                fancyLog(chalk.green(`Deploying theme files: ${config.build.theme}`));
                deployDir(config, config.build.theme);
            } else {
                // No valid command line options were set
                showNoActionSpecified();
            }
        } else {
            // Upload all files
            fancyLog(chalk.green(`Deploying all files: ${config.build.base}`));
            deployDir(config, config.build.base);
        }
    } else if (action === 'download') {
        if (typeof args.path === 'string') {
            // Download a single file or a directory
            const parsedPath = path.parse(args.path);
            if (parsedPath.ext.length > 0) {
                // A single file will be downloaded
                fancyLog(chalk.green(`Downloading file: ${args.path}`));
                downloadFile(config, args.path);
            } else {
                // A directory is set to be downloaded
                fancyLog(chalk.green(`Downloading directory: ${args.path}`));
                downloadDir(config, args.path);
            }
        } else if (args.theme) {
            // Download the theme files
            fancyLog(chalk.green(`Downloading theme files: ${config.build.theme}`));
            downloadDir(config, config.build.theme);
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
                fancyLog(chalk.green(`Deleting file: ${args.path}`));
                deleteFile(config, args.path);
            } else {
                // A directory is set to be deleted
                fancyLog(chalk.green(`Deleting directory: ${args.path}`));
                deleteDir(config, args.path);
            }
        } else {
            // No valid command line options were set
            showNoActionSpecified();
        }
    }
}

export default ftpHander;