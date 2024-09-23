# Build tools configuration

- [Build tools configuration](#build-tools-configuration)
  - [Configuration file](#configuration-file)
  - [Configuration options](#configuration-options)
    - [Build configuration](#build-configuration)
    - [Font configuration](#font-configuration)
    - [FTP configuration](#ftp-configuration)
    - [Icon configuration](#icon-configuration)
    - [Template configuration](#template-configuration)
    - [Theme configuration files configuration](#theme-configuration-files-configuration)
  - [More information](#more-information)

## Configuration file

You can optionally set a configuration file to override any of the default configuration below. The following places are searched for the configurtation.

- An `aptuitiv-build` property in the `package.json` file.
- An `.aptuitiv-buildrc` file in JSON or YAML format. We recommend that you add the correct extension to the file (e.g. `.json`) to end up with one of the following file names:
  - `.aptuitiv-buildrc.json`, `.aptuitiv-buildrc.yaml`, `.aptuitiv-buildrc.yml`
- An `.aptuitiv-buildrc.js`, `.aptuitiv-buildrc.ts`, `.aptuitiv-buildrc.mjs`, or `.aptuitiv-buildrc.cjs` file.
- `aptuitiv-build.config.mjs` or `.aptuitiv-buildrc.mjs` file using `export default` (ES module)
- `aptuitiv-build.config.cjs` or `.aptuitiv-buildrc.cjs` file using `module.exports` (CommonJS)
- An `aptuitiv-buildrc`, `aptuitiv-buildrc.json`, `aptuitiv-buildrc.yaml`, `aptuitiv-buildrc.yml`, `aptuitiv-buildrc.js`, `aptuitiv-buildrc.ts`, `aptuitiv-buildrc.mjs`, or `aptuitiv-buildrc.cjs` file inside a `.config` subdirectory.
- An `aptuitiv-build.config.js`, `aptuitiv-build.config.ts` file.

Which module system to use depends on your [default module system configuration](https://nodejs.org/api/packages.html#determining-module-system) for Node.js (e.g., `"type": "module"` in `package.json`).

ES module example:

```js
export default {
    "javascript": {
        "files": [
            "filename.js",
            "subFolder/my-file.js"
        ]
    }
};
```

CommonJS example:

```js
module.exports = {
    "javascript": {
        "files": [
            "filename.js",
            "subFolder/my-file.js"
        ]
    }
};
```

JSON example:

```json
{
    "javascript": {
        "files": ["file1.js", "test.js"]
    }
}
```

See these examples:

- [CommonJS (cjs)](configuration/examples/cjs.md)
- [ES Module (js)](configuration/examples/js.md)
- [JSON](configuration/examples/json.md)
- [YAML](configuration/examples/yaml.md)

## Configuration options

| Name | Default | Description |
| ---- | ------- | ----------- |
| build | | The [build folder configuration](#build-configuration). |
| build.base | 'dist' | The root build folder for the files to publish to the website. This is used when uploading files via FTP. |
| build.theme | 'dist/theme/custom' |  The build folder path for all files for the theme. This is used when uploading files via FTP. |
| css | | The [CSS configuration](configuration/Css.md). |
| css.build | 'css' | The folder for the CSS files within the theme build folder. (config.build.theme) |
| css.buildFiles | '*.css' | The glob for CSS file(s) that import the other CSS files.  This is used when building the files. This is within the root source folder. (config.src) |
| css.src | 'css' | The source folder for the CSS files within the root source folder. (config.src) |
| copy | [] | An array of file globs to copy and their destination folders. See [copy files action](actions/Copy-files.md). |
| eslint | {} | [Eslint configuration](configuration/Javascript.md#linting-javascript). |
| fonts | | [Font file configuration](#font-configuration). |
| fonts.build | 'fonts' | The folder for the fonts within the theme build folder. (config.build.theme) |
| fonts.src | 'fonts' | The source folder for the fonts within the root source folder. (config.src) |
| ftp | | FTP configuration. |
| ftp.notify | true | Whether to do a growl notification when a file is uploaded or deleted via FTP. |
| icons | | [Icon file configuration](#icon-configuration). |
| icons.build | 'snippets/svg-icons.twig' | The path to the Twig file within the src templates folder that the icon sprite will be created in. |
| icons.src | 'icons' | The source folder for the svg icon files within the root source folder. (config.src) |
| images | | [Image file configuration](configuration/Images.md). |
| images.build | 'images' | The folder for the images within the theme build folder. (config.build.theme) |
| images.optimizations | | [Image optimization configuration](configuration/Images.md#image-optimizations). |
| images.optimizations.jpg | | [JPG image optimization configuration](configuration/Images.md#jpg-optimizations) |
| images.optimizations.png | | [PNG image optimization configuration](configuration/Images.md#png-optimizations) |
| images.optimizations.webp | | [WebP image optimization configuration](configuration/Images.md#webp-optimizations) |
| images.src | 'images' | The source folder for the image files within the root source folder. (config.src) |
| javascript | | [Javascript configuration](configuration/Javascript.md). |
| javascript.build | 'js' | The folder for the javascript files within the theme build folder. (config.build.theme) |
| javascript.bundles | [] | An array of file globs to bundle and their destination folder. |
| javascript.entryPoints | [] | An array entry point files to build within the src folder using [esbuild](https://esbuild.github.io/). |
| javascript.esConfig | {} | An object containing custom configuration for [esbuild](https://esbuild.github.io/). |
| javascript.files | [] | An array of file globs to process. |
| javascript.minify | {} | Minification options for terser. |
| javascript.src | 'js' | The source folder for the javascript files within the root source folder. (config.src) |
| root | process.cwd() | The root folder for all the project files. If you need to change this then you should put it as the absolute path to the root of their project. |
| src | 'src' | The root folder to the source files. |
| stylelint | {} | [Stylelint configuration options](configuration/Css.md#linting-css-files). |
| templates | | [Twig template file configuration](#template-configuration). |
| templates.build | 'templates' | The folder for the theme twig templates within the theme build folder. (config.build.theme) |
| templates.src | 'templates' |  The source folder for the theme twig templates within the root source folder. (config.src) |
| themeConfig | | [Theme configuration files configuration](#theme-configuration-files-configuration). |
| themeConfig.build | 'config' | The folder for the theme config files within the theme build folder. (config.build.theme) |
| themeConfig.src | 'config' | The source folder for the theme config files within the root source folder. (config.src) |

### Build configuration

You can adjust the build folders with the `build` configuration.

```js
{
    build: {
        base: 'dist',
        theme: 'dist/theme/custom'
    }
}
```

### Font configuration

You can specify the build and source folders for the font files with the `fonts` configuration.

```js
{
    fonts: {
        build: 'fonts',
        src: 'fonts',
    }
}
```

### FTP configuration

You can configure the FTP behavior with the `ftp` configuration.

```js
{
    ftp: {
        notify: false
    }
}
```

### Icon configuration

You can configure the Twig file to build to and the source folder for the icons with the `icon` configuration.

```js
{
    icons: {
        build: 'snippets/svg-icons.twig',
        src: 'icons',
    }
}
```

### Template configuration

You can configure the Twig template file build and source folders with the `templates` configuration.

```js
{
    templates: {
        build: 'templates',
        src: 'templates',
    }
}
```

### Theme configuration files configuration

You can configure the theme configuration file build and source folders with the `themeConfig` configuration.

```js
{
     themeConfig: {
        build: 'config',
        src: 'config',
    }
}
```

## More information

- [Configuring CSS](configuration/Css.md).
- [Configuring Javascript](configuration/Javascript.md)
