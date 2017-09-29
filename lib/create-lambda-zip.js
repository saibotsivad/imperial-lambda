const fs = require('fs')
const jszip = require('jszip')
const path = require('path')

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

const buildFolder = path.join(__dirname, '../docking-station')
const zipFile = path.join(buildFolder, 'build') + '.zip'

module.exports = () => new Promise(resolve => {
    const zip = new jszip()
    zip.file('index.js', fs.readFileSync(path.join(buildFolder, 'build.js'), { encoding: 'utf8' }))
    zip.file('package.json', JSON.stringify(runnablePackageJson, undefined, 2))
    zip
        .generateNodeStream({ type: 'nodebuffer', streamFiles: true })
        .pipe(fs.createWriteStream(zipFile))
        .on('finish', () => {
            resolve(zipFile)
        })
})
