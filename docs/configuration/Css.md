# CSS configuration

In the [configuration file](/docs/Configuration.md) you will want to set up how the CSS files will be built. You can also configure [stylelint](https://stylelint.io/) processing.

## Processing CSS files

The `css.buildFiles` configuration references the base CSS files in the source folder (`css.src`). The value can be a string or an array.

If it's a string then it should be a path to a single CSS file or a glob referencing one or more files.

```js
{
  "css": "main.css"
}
```

```js
{
  "css": "*.css"
}
```

If the value is an array then it should be an array of file paths or globs.

```js
{
  "css": [
    "*.css",
    "folder/other-file.css"
  ]
}
```

```js
{
  "css": [
    "main.css",
    "other-file.css"
  ]
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
