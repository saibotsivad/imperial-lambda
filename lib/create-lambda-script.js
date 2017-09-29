const fs = require('fs')
const mkdirp = require('mkdirp')
const path = require('path')

const rollup = require('rollup')
const commonjs = require('rollup-plugin-commonjs')
const nodeResolve = require('rollup-plugin-node-resolve')
const babel = require('rollup-plugin-babel')
const json = require('rollup-plugin-json')

const runnable = script => `// This is an automatically built file. Do not edit it.
import runnable from '${script}'
export default runnable
`

module.exports = ({ scriptPath }) => {
    const buildFolder = path.join(__dirname, '../docking-station')

    // make build folder and assemble the parts
    mkdirp.sync(buildFolder)
    fs.writeFileSync(path.join(buildFolder, 'runnable.js'), runnable(scriptPath), { encoding: 'utf8' })

    // rollup the runnable script into an AWS Lambda script
    return rollup
        .rollup({
            input: path.join(__dirname, 'runnable.js'),
            format: 'cjs',
            plugins: [
                json(),
                nodeResolve({
                    jsnext: true,
                    preferBuiltins: true,
                    extensions: [ '.js', '.json' ]
                }),
                commonjs({
                    ignore: [
                        // `got` brings this in for some foolish reason
                        'electron',
                        // as best as I can tell, the `aws-sdk` module
                        // is included in the AWS Lambda runtime
                        'aws-sdk',
                        // the NodeJS core modules
                        'fs',
                        'util',
                        'crypto',
                        'domain',
                        'string_decoder',
                        'timers',
                        'path',
                        'os',
                        'http',
                        'https',
                        'buffer',
                        'events',
                        'stream',
                        'url',
                        'querystring',
                        'zlib'
                    ]
                }),
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
}
