/* ===========================================================================
    Create the ENV file.
=========================================================================== */

import fs from 'fs-extra';
import { input, password } from '@inquirer/prompts';
import { isAbsolute, join, resolve } from 'path';

import { logInfo, logMessage, logSuccess } from './lib/log.js';
import { isStringWithValue } from './lib/types.js';

/**
 * Resolve the absolute path to the .env file for the given root folder.
 *
 * Unlike most commands, "env" does not call config.init(), so the --root option
 * is resolved here. A relative root is resolved against the current working directory.
 *
 * @param {string} [root] The root folder of the project
 * @returns {string} The absolute path to the .env file
 */
const getEnvPath = (root) => {
    let rootFolder = process.cwd();
    if (isStringWithValue(root)) {
        rootFolder = isAbsolute(root) ? root : resolve(process.cwd(), root);
    }
    return join(rootFolder, '.env');
};

/**
 * Create the .env file
 *
 * @param {string} [name] The name of the website/project
 * @param {string} [envPath] The path to the .env file to create. Defaults to ".env" in the current working directory.
 */
export const createEnvFile = async (name, envPath = '.env') => {
    logMessage('Creating the .env file with the FTP credentials');
    logInfo(
        'You can get the username and password from the Settings -> Domain / FTP / DNS  section in the website administration.',
    );
    let envName;
    if (isStringWithValue(name)) {
        envName = name;
    } else {
        envName = await input({
            message: 'What is the name of this website? ',
        });
    }
    const username = await input({ message: 'What is the FTP username? ' });
    const ftpPassword = await password({
        message: 'What is the FTP password? ',
        mask: '*',
    });

    const contents = `# ${envName} FTP
FTP_ENVIRONMENT = live
FTP_SERVER = ftp1.branchcms.com
FTP_USERNAME = ${username}
FTP_PASSWORD = ${ftpPassword}`;
    // Restrict permissions to the owner since this file contains FTP credentials.
    fs.writeFileSync(envPath, contents, { mode: 0o600 });
    logSuccess('The .env file has been created');
};

/**
 * Checks to see if the .env file exists
 *
 * @param {string} [envPath] The path to the .env file to check. Defaults to ".env" in the current working directory.
 * @returns {object} An object containing the status of the files
 */
const checkForFiles = (envPath = '.env') => {
    const returnValue = {
        env: false,
    };
    if (fs.existsSync(envPath)) {
        returnValue.env = true;
        logSuccess('Found the .env file. Nothing to do.');
    }
    return returnValue;
};

/**
 * Process the env request
 *
 * @param {object} [args] The command line arguments
 */
export const envHandler = async (args) => {
    const envPath = getEnvPath(args?.root);
    const files = checkForFiles(envPath);
    if (!files.env) {
        await createEnvFile(args?.name, envPath);
    }
};
