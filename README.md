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
  - [Copy files](actions/Copy-files.md)
  - [CSS](actions/Css.md)
  - [Export](actions/Export.md)
  - [Fonts](actions/Fonts.md)
  - [FTP](actions/FTP.md)
  - [Icons](actions/Icons)
  - [Images](actions/Images.md)
  - [Javascript](actions/Javascript.md)
  - [Templates](actions/Templates.md)
  - [Theme configuration](actions/Theme.md)
  - [Watch](actions/Watch.md)
- [Configuration](docs/Configuration.md)
  - [Configuring CSS](configuration/Css.md).
  - [Configuring Javascript](configuration/Javascript.md)
