# Aptuitiv website build tools

Build tools to help with building and deploying websites at Aptuitiv.

- [Aptuitiv website build tools](#aptuitiv-website-build-tools)
  - [Calling the script](#calling-the-script)
  - [FTP upload actions](#ftp-upload-actions)
    - [Upload all files in the build directory](#upload-all-files-in-the-build-directory)
    - [Upload the theme files in the build theme directory](#upload-the-theme-files-in-the-build-theme-directory)
    - [Upload a single file](#upload-a-single-file)
    - [Upload a folder](#upload-a-folder)
    - [Upload a glob of files](#upload-a-glob-of-files)
  - [FTP download actions](#ftp-download-actions)
    - [Download a folder](#download-a-folder)
    - [Download a file](#download-a-file)
    - [Download all the theme files](#download-all-the-theme-files)
  - [FTP delete actions](#ftp-delete-actions)
    - [Delete a file](#delete-a-file)
    - [Delete a folder](#delete-a-folder)
  - [Template actions](#template-actions)
    - [Pull template files](#pull-template-files)
    - [Push template files](#push-template-files)

## Calling the script

There are two ways to call the script.

The first, and recommended way is to call this from the `scripts` section of your `package.json` file.

```json
"scripts": {
    "start": "npm run watch",
    "pull-template": "aptuitiv-build pull-template",
    "push-template": "aptuitiv-build push-template",
    "watch": "aptuitiv-build watch"
}
```

The other way is using the command line and `npx`.

```bash
npx aptuitiv-build pull-template
```

If you're not calling the script from the base directory of your project then you must pass the `--root` argument so that the correct folders paths are used.

```bash
npx aptuitiv-build pull-template --root path/to/my/project/root
```

Or you can do a relative path to the root from the current directory.

```bash
npx aptuitiv-build pull-template --root ../../
```

## FTP upload actions

Upload files or directories to the website via FTP.

### Upload all files in the build directory

```bash
aptuitiv-build upload
```

### Upload the theme files in the build theme directory

```bash
aptuitiv-build upload -t
aptuitiv-build upload --theme
```

### Upload a single file

```bash
aptuitiv-build upload -p 'dist/theme/custom/css/main.css'
aptuitiv-build upload --path 'dist/theme/custom/css/main.css'
```

Or the build folder can be left off.

```bash
aptuitiv-build upload -p 'theme/custom/css/main.css'
aptuitiv-build upload --path 'theme/custom/css/main.css'
```

### Upload a folder

```bash
aptuitiv-build upload -p 'dist/theme/custom/css'
aptuitiv-build upload --path 'dist/theme/custom/css'
```

Or the build folder can be left off.

```bash
aptuitiv-build upload -p 'theme/custom/css'
aptuitiv-build upload --path 'theme/custom/css'
```

### Upload a glob of files

```bash
aptuitiv-build upload -p 'dist/theme/custom/js/*'
aptuitiv-build upload --path 'dist/theme/custom/js/*'
```

Or the build folder can be left off.

```bash
aptuitiv-build upload -p 'theme/custom/js/**/*.js'
aptuitiv-build upload --path 'theme/custom/js/**/*.js'
```

## FTP download actions

Download files or directories from the website via FTP.

### Download a folder

```bash
aptuitiv-build download -p 'dist/theme/custom/js'
aptuitiv-build download --path 'dist/theme/custom/js'
```

Or the build folder can be left off.

```bash
aptuitiv-build download -p 'theme/custom/js'
aptuitiv-build download --path 'theme/custom/js'
```

### Download a file

```bash
aptuitiv-build download -p 'dist/theme/custom/js/main.js'
aptuitiv-build download --path 'dist/theme/custom/js/main.js'
```

Or the build folder can be left off.

```bash
aptuitiv-build download -p 'theme/custom/js/main.js'
aptuitiv-build download --path 'theme/custom/js/main.js'
```

### Download all the theme files

```bash
aptuitiv-build download -t
aptuitiv-build download --theme
```

## FTP delete actions

Delete a file or folder.

### Delete a file

```bash
aptuitiv-build delete -p 'dist/theme/custom/js/main.js'
aptuitiv-build delete --path 'dist/theme/custom/js/main.js'
```

Or the build folder can be left off.

```bash
aptuitiv-build delete -p 'theme/custom/js/main.js'
aptuitiv-build delete --path 'theme/custom/js/main.js'
```

### Delete a folder

```bash
aptuitiv-build delete -p 'dist/theme/custom/js'
aptuitiv-build delete --path 'dist/theme/custom/js'
```

Or the build folder can be left off.

```bash
aptuitiv-build delete -p 'theme/custom/js'
aptuitiv-build delete --path 'theme/custom/js'
```

## Template actions

### Pull template files

Copy the template files from the build folder to the source folder. This is typically done after downloading the template files via FTP.

```bash
aptuitiv-build pull-template
```

### Push template files

Copy the template files from the source folder to the build folder.

```bash
aptuitiv-build push-template
```
