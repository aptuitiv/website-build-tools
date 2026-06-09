/* ===========================================================================
    OS notification helper

    Sends a desktop notification that something happened (e.g. files were
    uploaded). Uses native OS tooling so there are no bundled binaries to keep
    up to date.

    Currently only macOS is supported (via osascript). Other platforms are a
    no-op until support is added. A failed notification must never interrupt
    the build, so all errors are swallowed.
=========================================================================== */

import { spawn } from 'node:child_process';
import process from 'process';

/**
 * Escape a string so it is safe to embed inside an AppleScript double-quoted
 * string literal.
 *
 * @param {string} value The value to escape
 * @returns {string}
 */
const escapeAppleScript = (value) => String(value).replace(/(["\\])/g, '\\$1');

/**
 * Send a notification on macOS using osascript.
 *
 * @param {string} title The notification title
 * @param {string} message The notification message
 * @param {string|boolean} sound The sound to use for the notification. This is only used on macOS.
 */
const notifyMac = (title, message, sound) => {
    let script = `display notification "${escapeAppleScript(message)}" with title "${escapeAppleScript(title)}"`;
    if (sound) {
        const soundName = typeof sound === 'string' ? sound : 'Glass';
        script += ` sound name "${escapeAppleScript(soundName)}"`;
    }
    const child = spawn('osascript', ['-e', script], { stdio: 'ignore' });
    child.on('error', () => {});
    child.unref();
};

/**
 * Send a desktop notification.
 *
 * Silently does nothing on unsupported platforms or if the notification fails.
 *
 * @param {object} options The notification options
 * @param {string} options.title The notification title
 * @param {string} options.message The notification message
 * @param {string|boolean} options.sound The sound to use for the notification. This is only used on macOS.
 */
export const notify = ({ title, message, sound }) => {
    try {
        if (process.platform === 'darwin') {
            notifyMac(title, message, sound);
        }
        // TODO: Add Windows (e.g. PowerShell BurntToast) and Linux support as
        // needed. Other platforms are intentionally a no-op for now.
    } catch {
        // Swallow errors. A missed notification should never break the build.
    }
};

export default notify;
