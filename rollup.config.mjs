import dts from 'rollup-plugin-dts'
import esbuild from 'rollup-plugin-esbuild'
import nodeResolve from '@rollup/plugin-node-resolve'
import package_json from './package.json' assert { type: "json" };
import commonjs from '@rollup/plugin-commonjs';

export default [
    {
        input: `./main.ts`,
        plugins: [esbuild(), nodeResolve(), commonjs()],
        output: [
            {
                file: package_json.main,
                format: 'cjs',
                sourcemap: true,
            },
            {
                name: 'focusPanel',
                file: package_json.browser,
                format: 'iife'
            },
            {
                file: package_json.module,
                format: 'es',
                sourcemap: true,
            }
        ]
    },
    {
        input: `./main.ts`,
        plugins: [dts()],
        output: {
            file: `dist/bundle.d.ts`,
            format: 'es',
        },
    }
]
