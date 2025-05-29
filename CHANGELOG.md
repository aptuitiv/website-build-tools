# Changelog
<!-- markdownlint-disable MD024 -->

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/), and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

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
