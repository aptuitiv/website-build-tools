/* ===========================================================================
    Convert the old Gulp build process to use the build tools
=========================================================================== */

import * as acorn from 'acorn';
import * as acornWalk from 'acorn-walk';
import chalk from 'chalk';
import fancyLog from 'fancy-log';
import fs from 'fs-extra';
import logSymbols from 'log-symbols';

// Build scripts
import { setupRoot, removePrefixes } from './helpers.js';
import { initialize, createConfigFile } from './initialize.js';
import { formatPackageJson } from './package-json.js';

/**
 * Remove legacy files
 */
const removeFiles = () => {
    const files = [
        '.eslintignore',
        '.eslintrc.js',
        '.eslintrc.cjs',
        '.stylelintrc',
        'gulpfile.js',
        'gulp/copy.js',
        'gulp/css.js',
        'gulp/deploy.js',
        'gulp/export-theme.js',
        'gulp/font.js',
        'gulp/image.js',
        'gulp/javascript.js',
        'gulp/svg.js',
        'gulp/theme.js',
        'gulp/utilities.js',
    ];
    let removed = 0;
    files.forEach((file) => {
        if (fs.existsSync(file)) {
            fs.removeSync(file);
            removed += 1;
            fancyLog(logSymbols.success, chalk.green('Removed the file'), chalk.cyan(file));
        }
    });
    if (removed === 0) {
        fancyLog(logSymbols.info, chalk.yellow('No files to remove'));
    }
};

/**
 * Parse a Javascript node from the Gulp config file that is an array of objects.
 * Pull out the data that we need.
 *
 * @param {object} node The Javascript source node to parse
 * @param {Array} keys The array of keys to pull from the object
 * @param {string} src The root src path from the Gulp config file
 * @returns {Array}
 */
const parseGulpConfigArrayObject = (node, keys, src) => {
    const returnValue = [];
    // Loop through each element in the array
    node.value.elements.forEach((element) => {
        const arrayObject = {};
        if (element.type === 'ObjectExpression') {
            // The element is an object. Check for the keys we are looking for
            element.properties.forEach((property) => {
                if (keys.includes(property.key.name)) {
                    if (property.value.type === 'Literal') {
                        // The value is a string
                        arrayObject[property.key.name] = property.value.value;
                    } else if (property.value.type === 'ArrayExpression') {
                        // The value is an array. Extract each item in the array.
                        arrayObject[property.key.name] = [];
                        property.value.elements.forEach((propertyElement) => {
                            if (propertyElement.type === 'Literal') {
                                // The array item value is a string
                                arrayObject[property.key.name].push(propertyElement.value);
                            } else if (propertyElement.type === 'BinaryExpression') {
                                // The value is a binary expression. This is likely `src + '/some/path/to/file.js'`.
                                if (propertyElement.left.type === 'Identifier' && propertyElement.left.name === 'src' && propertyElement.right.type === 'Literal') {
                                    arrayObject[property.key.name].push(src + propertyElement.right.value);
                                }
                            }
                        });
                    } else if (property.value.type === 'BinaryExpression') {
                        // The value is a binary expression. This is likely `src + '/some/path/to/file.js'`.
                        if (property.value.left.type === 'Identifier' && property.value.left.name === 'src' && property.value.right.type === 'Literal') {
                            arrayObject[property.key.name] = src + property.value.right.value;
                        }
                    }
                }
            });
        }
        if (Object.keys(arrayObject).length > 0) {
            returnValue.push(arrayObject);
        }
    });
    return returnValue;
};

/**
 * Parse the Gulp config file and pull out the copy and scripts arrays to include
 * in the build tools configuration.
 *
 * @param {string} configFile The config file name
 */
