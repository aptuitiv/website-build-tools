# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

`@aptuitiv/website-build-tools` is an ES module Node.js CLI tool (`aptuitiv-build`) that provides build, optimization, and deployment tooling for Aptuitiv websites.
It processes CSS (PostCSS), JavaScript (esbuild/terser), images (sharp), SVG icons (svg-sprite), Twig templates, theme configs, and handles FTP deployment.

## Commands

### Linting & Formatting (this repo)

```bash
npm run eslint        # ESLint with auto-fix
npm run prettier      # Prettier formatting
npm run watch         # Continuous linting on file changes
```

### Local Testing

Link this package locally for testing in another project:

```bash
npm link                                          # In this repo
npm link @aptuitiv/website-build-tools            # In the consuming project
npm unlink @aptuitiv/website-build-tools --no-save  # To unlink from project
npm unlink                                        # To unlink from this repo
```

**Important:** Unlink before switching branches or modifying node_modules.

### Documentation Site

```bash
cd docs && npm start    # Local Docusaurus dev server
cd docs && npm run build  # Build docs
```

Docs deploy to GitHub Pages automatically on push to `develop` when doc files change.

There is no automated test suite. Quality is enforced through ESLint and Prettier.

## Architecture

### Entry Point

`index.js` — CLI built with Commander.js. Defines 30+ commands (build, css, js, images, icons, upload, etc.). Each command calls `config.init(args)` then delegates to a handler.

### Handler Pattern

Each feature lives in its own `src/*.js` file, exporting handler functions:

- `src/css.js` — PostCSS processing + Stylelint
- `src/javascript.js` — esbuild bundling + ESLint + terser minification
- `src/image.js` — sharp-based image optimization
- `src/icons.js` — SVG sprite generation
- `src/ftp.js` — FTP upload/download/delete
- `src/template.js`, `src/theme.js` — Twig template and theme config management
- `src/watch.js` — chokidar file watcher that triggers appropriate handlers
- `src/copy.js`, `src/font.js`, `src/pull.js` — file copying operations

### Configuration System

`src/config.js` — Singleton `Config` class using cosmiconfig to discover `.aptuitiv-buildrc.js` (or other cosmiconfig-supported formats) in consuming projects.
Merges user config with `defaultConfig` via deepmerge (arrays overwrite, not concatenate). Loads `.env` for FTP credentials.

### Utilities

- `src/lib/log.js` — Logging (`logInfo`, `logMessage`, `logSuccess`, `logWarning`) using chalk + log-symbols + fancy-log
- `src/lib/types.js` — Type checking (`isObject`, `isString`, `isStringWithValue`, etc.)
- `src/lib/files.js` — File system helpers
- `src/helpers.js` — Path manipulation
- `src/esbuild/plugin-inline-worker/` — Custom esbuild plugin for `.worker.js` Web Worker inlining

### Source Files for New Projects

`src/source-files/` contains template files copied during `aptuitiv-build init` to scaffold new projects.

## Code Style

- ES modules (`"type": "module"`) — use `import`/`export`, not `require`
- 4-space indentation, single quotes, semicolons, LF line endings
- ESLint uses `@aptuitiv/eslint-config-aptuitiv` (flat config format)
- No TypeScript — plain JavaScript with JSDoc comments
- camelCase for variables/functions, PascalCase for classes

## Git Workflow

- `main` branch for releases, `develop` for active development
- Releases are tagged (e.g., `1.34.0`) and published to npm
- Versioning tracked in `package.json` and `CHANGELOG.md`
