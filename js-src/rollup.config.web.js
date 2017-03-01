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
    // We add this shortcircuit so that iframes don't evaluate their own version of
    // the bridge, and instead just attach to the existing one.
    intro: `
        if (window.top.webkit.messageHandlers.hybrid.bridge) {
            return window.top.webkit.messageHandlers.hybrid.bridge.attachToWindow(window);
        }
    `,
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
            extensions: ['.js', '.ts'],
        })
    ]
}

if (process.env["CONFIGURATION"] && process.env["CONFIGURATION"] !== "Debug") {
    config.plugins.push(uglify({},minify));
}

export default config;