const parseGulpConfig = (configFile) => {
    if (fs.existsSync('gulp/config.js')) {
        const contents = fs.readFileSync('gulp/config.js', 'utf8');
        // Parse the Javascript code
        const ast = acorn.parse(contents, { sourceType: 'module', ecmaVersion: 2020 });

        let copy = [];
        let scripts = [];

        // The src variable in the Gulp config file
        let src = '';

        // Walk through the code and pull out the parts we need
        acornWalk.fullAncestor(ast, (node) => {
            if (node.type === 'VariableDeclarator' && node.id.name === 'src') {
                // This is the "src" variable at the top of the config file. Get that
                // because it may be needed to build the paths for the copy and scripts arrays.
                src = node.init.value;
            }
            if (node.type === 'Property') {
                // The node is a value within an object. We want certain properties
                // within the "config" object.
                if (node.key.name === 'copy') {
                    // This is the "copy" array specifying the node_module files to copy.
                    // Parse the code to pull out the src and dest values
                    copy = parseGulpConfigArrayObject(node, ['src', 'dest'], src);
                } else if (node.key.name === 'scripts') {
                    // This is the "scripts" array specifying the Javascript files to parse.
                    // Parse the code to pull out the src and name values
                    scripts = parseGulpConfigArrayObject(node, ['name', 'src'], src);
                }
            }
        });

        // Set up the contents of the configuration file
        const configContents = {
            copy: [],
            javascript: {
                bundles: [],
                files: [],
            },
        };
        // Build the copy array
        if (copy.length > 0) {
            copy.forEach((copyItem) => {
                const copyObject = {};
                if (typeof copyItem.src === 'string') {
                    copyObject.src = copyItem.src;
                } else if (Array.isArray(copyItem.src)) {
                    // If there is only one item in the array convert it to a string value.
                    // Otherwise use the array
                    if (copyItem.src.length === 1) {
                        copyObject.src = copyItem.src.pop();
                    } else {
                        copyObject.src = copyItem.src;
                    }
                }
                copyObject.dest = copyItem.dest;
                configContents.copy.push(copyObject);
            });
        }
        if (scripts.length > 0) {
            // Build the Javascript bundles
            scripts.forEach((script) => {
                const scriptSrc = [];
                const nodeModules = [];
                if (Array.isArray(script.src)) {
                    script.src.forEach((srcItem) => {
                        if (srcItem.startsWith('node_modules')) {
                            // The source is from the node_modules folder. Separate these out
                            nodeModules.push(removePrefixes(srcItem, ['node_modules/']));
                        } else {
                            // This is a source from the Javascript source folder.
                            // Get the value without the "src" and "js" prefixes
                            scriptSrc.push(removePrefixes(srcItem, ['src', 'js', '/']));
                        }
                    });
                } else if (script.src.startsWith('node_modules')) {
                    // The source is from the node_modules folder. Separate these out
                    nodeModules.push(removePrefixes(script.src, ['node_modules/']));
                } else {
                    // This is a source from the Javascript source folder.
                    // Get the value without the "src" and "js" prefixes
                    scriptSrc.push(removePrefixes(script.src, ['src', 'js', '/']));
                }

                // Set up the individual bundle to have the correct properties in the correct order
                const bundle = {
                    build: script.name,
                };
                if (nodeModules.length > 0) {
                    bundle.nodeModules = nodeModules;
                }
                bundle.src = scriptSrc;

                if (!bundle.nodeModules && bundle.src.length === 1 && bundle.src[0] === bundle.build) {
                    // This is a single file that is the same as the build name. Add it to the files array
                    configContents.javascript.files.push(bundle.build);
                } else {
                    // This is a bundle of files. Add it to the bundles array
                    configContents.javascript.bundles.push(bundle);
                }
            });
        }

        // Create the aptuitiv-build configuration file
        createConfigFile(configFile, configContents);
    }
};

/**
 * Process the gulp convert request
 *
 * @param {object} args The command line arguments
 */
const gulpConvertHandler = async (args) => {
    fancyLog(chalk.magenta('Converting the Gulp build process to use the build tools'));
    const configFile = args.config || '.aptuitiv-buildrc.js';
    setupRoot(args.root);
    // Remove the files that are not needed
    removeFiles();
    parseGulpConfig(configFile);
    // Format the package.json file
    await formatPackageJson(args);
    // Initialize the environment
    initialize(args, false);
    fancyLog(logSymbols.success, chalk.green('Environment set up.'));
    fancyLog(logSymbols.success, chalk.green('Gulp build process converted.'));
    fancyLog(chalk.blue(`Compare the ${configFile} file to the gulp/config.js file to ensure the configuration is correct.
    Once you are done comparing the config files, remove the gulp/config.js file and the "gulp" folder.
    Then build the files with "npm run build", or start the watch process with "npm run watch", or do both with "npm run start".
    `));
};

export default gulpConvertHandler;
