/**
 * Configuration for the aptuitiv-build package.
 * See https://aptuitiv.github.io/website-build-tools/configuration for more information.
 */
export default {
    copy: [
    ],
    css: {
        buildFiles: 'main.css'
    },
    javascript: {
        bundles: [
            {
                build: 'main.js',
                src: [
                    'script-loader.js',
                    'iframe-loader.js',
                    'navigation.js',
                    'main.js'
                ]
            }
        ],
        files: []
    }
};