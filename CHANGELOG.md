# Changelog
<!-- markdownlint-disable MD024 -->

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/), and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.37.1] - 2026-07-24

### Fixed

- Fixed issue uploading or downloading the theme directory.

## [1.37.0] - 2026-07-22

### Added

- Added recommended `node` version to the `package.json`. Set to `>=24.13.0` as thats the lowest version that dependencies currently require.
`stylelint-selector-bem-pattern@5` requires that version of node.
- Added 'pull-fonts` action to copy fonts from the build directory to the source directory.

### Changed

- Updated all packages to latest versions. This included updating `eslint` to version 10 and `stylelint` to version 17.
- Updated the `package.json` scripts to be better organized and have more scripts. Also changed the `download` and `upload` scripts to not have any parameters so that users an add specific paths to them.
- Improved error handling for CSS files so that it doesn't crash when there is an error. Also improved error handling in other functions.
- Improved processing CSS so that it only runs once.
- Improved running commands and capturing errors by properly waiting for tasks to complete.
- Improved the security with setting up the `.env` file so that passwords don't show in plain text and the `.env` file is only readable by it's owner.
- Improved the downloading of themes so that they no longer clobber the current working directory or hang.
- Moved shared functionality to shared functions.

### Fixed

- Fixed issue where the `env` file wasn't set up when installing a theme with the `init` command.
- Fixed minor linting issues.

## [1.36.0] - 2026-06-09

### Changed

- Changed the notification method for FTP notifications and added support for disabling or changing the notification sound.

## [1.35.0] - 2026-02-23

### Changed

- Improved the resiliency of the FTP functionality. Also batch the notifications for file uploads to prevent overloading system notifications.
- Updated packages. Could not update eslint to version 10 because `eslint-plugin-import-x` in `@aptuitiv/eslint-config-aptuitiv` doesn’t support it yet. 
Could not upgrade to Stylelint 17 because `stylelint-selector-bem-pattern` does not support it yet.

## [1.34.0] - 2026-01-20

### Changed

- Removed the `ai-cursor` package.json script. So far this has been completely unused.

## [1.33.0] - 2025-10-23

### Changed

- Updated packages.
- Added markdown lint configuration.
- Added Cursor rules for websites and a method to copy them to a website. `npm run ai-cursor` or `aptuitiv-build ai cursor`.

## [1.32.0] - 2025-07-22

### Changed

- Only write the formatted JSON to the file if it’s different from the original.

### Fixed

- Fixed issue where the theme configuration file would not be written to during a watch event when reformatting.

## [1.31.0] - 2025-07-22

### Changed

- Improved the error handling when validating theme config files. Errors are now caught and output to the console instead of stopping a task.
- Added validation to the theme config push command.

## [1.30.1] - 2025-07-22

### Fixed

- Fixed the script for pulling theme images.

## [1.30.0] - 2025-07-22

### Changed

- When the `config/theme-settings.json` and `config/theme-styles.json` files are processed they will now be validated and formatted. This will help prevent JSON errors and keep the files in a consistent format.

## [1.29.0] - 2025-07-22

### Added

- Added package.json scripts to download and upload specific theme folders.
- Added `pull` and `pull-images` command line scripts.
- Added package.json scripts to download and pull theme images.

### Changed

- Renamed the `deploy` package.json scripts to `upload`. This was done to make the usage more clear.
- Renamed `packagejson-format` package.json script to `package-json-format`.
- Renamed `packagejson-scripts` package.json script to `package-json-scripts`.

## [1.28.0] - 2025-07-15

### Fixed

- Fixed issue where the correct delete path was not set for a file so the file in the `dist` folder was not removed.

## [1.27.1] - 2025-07-02

### Changed

- Fixed issue where groups and sections weren’t ordered by name.

## [1.27.0] - 2025-07-02

### Added

- Added `format-theme-json` script to validate and format the `theme-settings.json` and `theme-styles.json` files.

### Changed

- Updated the documentation.

## [1.26.0] - 2025-06-02

### Changed

- Added `ncu` script to the package.json `scripts` section.

## [1.25.0] - 2025-05-29

### Changed

- Updated Aptuitiv eslint packages and configuration.
- Updated other NPM packages.

## [1.24.0] - 2025-04-23

### Added

