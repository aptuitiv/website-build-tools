/* ===========================================================================
This is a plugin for esbuild which allows you to import .worker.js files to get the constructor for a Web Worker, similar to worker-loader for Webpack.
Based on https://github.com/mitschabaude/esbuild-plugin-inline-worker
=========================================================================== */

/* eslint-env node */
import esbuild from 'esbuild';
import findCacheDir from 'find-cache-dir';
import fs from 'fs';
import path from 'path';
import { isObjectWithValues } from '../../lib/types.js';


const cacheDir = findCacheDir({
    name: 'esbuild-plugin-inline-worker',
    create: true,
});

/**
 * Build the worker code withi esbuild
 *
 * @param {string} workerPath The path to the worker file
 * @param {object} extraConfig Any extra configuration for the esbuild build
 * @returns {string} The worker code
 */
async function buildWorker(workerPath, extraConfig) {
    const scriptNameParts = path.basename(workerPath).split('.');
    scriptNameParts.pop();
    scriptNameParts.push('js');
    const scriptName = scriptNameParts.join('.');
    const bundlePath = path.resolve(cacheDir, scriptName);

    const config = { ...extraConfig };
    if (config) {
        delete config.entryPoints;
        delete config.outfile;
        delete config.outdir;
        delete config.workerName;
    }

    await esbuild.build({
        bundle: true,
        entryPoints: [workerPath],
        minify: true,
        outfile: bundlePath,
        format: 'esm',
        ...config,
    });

    return fs.promises.readFile(bundlePath, { encoding: 'utf-8' });
}

/**
 * Set up the plugin
 *
 * @param {object} extraConfig Any extra configuration for the esbuild build
 * @returns {object}
 */
function inlineWorkerPlugin(extraConfig) {
    return {
        name: 'esbuild-plugin-inline-worker',

        setup(build) {
            build.onLoad(
                { filter: /\.worker\.(js|jsx|ts|tsx)$/ },
                async ({ path: workerPath }) => {
                    // let workerCode = await fs.promises.readFile(workerPath, {
                    //   encoding: 'utf-8',
                    // });

                    const workerCode = await buildWorker(workerPath, extraConfig);
                    return {
                        contents: `import inlineWorker from '__inline-worker'
export default function Worker() {
  return inlineWorker(${JSON.stringify(workerCode)});
}
`,
                        loader: 'js',
                    };
                }
            );

            const name = isObjectWithValues(extraConfig) && extraConfig.workerName ? { name: extraConfig.workerName } : {}

            const inlineWorkerFunctionCode = `
export default function inlineWorker(scriptText) {
  let blob = new Blob([scriptText], {type: 'text/javascript'});
  let url = URL.createObjectURL(blob);
  let worker = new Worker(url, ${JSON.stringify(name)});
  URL.revokeObjectURL(url);
  return worker;
}
`;

            build.onResolve({ filter: /^__inline-worker$/ }, (resolveData) => ({ path: resolveData.path, namespace: 'inline-worker' }));
            build.onLoad({ filter: /.*/, namespace: 'inline-worker' }, () => ({ contents: inlineWorkerFunctionCode, loader: 'js' }));
        },
    };
}


export default inlineWorkerPlugin;
