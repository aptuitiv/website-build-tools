# YAML configurtion example

You can add a file named `.aptuitiv-buildrc.yaml` or `.aptuitiv-buildrc.yml` to your root project directory and use that for your build configuration.

Below is an example:

```yaml
---
copy:
  - src:
      - node_modules/@splidejs/splide/dist/css/splide.min.css
      - node_modules/@splidejs/splide/dist/js/splide.min.js
      - node_modules/@splidejs/splide-extension-video/dist/js/splide-extension-video.min.js
      - node_modules/@splidejs/splide-extension-video/dist/css/splide-extension-video.min.css
    dest: splide
  - src: node_modules/just-validate/dist/just-validate.production.min.js
    dest: just-validate
eslint:
  ignorePatterns:
    - fslightbox.js
javascript:
  bundles:
    - build: main.js
      nodeModules:
        - micromodal/dist/micromodal.min.js
      src:
        - script-loader.js
        - iframe-loader.js
        - notifications.js
        - navigation.js
        - accordion.js
        - header.js
        - main.js
  files:
    - fslightbox.js
    - test.js
```
