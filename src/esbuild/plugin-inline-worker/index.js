/* ===========================================================================
This is a plugin for esbuild which allows you to import .worker.js files to get the constructor for a Web Worker, similar to worker-loader for Webpack.
Based on https://github.com/mitschabaude/esbuild-plugin-inline-worker
=========================================================================== */

import esbuild from 'esbuild';
import findCacheDir from 'find-cache-dir';
import fs from 'fs';
import path from 'path';
import { isObjectWithValues } from '../../lib/types.js';

export { inlineWorkerPlugin as default };

function inlineWorkerPlugin(extraConfig) {
    return {
        name: 'esbuild-plugin-inline-worker',

        setup(build) {
            build.onLoad(
                { filter: /\.worker\.(js|cjs|jsx|ts|tsx)$/ },
                async ({ path: workerPath }) => {
                    // let workerCode = await fs.promises.readFile(workerPath, {
                    //   encoding: 'utf-8',
                    // });

                    let workerCode = await buildWorker(workerPath, extraConfig);
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

            build.onResolve({ filter: /^__inline-worker$/ }, ({ path }) => {
                return { path, namespace: 'inline-worker' };
            });
            build.onLoad({ filter: /.*/, namespace: 'inline-worker' }, () => {
                return { contents: inlineWorkerFunctionCode, loader: 'js' };
            });
        },
    };
}



let cacheDir = findCacheDir({
    name: 'esbuild-plugin-inline-worker',
    create: true,
});

async function buildWorker(workerPath, extraConfig) {
    let scriptNameParts = path.basename(workerPath).split('.');
    scriptNameParts.pop();
    scriptNameParts.push('js');
    let scriptName = scriptNameParts.join('.');
    let bundlePath = path.resolve(cacheDir, scriptName);

    if (extraConfig) {
        delete extraConfig.entryPoints;
        delete extraConfig.outfile;
        delete extraConfig.outdir;
        delete extraConfig.workerName;
    }

    await esbuild.build({
        bundle: true,
        entryPoints: [workerPath],
        minify: false,
        outfile: bundlePath,
        format: 'cjs',
        ...extraConfig,
    });

    return fs.promises.readFile(bundlePath, { encoding: 'utf-8' });
}
