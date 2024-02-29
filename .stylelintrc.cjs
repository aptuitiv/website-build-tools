/**
 * Stylelint configuration
 *
 * https://github.com/stylelint/stylelint/blob/main/docs/user-guide/configure.md
 */
module.exports = {
    "cache": false,
    "defaultSeverity": "warning", // So that stylelint won't stop on errors and the CSS will still build
    "rules": {
        "color-named": "never",
    }
}
