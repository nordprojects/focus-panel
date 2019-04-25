import typescript from 'rollup-plugin-typescript2';
import nodeResolve from 'rollup-plugin-node-resolve';
import commonjs from 'rollup-plugin-commonjs';
import package_json from './package.json';

const plugins = [
    nodeResolve(),
    commonjs(),
    typescript({tsconfig: "tsconfig.json",})
];

export default [
    {
        input: './main.ts',
        output: {
            name: 'focusPanel',
            file: package_json.browser,
            format: 'iife'
        },
        plugins: plugins,
    },
    {
        input: './main.ts',
        external: ['ms'],
        output: [
            { file: package_json.main, format: 'cjs' },
            { file: package_json.module, format: 'es' }
        ],
        plugins: plugins,
    }
]
