const fs = require('fs')
const mkdirp = require('mkdirp')
const path = require('path')
const jszip = require('jszip')

const rollup = require('rollup')
const commonjs = require('rollup-plugin-commonjs')
const nodeResolve = require('rollup-plugin-node-resolve')
const babel = require('rollup-plugin-babel')
const json = require('rollup-plugin-json')
const builtins = require('rollup-plugin-node-builtins')

const runnable = script => `// This is an automatically built file. Do not edit it.
import runnable from '${script}'
export default runnable
`

const runnablePackageJson = {
    name: 'imperial-lambda-runnable',
    version: '0.0.0',
    description: 'Imperial-Lambda is a tool for running jobs in AWS Lambda.',
    homepage: 'https://github.com/saibotsivad/imperial-lambda',
    main: 'index.js',
    engines: {
        node: '>=6.10.0'
    },
    license: 'VOL'
}

module.exports = ({ buildFolder, cwd, script, concurrent, data }) => {
    console.log('Building AWS Lambda script...')
    // make the build folder to hold files
    mkdirp.sync(buildFolder)
    // write the runnable data as a JSON file for importing
    fs.writeFileSync(path.join(buildFolder, 'runnable.json'), JSON.stringify({ concurrent, data }, undefined, 2), { encoding: 'utf8' })
    // write a module file which our scripts can then reference
    fs.writeFileSync(path.join(buildFolder, 'runnable.js'), runnable(script), { encoding: 'utf8' })

    // rollup the runnable script into an AWS Lambda script
    return rollup
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
            // create the zip file
            return new Promise(resolve => {
                const zip = new jszip()
                zip.file('index.js', fs.readFileSync(path.join(buildFolder, 'build.js'), { encoding: 'utf8' }))
                zip.file('package.json', JSON.stringify(runnablePackageJson, undefined, 2))
                zip
                    .generateNodeStream({ type: 'nodebuffer', streamFiles: true })
                    .pipe(fs.createWriteStream(path.join(buildFolder, 'build') + '.zip'))
                    .on('finish', () => {
                        resolve()
                    })
            })
        })
}
