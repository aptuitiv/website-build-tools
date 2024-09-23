/**
 * This is used with linting files in this package.
 * It is not used for linting files for the website that is using
 * these build tools. That configuration is on the src/javascript.js file.
 */

import aptuitivEslint from '@aptuitiv/eslint-config-aptuitiv';

export default [
    // Because @aptuitiv/eslint-config-aptuitiv exports an array of objects, we need to use the spread operator.
    ...aptuitivEslint,
    {
        rules: {
            // Allow importing Javascript files
            'import/extensions': 'off',
        },
    },

];
