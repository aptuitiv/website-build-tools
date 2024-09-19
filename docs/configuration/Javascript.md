# Javascript configuration

In the [configuration file](/docs/Configuration.md) you will want to set up how the Javscript files will be built. You can also configure [eslint](https://eslint.org/) processing.

- [Javascript configuration](#javascript-configuration)
  - [Processing Javscript files](#processing-javscript-files)
    - [Javascript bundles](#javascript-bundles)
    - [Single Javascript files](#single-javascript-files)
    - [Building Javascript files with eslint](#building-javascript-files-with-eslint)
      - [Configure the entry point files](#configure-the-entry-point-files)
      - [Configuring esbuild](#configuring-esbuild)
  - [Linting Javascript](#linting-javascript)
  - [Minify Javascript](#minify-javascript)

## Processing Javscript files

There are three ways that Javascript files can be processed.

1. As a bundle with the `javascript.bundles` configuration array. This will join files together and output them in a single file in the build folder as a minified file. It does not support importing. It simply concats the files together in the order that they are configured.
2. As a single file that is minified and then output in the build folder. The only processing is to minimize the file. This is ideal for simple files.
3. Build the Javascript files with [esbuild](https://esbuild.github.io/). This option is ideal for more complex Javascript. It supports importing during the build process. The output is a minimized file in the [IIFE](https://esbuild.github.io/api/#format-iife) format.

### Javascript bundles

You can concat Javascript files together and minify the output before saving to the build folder. The `javascript.bundles` configuration array holds that inforamation.

The `javascript.bundles` array holds an array of objects that specify each bundle.

Each bundle object can have the following values.

- _build_ (Required) (string) The name of the bundled file that will be output in the Javascript build directory (`javascript.build`) and optionally a directory path. if you're ok with the file going in the `javascript.build` path then this can just be the file name.
- _nodeModules_ (string|array) A string containing the path to a single file or glob to include in the bundle from the `node_modules` folder. Or, an array of files or globs to include in the bundle from the `node_modules` folder. The path should start with the package name and not with the `node_modules` folder.
- _src_ (string|array) A string containing the path to a single file or glob in the Javascript src folder (`javascript.src`) to include in the bundle. Or, an array of files or globs in the Javascript source folder to include in the bundle. The path should start within the Javascript source folder and not include the source folder name.

In addition to `build`, you must at least set `nodeModules` or `src`. You can set both.
Here are some examples:

```js
{
  javascript: {
    bundles: [
      {
        build: 'name-of-file.js',
        src: 'folder/**/*.js',
      }
    ]
  }
}
```

```js
{
  javascript: {
    bundles: [
      {
        build: 'name-of-file.js',
        src: [
          'file1.js',
          'folder/file2.js',
          'another-file.js',
          'glob-folder/*.js'
        ]
      }
    ]
  }
}
```

```js
{
  javascript: {
    bundles: [
      {
        build: 'path/to/name-of-file.js',
        nodeModules: [
          'packageName/path/to/file.js',
          'anotherPackage/path/**/*.js'
        ],
        src: [
          'some-file.js',
          'folder/*.js'
        ]
      }
    ]
  }
}
```

```js
{
  javascript: {
    bundles: [
      {
        build: 'name-of-file.js',
        nodeModules: 'anotherPackage/path/**/*.js',
        src: 'some-file.js',
      }
    ]
  }
}
```

### Single Javascript files

If you don't need to bundle a file with another set of files then you can use the `javascript.files` configuration array to specify files to minify and copy to the build directory.

The `javascript.files` array is an array of file paths where the file path starts in the Javascript source directory (`javascript.src`).

```js
{
  javascript: {
    files: [
      'filename.js',
      'subFolder/my-file.js'
    ]
  }
}
```

The files are minified and output in the build directory in the Javascript build directory (`javascript.build`) with the same file name and path.

### Building Javascript files with eslint

If your Javascript is more complex and you want to utilize importing files then this is the best option.

#### Configure the entry point files

You configure an entry file for your Javascript and in that file you can import other files. The other files can also have their own imports if you want.

You set the entry points with the `javascript.entryPoints` configuration array. There are two ways to set the entry points.

Set a simple array of file names/paths within the Javascript source directory (`javascript.src`). The files will be built with the same name as the entrypoint file in the Javascript build directory (`javascript.build`).

```js
{
    javascript: {
        entryPoints: [
            'filename.js',
            'path/filename2.js'
        ]
    } 
}
```

Set an array of objects that specify the `in` file (i.e. the entry point file) and the name/path of the `out` file. This is useful if you want to change the name of the output file, or you need to output the file in a subdirectory within the Javascript build directory (`javascript.build`).

**The `out` value should not contain the file extension. `.js` is automatically added to the `out` value by esbuild.**

```js
{
    javascript: {
        entryPoints: [
            { in: 'file.js', out: 'other-name' },
            { in: 'path/filename2.js', out: 'some-path/file-out'}
        ]
    } 
}
```

You can combine both approaches.

```js
{
    javascript: {
        entryPoints: [
            { in: 'file.js', out: 'other-name' },
            { in: 'path/filename2.js', out: 'some-path/file-out'},
            'my-file.js'
        ]
    } 
}
```

You can leave out the `out` value. If you do then the output file name will match the `in` file name and it will be built in the root of the Javascript build directory (`javascript.build`).

```js
{
    javascript: {
        entryPoints: [
            { in: 'file.js' },
        ]
    } 
}
```

#### Configuring esbuild

The default [esbuild](https://esbuild.github.io/) configuration that can be overridden is:

```js
{
    minify: true,
}
```

We don't recommend that you override the default configuration, but you technically can. You could also set other esconfig configuration. Your configuration object will be merged with the default configuration.

Some reasons to add your own esbuild configuration include:

- You need to expose a global variable to other Javascript. In this case you'd want to set the [globalName](https://esbuild.github.io/api/#global-name) parameter. This option only matters when the `format` setting is `iife` (which stands for immediately-invoked function expression as is the default format). It sets the name of the global variable which is used to store the exports from the entry point.
- You need to include some legal comments with the output file. Use the [legalComments](https://esbuild.github.io/api/#legal-comments) parameter.

There are two ways to set the esbuild configuration.

Set the configuration in the `javascript.esConfig` value:

```js
{
    javascript: {
        entryPoints: [
            'my-file.js'
        ],
        esConfig: {
            globalName: 'myObject',
            legalComments: 'inline'
        }
    } 
}
```

Set the configuration in the `javascript.entryPoints` array. You would do this by setting the entry point file as an object. While it's recommended to set the `out` value, you don't have to. Set the configuration with the `config` value in the file object.

```js
{
    javascript: {
        entryPoints: [
            { in: 'file.js', out: 'outfile', config: { globalName: 'fileObject' } },
            { in: 'path/filename2.js', out: 'some-path/file-out'},
            { in: 'other-file.js', config: { globalName: 'myFile' } },
        ]
    } 
}
```

If no configuration is set in the file object and the `javascript.esConfig` option is not set, then only the default esbuild configuration will be used.

If the `javascript.esConfig` option is set and the `config` value is set in the file option, then they will both be merged into the esbuild configuration. First the `javascript.esConfig` value and then the `config` value for the individual entry point.

You can use any of the configuration parameters for [esbuild](https://esbuild.github.io/).

## Linting Javascript

Javascript files are linted with [eslint](https://eslint.org/). Only files within the `javascript.src` directory are linted. This means that you don't have to worry about setting up ignore rules for the build folder or other folders.

You can override the existing [eslint configuration](https://eslint.org/docs/latest/use/configure/) with your own configuration in the `eslint` section of the configuration file.

The base configuration is simple and only extends [@aptuitiv/eslint-config-aptuitiv](https://github.com/aptuitiv/eslint-config-aptuitiv).

```js
{
    extends: ['@aptuitiv/eslint-config-aptuitiv']
}
```

This means that you are safe to set any valid eslint configuration and it won't completely overwrite an existing configuration.

> **The only thing you cannot overwrite is the `extends` configuration.** The packages referenced in the `extends` configuration are loaded from the `@aptuitiv/website-build-tools` package. If you try to set your own `extends` configuration then your packages won't load because they don't exist in the `@aptuitiv/website-build-tools` package. Instead, consider an update to the `@aptuitiv/website-build-tools` package or use the `rules` eslint configuration.

Typically, the only configuration that you may need to do is to add some ignore patterns. For example, to ignore the Javascript for [fslightbox](https://fslightbox.com/) you might do something like this:

```js
eslint: {
    ignorePatterns: ['fslightbox.js']
}
```

If you're just ignoring files, you could also add a `.eslintignore` file in your project root. But, for consistency with keeping all build functionality in one place, we recommend that you put any eslint ignores in the configuration file as described above.

## Minify Javascript

By default Javascript files are minified when they are processed. We use [terser](https://terser.org/) to handle the minification.

The default minify options are:

```js
{
    compress: {
        defaults: false,
    },
    mangle: false,
}
```

You can alter the minify process with the `javascript.minify` configuration option.

There are two things you can do with the `javascript.minify` option.

First, you can pass different minify options to terser. Set `javascript.minify` to be an object containing any valid [terser options](https://terser.org/docs/api-reference/#minify-options) and they will be merged with the existing options.

```js
{
    javascript: {
        minify:  {
            compress: {
                collapse_vars: false,
                defaults: false,
            },
            mangle: true,
            keep_classnames: true
        }
    }
}
   
```

Secondly, you can cancel the minification by either setting `javascript.minify` to `false`, or by settings `javascript.minify.compress` to false.

```js
{
    javascript: {
        minify: false
    }
}
```

```js
{
    javascript: {
        minify:  {
            compress: false
        }
    }
}
```
