# Aptuitiv website build tools

Build tools to help with building and deploying websites at Aptuitiv.

- [Aptuitiv website build tools](#aptuitiv-website-build-tools)
  - [Calling the script](#calling-the-script)
  - [Configuration](#configuration)
    - [Default configuration](#default-configuration)
  - [Copy file actions](#copy-file-actions)
  - [CSS actions](#css-actions)
    - [Process all CSS files](#process-all-css-files)
    - [Process a specific file](#process-a-specific-file)
    - [Lint CSS files with stylelint](#lint-css-files-with-stylelint)
  - [Export action](#export-action)
  - [Font action](#font-action)
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
  - [Icon action](#icon-action)
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
    "pull-templates": "aptuitiv-build pull-templates",
    "push-templates": "aptuitiv-build push-templates",
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
    // An array of file globs and their destination folder
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

## Copy file actions

Often you'll need to copy files from the `node_modules` folder to your build folder to deploy to your website. The easiest way to do this is to set up your own configuration file and set the `copy` value.

Here is an example of a JSON configuration file with the `copy` configuration.

```json
{
  "copy": [
    {
      "src": [
        "node_modules/@splidejs/splide/dist/css/splide.min.css",
        "node_modules/@splidejs/splide/dist/js/splide.min.js",
        "node_modules/@splidejs/splide-extension-video/dist/js/splide-extension-video.min.js",
        "node_modules/@splidejs/splide-extension-video/dist/css/splide-extension-video.min.css"
      ],
      "dest": "splide"
    },
    {
      "src": "node_modules/just-validate/dist/just-validate.production.min.js",
      "dest": "just-validate"
    }
  ]
}
```

Each object in the `copy` array should have a `src` value and a `dest` value.

The `src` value can be a string matching a single file, a string glob, and array of of files, or an array of globs.

The `dest` value is the folder within the theme build folder to copy the files to.

The command line call to copy files is:

```bash
aptuitiv-build copy
```

The copy `src` paths will be watched and re-copied if they change while the [watch](#watch-action) process is running.

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

## Export action

You can export the site source files to make it easier to copy them to another site. They are exported to the `_export` folder in the project root folder.

```bash
aptuitiv-build export
```

## Font action

You can copy the fonts from the source folder to the build folder.

```bash
aptuitiv-build push-fonts
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

## Icon action

The icon action will combine all SVG icons into a sprite file. The file will be a Twig template in the snippets folder. By default it's called `svg-icons.twig`.

```bash
aptuitiv-build icons
```

## Template actions

### Pull template files

Copy the template files from the build folder to the source folder. This is typically done after downloading the template files via FTP.

```bash
aptuitiv-build pull-templates
```

### Push template files

Copy the template files from the source folder to the build folder.

```bash
aptuitiv-build push-templates
```

## Watch action

Watch all files for changes.

```bash
aptuitiv-build watch
```
