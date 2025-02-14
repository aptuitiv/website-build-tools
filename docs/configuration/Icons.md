# Icon configurations

Icon processing is configured with the `icons` configuration in the [configuration file](/docs/Configuration.md).

Icon SVG files are combined together as an icon sprite and output in a Twig file.

By default the `icons` folder is processed and output in the `snippets/svg-icons.twig` file in the `templates` folder.

You can configure multiple folders to be processed.

## Default configuration

The default `icons` configuration is:

```js
{
    icons: [
        {
            build: 'snippets/svg-icons.twig',
            src: 'icons',
        }
    ]
}
```

## Icon configuration

The `icons` array holds one or more objects that have the configuration for processing a set of SVG icons.

Each icon configuration has the following values:

- `build`: This is the path to the Twig file within the src templates folder that the icon sprite will be created in.
- `src`: This is the source folder for the svg icon files within the root source folder. (config.src)

## Changing the default configuration

You can change the default configuration. For example, if your folder is called "team-icons" you can do this:

```js
{
    icons: [
        {
            build: 'snippets/svg-icons.twig',
            src: 'team-icons',
        }
    ]
}
```

Note that both `build` and `src` must be set for each icon configuration.

## Include another folder to be processed

You can include another icon folder to be processed. If you do, you must also include all icon folders that will be processed.

```js
{
    icons: [
        {
            build: 'snippets/svg-icons.twig',
            src: 'icons',
        },
        {
            build: 'snippets/other-icons.twig',
            src: 'some-other-icons',
        }
    ]
}
```
