# Aptuitiv website build tools

Build tools to help with building and deploying websites at Aptuitiv.

- [Aptuitiv website build tools](#aptuitiv-website-build-tools)
  - [Calling the script](#calling-the-script)
  - [Configuration](#configuration)
    - [Default configuration](#default-configuration)
  - [CSS actions](#css-actions)
    - [Process all CSS files](#process-all-css-files)
    - [Process a specific file](#process-a-specific-file)
    - [Lint CSS files with stylelint](#lint-css-files-with-stylelint)
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
  - [Watch action](#watch-action)

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

The other way is using the command line.

```bash
aptuitiv-build pull-template
```

If you're not calling the script from the base directory of your project then you must pass the `--root` argument so that the correct folders paths are used.

```bash
aptuitiv-build pull-template --root path/to/my/project/root
```

Or you can do a relative path to the root from the current directory.

```bash
aptuitiv-build pull-template --root ../../
```

## Configuration

You can optionally set a configuration file to override any of the default configuration below. The following places are searched for the configurtation.

- An aptuitiv-build property in the `package.json` file.
- An `.aptuitiv-buildrc` file in JSON or YAML format.
- An `.aptuitiv-buildrc.json`, `.aptuitiv-buildrc.yaml`, `.aptuitiv-buildrc.yml`, `.aptuitiv-buildrc.js`, `.aptuitiv-buildrc.ts`, `.aptuitiv-buildrc.mjs`, or .`aptuitiv-buildrc.cjs` file.
- An `aptuitiv-buildrc`, `aptuitiv-buildrc.json`, `aptuitiv-buildrc.yaml`, `aptuitiv-buildrc.yml`, `aptuitiv-buildrc.js`, `aptuitiv-buildrc.ts`, `aptuitiv-buildrc.mjs`, or `aptuitiv-buildrc.cjs` file inside a `.config` subdirectory.
- An `aptuitiv-build.config.js`, `aptuitiv-build.config.ts`, `aptuitiv-build.config.mjs`, or `aptuitiv-build.config.cjs` file.

### Default configuration

Below is the default configuration.

```js
{
    build: {
        // The root build folder for the files to publish to the website. This is used when uploading files via FTP.
        base: 'dist',
        // The build folder for templates
        templates: 'dist/theme/custom/templates',
        // The build folder path for all files for the theme. This is used when uploading files via FTP.
        theme: 'dist/theme/custom'
    },
    css: {
        // The base CSS file(s) that import the other CSS files. This is used when building the files.
        base: 'src/css/*.css',
        // The glob for all CSS files. This is used when linting CSS files.
        src: 'src/css/**/*.css'
    },
    copy: [],
    // The root folder for the source files. If the user needs to change this they should put
    // it as the absolute path to the root of their project.
    root: process.cwd(),
    // Stylelint configuration options
    // https://stylelint.io/user-guide/options
    // You can set any valid options here
    stylelint: {
        // Set the absolute path to the directory that relative paths defining "extends", "plugins", and "customSyntax" are relative to.
        // Only necessary if these values are relative paths.
        // This is set to the root of the aptuitiv-build project folder.
        // Override to your project's base directory if you want to use your own stylelint config file.
        // If overridden, this must be the absolute path to the base directory of the project.
        configBasedir: dirname(__dirname),
        // The path to the configuration file.
        // This is set to the file path in the root of the aptuitiv-build project folder.
        // Override to the absolute path to the file in your project if you want to use your own stylelint config file.
        configFile: `${dirname(__dirname)}/.stylelintrc.cjs`
    },
    // The source files for the theme twig templates
    template: {
        src: 'src/theme'
    }
}
```

## CSS actions

### Process all CSS files

```bash
aptuitiv-build css
```

Don't lint while processing.

```bash
aptuitiv-build css --no-lint
```

### Process a specific file

```bash
aptuitiv-build css -f main.css
aptuitiv-build css --file main.css
```

The `file` argument should be the path to the CSS file within the base CSS folder, which is typically `src/css`.

Don't lint while processing.

```bash
aptuitiv-build css -f main.css --no-lint
```

### Lint CSS files with stylelint

`css-lint` and `stylelint` are aliases of each other.

Lint all files.

```bash
aptuitiv-build css-lint
aptuitiv-build stylelint
```

Lint a specific file.

```bash
aptuitiv-build stylelint -p 'src/css/base/typography.css'
```

Lint a glob of files.

```bash
aptuitiv-build stylelint -p 'src/css/base/*'
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

## Watch action

Watch all files for changes.

```bash
aptuitiv-build watch
```
