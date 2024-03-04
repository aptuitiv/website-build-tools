# Command line usage

The way that you interact with the build tools is through the command line. Even if you've set up `scripts` in your `package.json` file those script commands call the build tool actions through a command line call.

The pattern for a command line call is:

```bash
aptuitiv-build <action> [parameters]
```

If you're not calling the script from the base directory of your project then you must pass the `--root` argument so that the correct folders paths are used.

```bash
aptuitiv-build pull-template --root path/to/my/project/root
```

Or you can do a relative path to the root from the current directory.

```bash
aptuitiv-build pull-template --root ../../
```

## Actions

- [Copy files](actions/Copy-files.md)
- [CSS](actions/Css.md)
- [Export](actions/Export.md)
- [Fonts](actions/Fonts.md)
- [FTP](actions/FTP.md)
- [Icons](actions/Icons.md)
- [Images](actions/Images.md)
- [Javascript](actions/Javascript.md)
- [Templates](actions/Templates.md)
- [Theme configuration](actions/Theme.md)
- [Watch](actions/Watch.md)
