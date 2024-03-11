# Initialize action

If you are creating a site from scratch or you are starting out with an existing website, you can run the `init` command to set up the environment.

This will do a few things things:

1. Check to make sure that the `.env` and the configuration file are in place.
2. Create the `.env` file with the FTP credentials if the file doesn't exist.
3. Create the configuration file if it doesn't exist.
4. Run the [build](./Build.md) process to build the site.

The following are equivalent:

```bash
aptuitiv-build init
aptuitiv-build initialize
```

By default the configuration file built will be `.aptuitiv-buildrc.js`. You can specify a different name if you prefer. See the [Configuration](/docs/Configuration.md) page for valid file names.

The following are equivalent:

```bash
aptuitiv-build init --config .aptuitiv-buildrc.cjs
aptuitiv-build init -c .aptuitiv-buildrc.cjs
```

If the `.env` file needs to be created then follow the prompts.

You can disable building the files with the `--no-build` options.

```bash
aptuitiv-build init --no-build
```
