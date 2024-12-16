/* ===========================================================================
    Create the ENV file.
=========================================================================== */

import chalk from 'chalk';
import fancyLog from 'fancy-log';
import fs from 'fs-extra';
import logSymbols from 'log-symbols';
import * as readline from 'node:readline/promises';

/**
 * Create the .env file
 */
export const createEnvFile = async () => {
    fancyLog(chalk.magenta('Creating the .env file'));
    fancyLog(chalk.blue('Setting up the FTP credentials. You can get the username and password from the Settings -> Domain / FTP / DNS  section in the website administration.'));
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout,
    });
    const name = await rl.question('What is the name of this website? ');
    const username = await rl.question('What is the FTP username? ');
    const password = await rl.question('What is the FTP password? ');
    rl.close();
    const contents = `# ${name} FTP
FTP_ENVIRONMENT = live
FTP_SERVER = ftp1.branchcms.com
FTP_USERNAME = ${username}
FTP_PASSWORD = ${password} `;
    fs.writeFileSync('.env', contents);
    fancyLog(logSymbols.success, chalk.green('Environment file created'), chalk.cyan('.env'));
};

/**
 * Checks to see if the .env file exists
 *
 * @returns {object} An object containing the status of the files
 */
const checkForFiles = () => {
    const returnValue = {
        env: false,
        config: false,
    };
    if (fs.existsSync('.env')) {
        returnValue.env = true;
        fancyLog(logSymbols.success, chalk.green('Found the .env file. Nothing to do.'));
    }
    return returnValue;
};

/**
 * Process the env request
 *
 * @param {object} args The command line arguments
 */
export const envHandler = async () => {
    const files = checkForFiles();
    if (!files.env) {
        await createEnvFile();
    }
};
