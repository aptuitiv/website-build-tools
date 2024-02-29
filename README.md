# Aptuitiv website build tools

Build tools to help with building and deploying websites at Aptuitiv.

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
