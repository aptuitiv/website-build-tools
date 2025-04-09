/* global smallScreenNav, navAccess */

/**
 * Initializes all Javascript bundled into main.js
 * See gulp/config.js for all script =s being bundled
 */
const init = () => {
    smallScreenNav.init();
    navAccess.init();
};

// Wait until page is ready before running any scripts
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}
