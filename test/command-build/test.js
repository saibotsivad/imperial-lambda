const test = require('tape')
const fs = require('fs')
const path = require('path')
const extract = require('extract-zip')
const mkdirp = require('mkdirp')
const build = require('../../commands/build.js')

const buildFolder = path.join(process.cwd(), '.test-command-build')

test('that the build output is as expected', t => {
    const options = {
        buildFolder,
        cwd: process.cwd(),
        script: path.join(__dirname, 'app.js'),
        concurrent: 5,
        data: 'hello world'
    }
    build(options)
        .then(() => {
            const runnableJson = require(path.join(buildFolder, 'runnable.json'))
            t.deepEqual(runnableJson, { concurrent: 5, data: 'hello world' }, 'the data was written correctly')

            const outFolder = path.join(buildFolder, 'unzipped')
            mkdirp.sync(outFolder)
            extract(path.join(buildFolder, 'build.zip'), { dir: outFolder }, error => {
                if (error) {
                    t.fail(error)
                } else {
                    const builtPackage = require(path.join(outFolder, 'package.json'))
                    t.equal(builtPackage.main, 'index.js', 'just asserting that the file is readable')
                    const builtApp = require(path.join(outFolder, 'index.js'))
                    t.ok(typeof builtApp.handler === 'function', 'the export is an object with a "handler" property')
                    t.end()
                }
            })
        })
})
