# Image configurations

Image processing is configured with the `images` configuration in the [configuration file](/docs/Configuration.md).

## Specify the image build folder

Specify the build folder within the theme build folder.

```js
{
    images: {
        build: 'images'
    }
}
```

## Specify the image source folder

Specify the image source folder within the source folder.

```js
{
    images: {
        source: 'images'
    }
}
```

## Image optimizations

When images are processed they are run through [sharp](https://sharp.pixelplumbing.com/) to optimize the image. 

Only the following image types are optimized:

- [JPG](#jpg-optimizations)
- [PNG](#png-optimizations)
- [WebP](#webp-optimizations)

All other file types in the images source folder are simply copied to the build folder.

### JPG optimizations

Configure the JPG optimizations with the `images.optimizations.jpg` configuration. The default is:

```js
{
    mozjpeg: true,
    quality: 80,
    progressive: true,
}
```

See [sharp jpeg](https://sharp.pixelplumbing.com/api-output#jpeg) for more information about the optimization options.

### PNG optimizations

Configure the PNG optimizations with the `images.optimizations.png` configuration. The default is:

```js
{
    quality: 80,
    progressive: true,
    compressionLevel: 6,
    adaptiveFiltering: true,
}
```

See [sharp png](https://sharp.pixelplumbing.com/api-output#png) for more information about the optimization options.

### WebP optimizations

Configure the WebP optimizations with the `images.optimizations.webp` configuration. The default is:

```js
{
    quality: 80,
    lossless: false,
    smartSubsample: true,
}
```

See [sharp png](https://sharp.pixelplumbing.com/api-output#webp) for more information about the optimization options.
