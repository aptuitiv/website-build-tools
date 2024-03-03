# Aptuitiv website build tools

Build tools to help with building and deploying websites at Aptuitiv.

## Usage

There are two ways to call the build tools.

The first, and recommended way is to call this from the `scripts` section of your `package.json` file.

```json
"scripts": {
    "start": "npm run watch",
    "pull-templates": "aptuitiv-build pull-templates",
    "push-templates": "aptuitiv-build push-templates",
    "watch": "aptuitiv-build watch"
}
```

The other way is using the [command line](docs/Command-line.md).

```bash
aptuitiv-build pull-template
```

## More information

- [Command line usage and actions](docs/Command-line.md)
  - [Copy files](docs/actions/Copy-files.md)
  - [CSS](docs/actions/Css.md)
  - [Export](docs/actions/Export.md)
  - [Fonts](docs/actions/Fonts.md)
  - [FTP](docs/actions/FTP.md)
  - [Icons](docs/actions/Icons)
  - [Images](docs/actions/Images.md)
  - [Javascript](docs/actions/Javascript.md)
  - [Templates](docs/actions/Templates.md)
  - [Theme configuration](docs/actions/Theme.md)
  - [Watch](docs/actions/Watch.md)
- [Configuration](docs/Configuration.md)
  - [Configuring CSS](docs/configuration/Css.md).
  - [Configuring Javascript](docs/configuration/Javascript.md)
