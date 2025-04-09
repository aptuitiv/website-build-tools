/* ===========================================================================
    Create the ENV file.
=========================================================================== */

import fs from 'fs-extra';
import { input } from '@inquirer/prompts';

import { logInfo, logMessage, logSuccess } from './lib/log.js';
import { isStringWithValue } from './lib/types.js';

/**
 * Create the .env file
 *
 * @param {string} [name] The name of the website/project
 */
export const createEnvFile = async (name) => {
    logMessage('Creating the .env file with the FTP credentials');
    logInfo('You can get the username and password from the Settings -> Domain / FTP / DNS  section in the website administration.')
    let envName = '';
    if (isStringWithValue(name)) {
        envName = name;
    } else {
        envName = await input({ message: 'What is the name of this website? ' });
    }
    const username = await input({ message: 'What is the FTP username? ' });
    const password = await input({ message: 'What is the FTP password? ' });

    const contents = `# ${envName} FTP
FTP_ENVIRONMENT = live
FTP_SERVER = ftp1.branchcms.com
FTP_USERNAME = ${username}
FTP_PASSWORD = ${password} `;
    fs.writeFileSync('.env', contents);
    logSuccess('The .env file has been created');
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
        logSuccess('Found the .env file. Nothing to do.');
    }
    return returnValue;
};

/**
 * Process the env request
 */
export const envHandler = async () => {
    const files = checkForFiles();
    if (!files.env) {
        await createEnvFile();
    }
};
