/**
 * Upload, download, and delete files via FTP
 *
 * Usage:
 *
 * Deploy all files (this includes all files in the distribution folder - typically "dist")
 * node ftp.js --all
 * node ftp.js -a
 *
 * Deploy all theme files (this includes all files in the theme distribution folder - typically "dist/theme/custom")
 * node ftp.js --theme
 * node.ftp.js -t
 *
 * Deploy a single file
 * node ftp.js --path 'dist/path/to/file.js'
 * node ftp.js -p 'dist/path/to/file.js'
 *
 * or, the "dist" path can be omitted
 * node ftp.js -p 'path/to/file.js'
 *
 * Deploy a glob of files.
 * Any valid glob path is allowed
 * node ftp.js -p 'path/to/*.js'
 *
 * Download all files
 * node ftp.js --download
 * node ftp.js -d
 *
 * Download theme files
 * node ftp.js --downloadTheme
 *
 * Download a single file
 * node ftp.js --download 'path/to/file/on/remote/server/file.css'
 * node ftp.js --d 'path/to/file/on/remote/server/file.css'
 *
 * Download a directory of files
 * node ftp.js --download 'path/to/directory'
 * node ftp.js -d 'path/to/directory'
 *
 * Delete a file
 * node ftp.js --delete 'path/to/file.css'
 *
 * Delete a directory
 * node ftp.js --delete 'path/to/directory'
 */
import * as basicFtp from 'basic-ftp';
import chalk from 'chalk';
import { Command } from 'commander';
import 'dotenv/config';
import fancyLog from 'fancy-log'
import fs from 'fs-extra';
import { globSync } from 'glob';
import logSymbols from 'log-symbols';
import * as path from 'path';

// Build scripts
import config from './config.js';
import { getGlob, prefixPath } from './helpers.js';

// Some configuration values for deploying
const distFolder = config.build.base;
const distThemeFolder = config.build.theme;

/**
 * Get the source path and make sure it starts with the distFolder path
 *
 * @param {string} sourcePath The source path
 * @returns {string}
 */
const getSourcePath = (sourcePath) => {
    return prefixPath(sourcePath, distFolder);
}

/**
 * Get the processed source glob path
 *
 * @param {string} glob The glob path
 * @returns {string}
 */
const getSourceGlob = (glob) => {
    return getGlob(getSourcePath(glob));
}

/**
 * Parse the path to make sure that it does not start with the distFolder value
 *
 * @param {string} remotePath The file/folder path
 * @returns {string}
 */
const getRemotePath = (remotePath) => {
    let returnValue = remotePath;
    if (returnValue.startsWith(`${distFolder}/`)) {
        returnValue = returnValue.slice(distFolder.length);
    } else if (returnValue === distFolder) {
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
 */
export async function deleteFile(filePath) {
    // Get the remote path for the file to remove.
    let removePath = getRemotePath(filePath);

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
 */
export async function deployFile(filePath) {
    let srcPath = getSourcePath(filePath)
    let remotePath = getRemotePath(filePath);

    fancyLog(`Uploading file: ${filePath}`);

    // Get the FTP connection
    const client = new basicFtp.Client();
    client.trackProgress(info => {
        if (info.bytes > 0) {
            fancyLog(chalk.magenta(`FTP ${info.type}`) + ' ' + chalk.cyan(srcPath) + ' to ' + chalk.cyan(info.name) + ` ${info.bytes} bytes`);
        }
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
 */
async function downloadFile(filePath) {
    let srcPath = getSourcePath(filePath)
    let remotePath = getRemotePath(filePath);


    // Get the FTP connection
    const client = new basicFtp.Client();
    client.trackProgress(info => {
        if (info.bytes > 0) {
            fancyLog(chalk.magenta(`FTP ${info.type}`) + ' ' + chalk.cyan(srcPath) + ' to ' + chalk.cyan(info.name) + ` ${info.bytes} bytes`);
        }
    })

    try {
        // Make sure that the destination directory exists
        const dir = path.dirname(srcPath);
        fs.ensureDirSync(dir);

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
 */
export async function deleteDir(dir) {
    let removePath = getRemotePath(dir);
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
 */
async function deployDir(dir) {
    const srcPath = getSourcePath(dir);
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
        await client.uploadFromDir(srcPath);
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
 */
async function downloadDir(dir) {
    const localPath = getSourcePath(dir);
    const remotePath = getRemotePath(dir);

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
 * Parse the command lines arguments and call the correct deploy function
 */
const program = new Command();
program
    .option('-a, --all', 'Upload all files')
    .option('-d, --download [filePath]', 'Download a single file, or all files if no path is set')
    .option('--delete <path>', 'Delete a file or a folder')
    .option('--downloadTheme', 'Download all theme files')
    .option('-p, --path <filePath>', 'Upload a file, a folder, or a glob') // Upload path, file, or glob
    .option('-t --theme', 'Upload all theme files'); // Upload all theme files

program.parse();
const options = program.opts();

if (Object.keys(options).length > 0) {
    // At least one command line option was set
    if (typeof options.path === 'string') {
        // Upload a single file, a directory, or a glob of files
        const glob = getSourceGlob(options.path);
        const parsedGlobPath = path.parse(glob);
        if (parsedGlobPath.ext === '' && parsedGlobPath.name != '*') {
            // A directory path was set
            fancyLog(chalk.green(`Uploading directory: ${options.path}`));
            deployDir(glob);
        } else {
            fancyLog(chalk.green(`Uploading: ${options.path}`));
            const paths = globSync(glob);
            if (paths.length > 0) {
                paths.forEach((path) => {
                    deployFile(path);
                });
            } else {
                fancyLog(chalk.red('Your path did not match any files to upload. ') + options.path);
            }
        }
    } else if (typeof options.download === 'string') {
        // Download a single file or a directory
        const parsedPath = path.parse(options.download);
        if (parsedPath.ext.length > 0) {
            // A single file will be downloaded
            fancyLog(chalk.green(`Downloading file: ${options.download}`));
            downloadFile(options.download);
        } else {
            // A directory is set to be downloaded
            fancyLog(chalk.green(`Downloading directory: ${options.download}`));
            downloadDir(options.download);
        }
    } else if (options.downloadTheme) {
        // Download the theme files
        fancyLog(chalk.green(`Downloading theme files: ${distThemeFolder}`));
        downloadDir(distThemeFolder);
    } else if (options.download) {
        // Download all files
        fancyLog(chalk.green(`Downloading all files: ${distFolder}`));
        downloadDir(distFolder);
    } else if (options.theme) {
        // Deploy the theme files
        fancyLog(chalk.green(`Deploying theme files: ${distThemeFolder}`));
        deployDir(distThemeFolder);
    } else if (options.all) {
        // Deploy all files
        fancyLog(chalk.green(`Deploying all files: ${distFolder}`));
        deployDir(distFolder);
    } else if (typeof options.delete === 'string') {
        // Delete a single file or a directory
        const parsedPath = path.parse(options.delete);
        if (parsedPath.ext.length > 0) {
            // A single file will be deleted
            fancyLog(chalk.green(`Deleting file: ${options.delete}`));
            deleteFile(options.delete);
        } else {
            // A directory is set to be deleted
            fancyLog(chalk.green(`Deleting directory: ${options.delete}`));
            deleteDir(options.delete);
        }
    }
}
