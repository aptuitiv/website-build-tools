/* ===========================================================================
    Convert the old Gulp build process to use the build tools
=========================================================================== */

import * as acorn from 'acorn';
import * as acornWalk from 'acorn-walk';
import chalk from 'chalk';
import fancyLog from 'fancy-log';
import fs from 'fs-extra';
import logSymbols from 'log-symbols';
import * as childProcess from 'child_process';

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
    // Only remove the gulpfile.js if the gulp/config.js file exists.
    // If the gulp/config.js file does not exist, then this is a really old gulp implimentation
    // and the configuration is in the gulpfile.js file.
    if (fs.existsSync('gulp/config.js')) {
        files.push('gulpfile.js');
    }
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
 * Parse a binary node expression from the Gulp config file and extract the value
 *
 * @param {object} node The source node to parse
 * @param {object} variables An object of variables from the file
 * @returns {string}
 */
const parseGulpConfigBinaryExpression = (node, variables) => {
    let left = '';
    let right = '';
    if (node.left.type === 'Identifier') {
        if (typeof variables[node.left.name] !== 'undefined') {
            left = variables[node.left.name];
        }
    } else if (node.left.type === 'BinaryExpression') {
        left = parseGulpConfigBinaryExpression(node.left, variables);
    } else if (node.left.type === 'Literal') {
        left = node.left.value;
    }
    if (node.right.type === 'Identifier') {
        if (typeof variables[node.right.name] !== 'undefined') {
            right = variables[node.right.name];
        }
    } else if (node.right.type === 'BinaryExpression') {
        right = parseGulpConfigBinaryExpression(node.right, variables);
    } else if (node.right.type === 'Literal') {
        right = node.right.value;
    }
    return `${left}${right}`;
};

/**
 * Parse a Javascript node from the Gulp config file that is an array of objects.
 * Pull out the data that we need.
 *
 * @param {object} node The Javascript source node to parse
 * @param {Array} keys The array of keys to pull from the object
 * @param {object} variables An object of variables from the file
 * @returns {Array}
 */
