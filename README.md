# Aptuitiv website build tools

Build tools to help with building and deploying websites at Aptuitiv.

- [Aptuitiv website build tools](#aptuitiv-website-build-tools)
  - [Calling the script](#calling-the-script)
  - [Template actions](#template-actions)
  - [Pull template files](#pull-template-files)
  - [Push template files](#push-template-files)

## Calling the script

There are two ways to call the script.

The first, and recommended way is to call this from the `scripts` section of your `package.json` file.

```json
"scripts": {
    "start": "npm run watch",
    "pull-theme": "aptuitiv-build template --pull",
    "push-theme": "aptuitiv-build template --push",
    "watch": "aptuitiv-build watch"
}
```

The other way is using the command line and `npx`.

```bash
npx aptuitiv-build template --pull
```

If you're not calling the script from the base directory of your project then you must pass the `--root` argument so that the correct folders paths are used.

```bash
npx aptuitiv-build template --pull --root path/to/my/project/root
```

Or you can do a relative path to the root from the current directory.

```bash
npx aptuitiv-build template --pull --root ../../
```

## Template actions

## Pull template files

Copy the template files from the build folder to the source folder. This is typically done after downloading the template files via FTP.

```bash
aptuitiv-build template --pull
```

## Push template files

Copy the template files from the source folder to the build folder.

```bash
aptuitiv-build template --push
```
