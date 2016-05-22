import nodeResolve from 'rollup-plugin-node-resolve';
import commonJS from 'rollup-plugin-commonjs';
import buble from 'rollup-plugin-buble';

export default {
    sourceMap: "inline",
    plugins: [
        buble(),
        nodeResolve(),
        commonJS({
            include: 'node_modules/**'
        })
    ]
}