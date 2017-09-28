#!/usr/bin/env node

const minimist = require('minimist')
const fs = require('fs')
const path = require('path')
const imperialLambda = require('../')

const argv = minimist(process.argv.slice(2))

const configurationPath = path.isAbsolute(argv._[0])
    ? argv._[0]
    : path.join(process.cwd(), argv._[0])
let configuration

try {
    configuration = require(configurationPath)
} catch (error) {
    console.log('Could not load configuration file.')
    console.log('Use like: imperial-lambda /path/to/file.json')
    process.exit(1)
}

const scriptFilename = path.join(path.dirname(configurationPath), argv.script || argv.s || configuration.script)
try {
    fs.accessSync(scriptFilename)
} catch (error) {
    console.log('Could not load Lambda runnable script at: ' + scriptFilename)
    process.exit(1)
}

const options = {
    buildFolder: path.join(process.cwd(), '.imperial-lambda'),
    script: scriptFilename,
    lambdas: argv.lambdas || argv.l || configuration.lambdas || 1,
    concurrent: argv.concurrent || argv.c || configuration.concurrent || 1
}

imperialLambda(options, configuration.data)
    .then(() => {
        console.log('Process complete without errors.')
    })
    .catch(error => {
        console.log('Process exited with errors:')
        console.log(error)
    })
