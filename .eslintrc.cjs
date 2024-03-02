/**
 * This is used with linting files in this package.
 * It is not used for linting files for the website that is using
 * these build tools. That configuration is on the src/javascript.js file.
 */
module.exports = {
    extends: ['@aptuitiv/eslint-config-aptuitiv'],
    rules: {
        // Allow importing Javascript files
        'import/extensions': 'off',
    }
}