- Added support for installing the Arlo theme when running `init`.

## [1.23.0] - 2025-04-09

### Added

- Added `declaration-block-no-duplicate-properties` Stylelint rule.

## [1.22.0] - 2025-04-09

### Added

- Added option to set up a basic website with `init`.
- Added option to set up an Aptuitiv theme website with `init`.

### Changed

- Improved the `init` command so that it better sets up website files.

## [1.21.0] - 2025-03-27

### Added

- Added support for eslint inline web worker plugin to support inlining the code for web workers instead of having to import files.
- Added documentation with Docusaurus. Viewable at [https://aptuitiv.github.io/website-build-tools](https://aptuitiv.github.io/website-build-tools).

### Changed

- Updated eslint and eslint configuration.
- Updated other packages.

## [1.20.0] - 2025-03-07

### Added

- Additional scripts to the `package.json` file.

## [1.19.0] - 2025-03-07

### Added

- Include `cjs` and `mjs` files when linting JavaScript.

## [1.18.0] - 2025-02-14

### Added

- Support for processing multiple SVG icon folders.
- Updated the `icons` configuration to be an array of objects.
- Added `path` and `output` options to the `icons` CLI.

## [1.17.0] - 2025-02-11

### Fixed

- Issue where processing multiple bundles at the same time could result in empty or incomplete files by ensuring temporary files have unique names.

## [1.16.0] - 2025-01-13

### Added

- Support for bundling an esbuild output with other files.

### Improved

- JavaScript console logging.
- JavaScript error handling.

## [1.15.0] - 2024-12-16

### Added

- The `env` action to build a missing `.env` file for FTP.

## [1.14.0] - 2024-09-23

### Added

- Expanded JavaScript watch to include `cjs` and `mjs` files.
- Support for processing JavaScript with esbuild.

### Updated

- Packages.
- ESLint to version 9.

## [1.13.2] - 2024-09-04

### Fixed

- Prevent removal of the temp file when building code to avoid `ENOENT: no such file or directory` errors.

## [1.13.1] - 2024-08-14

### Fixed

- Build path.

## [1.13.0] - 2024-08-14

### Added

- Graceful handling of JavaScript processing errors.

## [1.12.0] - 2024-07-23

### Added

- Support for matching a JavaScript file in multiple bundles.

## [1.11.0] - 2024-07-11

### Updated

- Aptuitiv ESLint config library.
- Other packages.

## [1.10.0] - 2024-05-14

### Added

- Support for [postcss extend plugin](https://github.com/travco/postcss-extend) to allow the use of `@extend` syntax.

## [1.9.0] - 2024-04-10

### Added

- Additional packages to remove when replacing Gulp.

## [1.8.0] - 2024-03-14

### Improved

- Messaging for different actions.

### Added

- Support for skipping certain files when copying folders.

## [1.7.0] - 2024-03-13

### Updated

- Gulp convert process.

### Improved

- Setting up the `package.json` scripts section.
- Exporting a site.

### Added

- Support for running `npm install` during the initialization task.

## [1.6.0] - 2024-03-12

### Added

- Support for converting older legacy Gulp build processes to use this build tool.

## [1.5.1] - 2024-03-11

### Fixed

- Issue when copying an array of files.

## [1.5.0] - 2024-03-11

### Added

- Support for converting a legacy Gulp build process to use these build tools.
- `package-json` actions to format the `package.json` file.

## [1.4.1] - 2024-03-08

### Removed

- `console.log`.

## [1.4.0] - 2024-03-08

### Added

- `init` action to help set up the config file and the `.env` file.

## [1.3.2] - 2024-03-06

### Fixed

- Stylelint `fix` option.

## [1.3.1] - 2024-03-06

### Fixed

- Missing closing icon SVG tag.

## [1.3.0] - 2024-03-06

### Fixed

- Issue where `node_modules` code wasn’t included in the script bundle.

### Changed

- Separated JavaScript bundle files from files to lint.
- Only output lint results if there are any.

## [1.2.0] - 2024-03-04

### Fixed

- Copy path to include the file path in the source folder.

## [1.1.0] - 2024-03-04

### Added

- Documentation updates.
- FTP growl notifier.
- `build` command.
- `start` command.

## [1.0.0] - 2024-03-04

### Added

- Initial release.
