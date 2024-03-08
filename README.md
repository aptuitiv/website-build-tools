# Aptuitiv website build tools

Build tools to help with building and deploying websites at [Aptuitiv](https://www.aptuitiv.com/).

## Install

```bash
npm i - D @aptuitiv/website-build-tools
```

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

See the [Package.json](docs/configuration/Package-json-scripts.md) page for a full list of recommended scripts.

The other way is using the [command line](docs/Command-line.md).

```bash
aptuitiv-build pull-template
```

## Expected project structure

These build tools expect the following project structure:

- **build** - The folder that the CSS, Javscript, templates and other assets are built to. The contents of this folder are uploaded to the website via FTP.
- **src** - The source folder for the CSS, Javascript, template, and other assets.
  - **config** The folder holding the theme configuration files
  - **css** The CSS files for the project.
  - **fonts** Any self-hosted fonts needed for the project.
  - **icons** Any SVG icons to complile into a sprite.
  - **js** Any Javascript files for the project.
  - **templates** The Twig template files.
- **.aptuitiv-buildrc.js** - The [configuration file](docs/Configuration.md) for the build tools.
- **.env** - The environment file that holds the FTP credentials.

You can configure different paths for your assets in the [configuration file](docs/Configuration.md), but we recommend keeping this structure for consistency between projects.
  
While not required for the build tools, is recommended that you also have the following configuration files in the root of your project.

- **.editorconfig**
- **.gitignore**
- **.prettierignore**
- **.prettierrc.cjs**

## More information

- [Command line usage and actions](docs/Command-line.md)
  - [Build](docs/actions/Build.md)
  - [Copy files](docs/actions/Copy-files.md)
  - [CSS](docs/actions/Css.md)
  - [Export](docs/actions/Export.md)
  - [Fonts](docs/actions/Fonts.md)
  - [FTP](docs/actions/FTP.md)
  - [Icons](docs/actions/Icons.md)
  - [Images](docs/actions/Images.md)
  - [Initialize](docs/actions/Initialize.md)
  - [Javascript](docs/actions/Javascript.md)
  - [Templates](docs/actions/Templates.md)
  - [Theme configuration](docs/actions/Theme.md)
  - [Watch](docs/actions/Watch.md)
- [Configuration](docs/Configuration.md)
  - [Configuring CSS](docs/configuration/Css.md).
  - [Configuring Javascript](docs/configuration/Javascript.md)
  - [Recommended package.json scripts](docs/configuration/Package-json-scripts.md)
