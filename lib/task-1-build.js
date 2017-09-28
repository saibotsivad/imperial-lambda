const path = require('path')
const rollup = require('rollup')
const commonjs = require('rollup-plugin-commonjs')
const nodeResolve = require('rollup-plugin-node-resolve')
const babel = require('rollup-plugin-babel')
const json = require('rollup-plugin-json')
const builtins = require('rollup-plugin-node-builtins')

module.exports = ({ cwd, buildFolder }) => rollup
    .rollup({
        input: path.join(cwd, 'lib/lambda-runnable.js'),
        plugins: [
            json(),
            builtins(),
            nodeResolve(),
            commonjs(),
            babel({
                babelrc: false,
                presets: [
                    [
                        'es2015',
                        {
                            modules: false
                        }
                    ]
                ],
                plugins: [
                    'external-helpers'
                ]
            })
        ]
    })
    .then(bundle => bundle.write({
        file: path.join(buildFolder, 'build.js'),
        format: 'cjs',
        name: 'imperial-lambda'
    }))
    .then(() => {
        // TODO zip up the file?
    })
