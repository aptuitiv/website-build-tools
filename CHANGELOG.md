# Change Log

## v1.14.0 - September 23, 2024

- Expanded the Javascript watch to include cjs and mjs files.
- Added support for processing Javascript with esbuild.
- Updated packages.
- Updated eslint to version 9.

## v1.13.2 - September 4, 2024

- Don't remove the temp file when building code. This was sometimes causing an `ENOENT: no such file or directory` error when building files.

## v1.13.1 - August 14, 2024

- Fixed build path.

## v1.13 - August 14, 2024

- Added support for gracefully handling Javascript processing errors.

## v1.12 - July 23, 2024

- Added support for matching a javascript file in multiple bundles.

## v1.11 - July 11, 2024

- Updated aptuitiv eslint config library.
- Updated other packages.

## v1.10 - May 14, 2024

- Added support for [postcss extend plugin](https://github.com/travco/postcss-extend) that allows a developer to use `@extend` syntax.

## v1.9 - April 10, 2024

- Added additional packages to remove when replacing gulp.

## v1.8 - March 14, 2024

- Improved messaging for different actions.
- Added support for skipping certain files when copying folders.

## v1.7 - March 13, 2024

- Update to the gulp convert process.
- Improvements to setting up the package.json scripts section.
- Improvements to exporting a site.
- Added support for running npm install during the initialization task.

## v1.6 - March 12, 2024

- Added support for converting older legacy gulp build processes to using this build tool.

## v1.5.1 - March 11, 2024

- Fixed issue when copying an array of files.

## v1.5 - March 11, 2024

- Added support for converting a legacy gulp build process to use these build tools.
- Added `package-json` actions to format the package.json file.

## v1.4.1 - March 8, 2024

- Removed console.log.

## v1.4 - March 8, 2024

- Added `init` action to help set up the config file and the `.env` file.

## v1.3.2 - March 6, 2024

- Fixed the stylelint `fix` option.

## v1.3.1 - March 6, 2024

- Fixed issue where the closing icon SVG tag was missing.
  
## v1.3 - March 6, 2024

- Fixed issue where node_modules code wasn’t included in the script bundle.
- Separate the Javascript bundle files from files to lint.
- Only output lint results if there are any.

## v1.2.0 - March 4, 2024

- Fixed issue where the copy path didn’t include the file path in the source folder.

## v1.1.0 - March 4, 2024

- Documentation updates.
- Added FTP growl notifier.
- Added `build` command.
- Added `start` command.

## v1.0.0 - March 4, 2024

Initial release.