const parseGulpConfigArrayObject = (node, keys, variables) => {
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
                                const binaryValue = parseGulpConfigBinaryExpression(propertyElement, variables);
                                if (binaryValue) {
                                    arrayObject[property.key.name].push(binaryValue);
                                }
                            }
                        });
                    } else if (property.value.type === 'BinaryExpression') {
                        // The value is a binary expression. This is likely `src + '/some/path/to/file.js'`.
                        const binaryValue = parseGulpConfigBinaryExpression(property.value, variables);
                        if (binaryValue) {
                            arrayObject[property.key.name] = binaryValue;
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
 * Parses a "source" value from the Gulp config file
 *
 * This is used to get the CSS build source files. The retrieved value can be a string or an array of strings.
 *
 * @param {object} node The Javascript source node to parse
 * @param {object} variables An object of variables from the file
 * @returns {Array}
 */
const parseGulpConfigSrc = (node, variables) => {
    const returnValue = [];
    if (node) {
        if (node.value.type === 'Literal') {
            // A single  source was specified
            returnValue.push(node.value.value);
        } else if (node.value.type === 'ArrayExpression') {
            // An array of CSS build sources was specified
            node.value.elements.forEach((element) => {
                if (element.type === 'Literal') {
                    returnValue.push(element.value);
                } else if (element.type === 'BinaryExpression') {
                    const binaryValue = parseGulpConfigBinaryExpression(element, variables);
                    if (binaryValue) {
                        returnValue.push(binaryValue);
                    }
                }
            });
        }
    }
    return returnValue;
}

/**
 * Parse the Gulp config file and pull out the copy and scripts arrays to include
 * in the build tools configuration.
 *
 * @param {string} configFile The config file name
 */
const parseGulpConfig = (configFile) => {
    let contents = '';
    if (fs.existsSync('gulp/config.js')) {
        // Newer Gulp configuration file
        contents = fs.readFileSync('gulp/config.js', 'utf8');
    } else if (fs.existsSync('config.js')) {
        // Older Gulp configuration file
        contents = fs.readFileSync('config.js', 'utf8');
    }
    if (contents) {
        // Parse the Javascript code
        const ast = acorn.parse(contents, { sourceType: 'module', ecmaVersion: 2020 });

        // The CSS source file(s) in the config file
        let cssSrc = [];
        // The array of files to copy in the config file
        let copy = [];
        // The array of scripts to process in the config file
        let scripts = [];

        // Variables in the config file. These are typically at the top of the file.
        let variables = {};

        // Walk through the code and pull out the parts we need
        acornWalk.fullAncestor(ast, (node) => {
            if (node.type === 'VariableDeclarator') {
                if (node.init.type === 'Literal') {
                    // This is a variable declaration with a literal value.
                    // We want to get the value of the variable in case we need it to build the value of another variable.
                    variables[node.id.name] = node.init.value;
                } else if (node.init.type === 'BinaryExpression') {
                    // This is a variable declaration with a binary expression value.
                    // We want to get the value of the variable in case we need it to build the value of another variable.
                    variables[node.id.name] = parseGulpConfigBinaryExpression(node.init, variables);
                }
            }
            if (node.type === 'Property') {
                // The node is a value within an object. We want certain properties
                // within the "config" object.
                if (node.key.name === 'paths') {
                    // This is the "paths" object specifying the paths for the build process.
                    // We want to pull out the CSS build paths. It would be something like this:
                    // paths: {
                    //     src: {
                    //         base: src,
                    //         css: [
                    //             src + '/css/main.css',
                    //         ],
                    //     }
                    // }
                    const srcPaths = node.value.properties.find((property) => property.key.name === 'src');
                    const cssSrcPath = srcPaths.value.properties.find((property) => property.key.name === 'css');
                    if (cssSrcPath) {
                        cssSrc = parseGulpConfigSrc(cssSrcPath, variables);
                    }
                } else if (node.key.name === 'styles') {
                    // This is a "styles" object specifying the CSS build paths in an older gulp config file.
                    // It would look something like this:
                    // styles: {
                    //     dest: destDir + '/css',
                    //     src: [srcDir + '/styles/index.css'],
                    //     watch: [srcDir + '/styles/**/*.css']
                    // }
                    const srcPaths = node.value.properties.find((property) => property.key.name === 'src');
                    if (srcPaths) {
                        cssSrc = parseGulpConfigSrc(srcPaths, variables);
                    }
                } else if (node.key.name === 'copy') {
                    // This is the "copy" array specifying the node_module files to copy.
                    // Parse the code to pull out the src and dest values. It would be something like this:
                    // copy: [
                    //     {
                    //         src: 'node_modules/@splidejs/splide/dist/**/*',
                    //         dest: 'splide'
                    //     },
                    // ]
                    copy = parseGulpConfigArrayObject(node, ['src', 'dest'], variables);
                } else if (node.key.name === 'scripts') {
                    // This is the "scripts" array specifying the Javascript files to parse.
                    // Parse the code to pull out the src and name values
                    // It could be something like this:
                    // scripts: [
                    //     {
                    //         name: 'main.js',
                    //         src: [
                    //             'node_modules/micromodal/dist/micromodal.min.js',
                    //             src + '/js/script-loader.js',
                    //             src + '/js/main.js'
                    //         ]
                    //     },
                    //     {
                    //         name: 'forms.js',
                    //         src: [
                    //             src + '/js/forms.js'
                    //         ]
                    //     }
                    // ]
                    //
                    // Or like this in an older gulp config file:
                    // scripts: [
                    //     {
                    //         name: 'index.js',
                    //         src: [
                    //             srcDir + '/scripts/modernizr-flexbox-detection.js',
                    //             'node_modules/jquery/dist/jquery.js',
                    //             'node_modules/ap_drilldown_plugin/ap-drilldown-menu.min.js',
                    //             srcDir + '/scripts/index.js'
                    //         ],
                    //         dest: destDir + '/js'
                    //     },
                    // ]
                    scripts = parseGulpConfigArrayObject(node, ['name', 'src', 'dest'], variables);
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

        // Build the CSS source data
        if (cssSrc.length > 0) {
            if (cssSrc.length === 1) {
                configContents.css = {
                    buildFiles: removePrefixes(cssSrc[0], ['src', 'css', 'styles', '/']),
                };
            } else {
                configContents.css = {
                    buildFiles: [],
                };
                cssSrc.forEach((cssItem) => {
                    configContents.css.buildFiles.push(removePrefixes(cssItem, ['src', 'css', 'styles', '/']));
                });
            }
        }

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
                copyObject.dest = removePrefixes(copyItem.dest, ['dist', 'build', 'theme', 'custom', '/']);
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
 * Rename the src/theme folder to src/templates
 */
const renameFolders = () => {
    if (fs.existsSync('src/theme')) {
        fs.renameSync('src/theme', 'src/templates');
        fancyLog(logSymbols.success, chalk.green('Renamed the "theme" folder to "templates"'));
    }
    if (fs.existsSync('src/scripts')) {
        fs.renameSync('src/scripts', 'src/js');
        fancyLog(logSymbols.success, chalk.green('Renamed the "scripts" folder to "js"'));
    }
    if (fs.existsSync('src/styles')) {
        fs.renameSync('src/styles', 'src/css');
        fancyLog(logSymbols.success, chalk.green('Renamed the "styles" folder to "css"'));
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
    // Rename the src/theme folder to src/templates
    renameFolders();
    // Initialize the environment
    await initialize(args, false);
    fancyLog(chalk.magenta('Installing packages...'));
    childProcess.execSync('npm install', { stdio: 'inherit' });
    fancyLog(logSymbols.success, chalk.green('Environment set up.'));
    fancyLog(logSymbols.success, chalk.green('Gulp build process converted.'));
    fancyLog(chalk.blue(`Compare the ${configFile} file to the gulp/config.js file to ensure the configuration is correct.
    Once you are done comparing the config files, remove the gulp/config.js file and the "gulp" folder.
    Then build the files with "npm run build", or start the watch process with "npm run watch", or do both with "npm run start".
    `));
};

export default gulpConvertHandler;
