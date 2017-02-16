import nodeResolve from 'rollup-plugin-node-resolve';
import commonJS from 'rollup-plugin-commonjs';
import buble from 'rollup-plugin-buble';
import typescript from 'rollup-plugin-typescript';
import uglify from 'rollup-plugin-uglify';
import {minify} from 'uglify-js';

const config = {
    sourceMap: false,
    treeshake: false,
    format: 'iife',
    plugins: [
        typescript({
            include: "src/**"
        }),
        nodeResolve({
            preferBuiltins: false,
            jsnext: true
        }),
        commonJS({
            include: [
                'node_modules/**'
            ],
            exclude: [
                'node_modules/indexeddbshim-node6/rollup-ready/**'
            ],
            extensions: ['.js', '.ts'],
            namedExports: {
                'node_modules/es6-promise/dist/es6-promise.js': ['Promise'],
                // 'node_modules/eventemitter3/index.js': ['EventEmitter']
            }
        })
    ]
}

if (process.env["CONFIGURATION"] && process.env["CONFIGURATION"] !== "Debug") {
    config.plugins.push(uglify({},minify));
}

export default config;