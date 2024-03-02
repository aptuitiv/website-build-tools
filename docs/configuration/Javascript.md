# Javascript configuration

In the [configuration file](/docs/Configuration.md) you will want to set up how the Javscript files will be built. You can also configure [eslint](https://eslint.org/) processing.

- [Javascript configuration](#javascript-configuration)
  - [Processing Javscript files](#processing-javscript-files)
    - [Javascript bundles](#javascript-bundles)
    - [Single Javascript files](#single-javascript-files)
  - [Linting Javascript](#linting-javascript)

## Processing Javscript files

There are two ways that Javascript files can be processed.

1. As a bundle with the `javascript.bundles` configuration array. This will join files together and output them in a single file in the build folder.
2. As a single file that is minified and then output in the build folder.

### Javascript bundles

Javascript files are often bundled together and minified before saving to the build folder. The `javascript.bundles` configuration array holds that inforamation.

The `javascript.budles` array holds an array of objects that specify each bundle.

Each bundle object can have the following values.

- _name_ (Required) (string) The name of the bundled file that will be output in the Javascript build directory (`javascript.build`).
- _node_modules_ (string|array) A string containing the path to a single file or glob to include in the bundle from the `node_modules` folder. Or, an array of files or globs to include in the bundle from the `node_modules` folder. The path should start with the package name and not with the `node_modules` folder.
- _src_ (string|array) A string containing the path to a single file or glob in the Javascript src folder (`javascript.src`) to include in the bundle. Or, an array of files or globs in the Javascript source folder to include in the bundle. The path should start within the Javascript source folder and not include the source folder name.

In addition to `name`, you must at least set `node_modules` or `src`. You can set both.
Here are some examples:

```js
{
  "javascript": {
    "bundles": [
      {
        "name": "name-of-file.js",
        "src": "folder/**/*.js",
      }
    ]
  }
}
```

```js
{
  "javascript": {
    "bundles": [
      {
        "name": "name-of-file.js",
        "src": [
          "file1.js",
          "folder/file2.js",
          "another-file.js",
          "glob-folder/*.js"
        ]
      }
    ]
  }
}
```

```js
{
  "javascript": {
    "bundles": [
      {
        "name": "name-of-file.js",
        "node_modules": [
          "packageName/path/to/file.js",
          "anotherPackage/path/**/*.js"
        ],
        "src": [
          "some-file.js",
          "folder/*.js"
        ]
      }
    ]
  }
}
```

```js
{
  "javascript": {
    "bundles": [
      {
        "name": "name-of-file.js",
        "node_modules": "anotherPackage/path/**/*.js",
        "src": "some-file.js",
      }
    ]
  }
}
```

### Single Javascript files

If you don't need to bundle a file with another set of files then you can use the `javascript.files` configuration array to specify files to minify and copy to the build directory.

The `javascript.files` arary is an array of file paths where the file path starts in the Javascript source directory (`javascript.src`).

```js
{
  "javascript": {
    "files": [
      "filename.js",
      "subFolder/my-file.js"
    ]
  }
}
```

The files are minified and output in the build directory in the Javascript build directory (`javascript.build`) with the same file name and path.

## Linting Javascript

Javascript files are linted with [eslint](https://eslint.org/). Only files within the `javascript.src` directory are linted. This means that you don't have to worry about setting up ignore rules for the build folder or other folders.

You can override the existing [eslint configuration](https://eslint.org/docs/latest/use/configure/) with your own configuration in the `eslint` section of the configuration file.

The base configuration is simple and only extends [@aptuitiv/eslint-config-aptuitiv](https://github.com/aptuitiv/eslint-config-aptuitiv).

```js
{
    extends: ['@aptuitiv/eslint-config-aptuitiv']
}
```

This means that you are safe to set any valid eslint configuration and it won't completely overwrite an existing configuration (unless you set `extends`).

Typically, the only configuration that you may need to do is to add some ignore patterns. For example, to ignore the Javascript for [fslightbox](https://fslightbox.com/) you might do something like this:

```json
"eslint": {
    "ignorePatterns": ["fslightbox.js"]
}
```

If you're just ignoring files, you could also add a `.eslintignore` file in your project root. But, for consistency with keeping all build functionality in one place, we recommend that you put any eslint ignores in the configuration file as described above.
