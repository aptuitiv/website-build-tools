# Build tools configuration

- [Build tools configuration](#build-tools-configuration)
  - [Configuration file](#configuration-file)
  - [Default configuration](#default-configuration)
  - [More information](#more-information)

## Configuration file

You can optionally set a configuration file to override any of the default configuration below. The following places are searched for the configurtation.

- An aptuitiv-build property in the `package.json` file.
- An `.aptuitiv-buildrc` file in JSON or YAML format.
- An `.aptuitiv-buildrc.json`, `.aptuitiv-buildrc.yaml`, `.aptuitiv-buildrc.yml`, `.aptuitiv-buildrc.js`, `.aptuitiv-buildrc.ts`, `.aptuitiv-buildrc.mjs`, or .`aptuitiv-buildrc.cjs` file.
- An `aptuitiv-buildrc`, `aptuitiv-buildrc.json`, `aptuitiv-buildrc.yaml`, `aptuitiv-buildrc.yml`, `aptuitiv-buildrc.js`, `aptuitiv-buildrc.ts`, `aptuitiv-buildrc.mjs`, or `aptuitiv-buildrc.cjs` file inside a `.config` subdirectory.
- An `aptuitiv-build.config.js`, `aptuitiv-build.config.ts`, `aptuitiv-build.config.mjs`, or `aptuitiv-build.config.cjs` file.

## Default configuration

Below is the default configuration.

```js
{
    build: {
        // The root build folder for the files to publish to the website. This is used when uploading files via FTP.
        base: 'dist',
        // The build folder path for all files for the theme. This is used when uploading files via FTP.
        theme: 'dist/theme/custom'
    },
    css: {
        // The folder for the CSS files within the theme build folder. (config.build.theme)
        build: 'css',
        // The glob for CSS file(s) that import the other CSS files.  This is used when building the files.
        // This is within the root source folder. (config.src)
        buildFiles: '*.css',
        // The source folder for the CSS files within the root source folder. (config.src)
        src: 'css',
    },
    // An array of file globs to copy and their destination folders
    copy: [],
    // Eslint linting configuration
    // https://eslint.org/docs/latest/use/configure/
    eslint: {},
    fonts: {
        // The folder for the fonts within the theme build folder. (config.build.theme)
        build: 'fonts',
        // The source folder for the fonts within the root source folder. (config.src)
        src: 'fonts'
    },
    icons: {
        // The path within the src templates folder that the icon sprite will be created in
        build: 'snippets/svg-icons.twig',
        // The source folder for the svg icon files within the root source folder. (config.src)
        src: 'icons',
    },
    images: {
        // The folder for the images within the theme build folder. (config.build.theme)
        build: 'images',
        // Image optimizations
        optimizations: {
            jpg: {
                mozjpeg: true,
                quality: 80,
                progressive: true
            },
            png: {
                quality: 80,
                progressive: true,
                compressionLevel: 6,
                adaptiveFiltering: true
            },
            webp: {
                quality: 80,
                lossless: false,
                smartSubsample: true
            }
        },
        // The source folder for the image files within the root source folder. (config.src)
        src: 'images'
    },
    javascript: {
        // The folder for the javascript files within the theme build folder. (config.build.theme)
        build: 'js',
        // An array of file globs to bundle and their destination folder
        bundles: [],
        // An array of file globs to process.
        files: [],
        // The source folder for the javascript files within the root source folder. (config.src)
        src: 'js'
    },
    // The root folder for all the project files. If the user needs to change this they should put
    // it as the absolute path to the root of their project.
    root: process.cwd(),
    // The root folder to the source files.
    src: 'src',
    // Stylelint configuration options
    // https://stylelint.io/user-guide/configure
    stylelint: {},
    templates: {
        // The folder for the theme twig templates within the theme build folder. (config.build.theme)
        build: 'templates',
        // The source folder for the theme twig templates within the root source folder. (config.src)
        src: 'theme'
    },
    themeConfig: {
        // The folder for the theme config files within the theme build folder. (config.build.theme)
        build: 'config',
        // The source folder for the theme config files within the root source folder. (config.src)
        src: 'config'
    },
}
```

## More information

- [Configuring CSS](configuration/Css.md).
- [Configuring Javascript](configuration/Javascript.md)
