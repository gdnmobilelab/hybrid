import buble from 'rollup-plugin-buble';
import multiEntry from 'rollup-plugin-multi-entry';
import inject from 'rollup-plugin-inject';

export default {
    entry: ['test/src/**/*.js', 'test/run-tests.js'],
    plugins: [
        buble(),
        multiEntry(),
        inject({
            'provide': [__dirname + '/test/framework.js', 'provide']
        })
    ],
    format: 'iife',
    moduleName: 'tests'
}