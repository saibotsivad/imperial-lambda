#!/usr/bin/env node

const minimist = require('minimist')
const path = require('path')
const pkg = require('../package.json')

const helpText = `Imperial Lambda (${pkg.version}): ${pkg.description}
Run it like this:
  imperial-lambda [command] /path/to/file

Supported commands:
  build    Prepare SQS, build script, deploy to Lambda.
  launch   Perform Lambda requests, read from SQS until complete.`

const commands = {
    build: require('../commands/build.js'),
    launch: require('../commands/launch.js')
}

const command = process.argv[2]
if (!commands[command]) {
    console.log('Command not supported.\n')
    console.log(helpText)
    process.exit(1)
}

const argv = minimist(process.argv.slice(3))

const file = argv._[0]
const filePath = file && path.isAbsolute(file)
    ? file
    : file && path.join(process.cwd(), file)

commands[command](filePath, argv)
    .then((response) => {
        if (response && response.loggedErrors) {
            console.log('Process exited prematurely.')
        } else if (response && response.showHelpText) {
            console.log(helpText)
        } else {
            console.log('Process complete without errors.')
        }
    })
    .catch(error => {
        console.log('Process exited with errors:')
        console.log(error)
    })
