import nodeResolve from 'rollup-plugin-node-resolve';
import commonJS from 'rollup-plugin-commonjs';
import buble from 'rollup-plugin-buble';
import typescript from 'rollup-plugin-typescript';
import uglify from 'rollup-plugin-uglify';

export default {
    sourceMap: false,
    treeshake: false,
    plugins: [
        typescript(),
        buble(),
        nodeResolve({
            preferBuiltins: false
        }),
        commonJS({
            include: 'node_modules/**',
            extensions: ['.js', '.ts'],
            namedExports: {
                'node_modules/es6-promise/dist/es6-promise.js': ['Promise'],
                // 'node_modules/eventemitter3/index.js': ['EventEmitter']
            }
        }),
        uglify()
    ]
}