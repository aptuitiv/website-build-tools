# Javascript actions

- [Javascript actions](#javascript-actions)
  - [Process all Javascript files](#process-all-javascript-files)
  - [Process a specific Javascript file](#process-a-specific-javascript-file)
  - [Lint Javsacript files with eslint](#lint-javsacript-files-with-eslint)

## Process all Javascript files

The following are equivalent.

```bash
aptuitiv-build js
aptuitiv-build javascript
aptuitiv-build scripts
```

Don't lint while processing.

```bash
aptuitiv-build js --no-lint
```

## Process a specific Javascript file

```bash
aptuitiv-build js -f my-file.js
aptuitiv-build js --file my-file.js
```

The `file` argument should be the path to the Javascript file within the base Javascript folder, which is typically `src/js`.

Don't lint while processing.

```bash
aptuitiv-build js -f my-file.js --no-lint
```

## Lint Javsacript files with eslint

Lint all files.

The following are equivalent.

```bash
aptuitiv-build jslint
aptuitiv-build js-lint
aptuitiv-build javascript-lint
aptuitiv-build scripts-lint
```

Lint a specific file.

```bash
aptuitiv-build jslint -p 'src/js/my-file.js'
```

Lint a glob of files.

```bash
aptuitiv-build jslint -p 'src/js/something/*'
```
