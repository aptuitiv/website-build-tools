import chokidar from 'chokidar';
import { deleteFile, deployFile } from './ftp.js';
import processCss from './css.js';

// Watch dist files for any changes and FTP the changes to the website.
// Do not delete a directory when unlinkDir is called. This is because
// it's possible to inadvertantly delete all files on the server if the
// dist folder is deleted.
// If you want to delete a folder via FTP then run
// node ftp.js --delete path/to/folder
chokidar
    .watch('dist/**/*', { ignoreInitial: true })
    .on('add', (path) => { deployFile(path); })
    .on('change', (path) => { deployFile(path); })
    .on('unlink', (path) => { deleteFile(path); });

// Watch for any CSS changes
chokidar
    .watch('src/css/**/*.css', { ignoreInitial: true })
    .on('all', () => { processCss() })
