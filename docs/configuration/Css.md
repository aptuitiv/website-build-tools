# CSS configuration

In the [configuration file](/docs/Configuration.md) you will want to set up how the CSS files will be built. You can also configure [stylelint](https://stylelint.io/) processing.

The default CSS configuration is:

```js
css: {
    build: 'css',
    buildFiles: '*.css',
    src: 'css',
}
```

- _build_: The folder for the CSS files within the theme build folder. (config.build.theme)
- _buildFiles_: The glob for CSS file(s) that import the other CSS files.  This is used when building the files. This is within the root source folder. (config.src)
- _src_: The source folder for the CSS files within the root source folder. (config.src)

## Processing CSS files

The `css.buildFiles` configuration references the base CSS files in the source folder (`css.src`). The value can be a string or an array.

If it's a string then it should be a path to a single CSS file or a glob referencing one or more files.

```js
{
  css: {
    buildFiles: "main.css"
  }
}
```

```js
{
  css: {
    buildFiles: "*.css"
  }
}
```

If the value is an array then it should be an array of file paths or globs.

```js
{
  css: {
    buildFiles: [
        "*.css",
        "folder/other-file.css"
      ]
  }
}
```

```js
{
  css: {
    buildFiles: [
        "main.css",
        "other-file.css"
      ]
  }
}
```

## Linting CSS files

CSS files are linted with [Stylelint](https://stylelint.io/). Only files withint the `css.src` directory are linted.

The default configuration is:

```js
{
    cache: true,
    defaultSeverity: 'warning', // So that stylelint won't stop on errors and the CSS will still build
    extends: ['stylelint-config-standard'],
    fix: true,
    plugins: ['stylelint-order', 'stylelint-selector-bem-pattern'],
    reportDescriptionlessDisables: true, // https://github.com/stylelint/stylelint/blob/main/docs/user-guide/options.md#reportdescriptionlessdisables
    reportInvalidScopeDisables: true, // https://github.com/stylelint/stylelint/blob/main/docs/user-guide/options.md#reportinvalidscopedisables
    reportNeedlessDisables: true, // https://github.com/stylelint/stylelint/blob/main/docs/user-guide/options.md#reportneedlessdisables
    rules: {
        'at-rule-no-unknown': [true, {
            // Done to support the @extend, @define-placeholder, @define-extend, and @extend-define rule from https://github.com/travco/postcss-extend
            ignoreAtRules: ['extend', 'define-placeholder', 'define-extend', 'extend-define'],
        },
        'color-named': 'never',
        // Override the stylelint-config-standard rule to allow custom properties in formats that aren't kebab-case
        'custom-property-pattern': null,
        'import-notation': 'string',
        'order/properties-alphabetical-order': true,
        // Set the BEM pattern rule
        'plugin/selector-bem-pattern': {
            'ignoreCustomProperties': ['.*'],
            'preset': 'suit',
            'utilitySelectors': '^\\.(?:[a-z][a-z-0-9]*)+$'
        },
        'selector-class-pattern': null,
        'selector-id-pattern': null
    }
}
```

You can override the default configuration in the `stylelint` section of the [configuration file](/docs/Configuration.md).

For example:

```js
{
     stylelint: {
        rules: {
            "color-hex-alpha": "never"
        }
    }
}
```

Any configuration set in `stylelint` are merged with the default configuration.
