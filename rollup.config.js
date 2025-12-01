import commonjs from '@rollup/plugin-commonjs';
import resolve from '@rollup/plugin-node-resolve';
import livereload from 'rollup-plugin-livereload';
import { terser } from 'rollup-plugin-terser';
import typescript from '@rollup/plugin-typescript';
import analyze from 'rollup-plugin-analyzer';
import versionInjector from 'rollup-plugin-version-injector';
import json from '@rollup/plugin-json';

const production = !process.env.ROLLUP_WATCH;

function serve() {
    let server;

    function toExit() {
        if (server) server.kill(0);
    }

    return {
        writeBundle() {
            if (server) return;
            server = require('child_process').spawn(
                'npm',
                ['run', 'start', '--', '--dev'],
                {
                    stdio: ['ignore', 'inherit', 'inherit'],
                    shell: true,
                }
            );

            process.on('SIGTERM', toExit);
            process.on('exit', toExit);
        },
    };
}

function make_config(input, output, name, extra_plugins) {
    let default_plugins = [
        resolve({
            browser: true,
            dedupe: ['@fortawesome/fontawesome-svg-core'],
        }),
        commonjs(),
        typescript({
            sourceMap: !production,
            inlineSources: !production,
        }),
        //minifying and bundle analysis in production mode
        production && terser(),
        production && analyze({ summaryOnly: true }),
    ];
    return {
        input: input,
        output: {
            sourcemap: !production,
            format: 'umd',
            name: name,
            dir: output,
        },
        plugins: extra_plugins.concat(default_plugins),
        watch: {
            clearScreen: false,
        },
    };
}

let main_plugins = [
    json({ compact: true }),
    versionInjector(),
    //live preview in dev mode
    !production && serve(),
    !production && livereload('public'),
];

export default [
    make_config(
        'src/extensions/quizdownHighlight.ts',
        'public/build/extensions/',
        'quizdownHighlight',
        []
    ),
    make_config(
        'src/extensions/quizdownKatex.ts',
        'public/build/extensions/',
        'quizdownKatex',
        []
    ),
    make_config('src/quizdown.ts', 'public/build/', 'quizdown', main_plugins),
];
