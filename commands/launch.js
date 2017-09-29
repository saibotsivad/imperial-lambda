const fs = require('fs')
const promiseSettle = require('p-settle')

const invokeLambda = require('../lib/aws-invoke-lambda.js')
const readSqs = require('../lib/aws-read-sqs.js')

const helpText = `Launch the Imperial Lambda fleet.
  imperial-lambda launch [options] /path/to/configuration.json

Available options:
  -c  --concurrent   Number of concurrent scripts to run on one Lambda.
  -l  --lambdas      Number of Lambda instances to start.
  -h  --help         This help text.
`

module.exports = (filePath, argv) => {
    if (argv.h || argv.help || argv['?']) {
        console.log(helpText)
        process.exit(1)
    }

    let runnable
    if (!filePath) {
        console.log(argv)
        console.log('WARN: No configuration file specified.')
    } else {
        try {
            fs.accessSync(filePath)
            runnable = require(filePath)
        } catch (error) {
            return Promise.reject('Could not load configuration file at: ' + filePath)
        }
    }

    const lambdas = parseInt(argv.l || argv.lambdas || 1, 10)
    const concurrent = parseInt(argv.c || argv.concurrent, 10)

    if (lambdas > 100 && !argv.f && !argv.force) {
        return Promise.reject('Amazon limits the fleet size to 100 Lambdas.\nIf you have contacted them and upgraded to a higher count, use -f or --force to continue.')
    }

    console.log('Launching the Imperial Lambda fleet!')
    console.log(`Lambdas: ${lambdas}`)
    console.log(`Concurrent: ${concurrent}`)

    runnable.configuration = runnable.configuration || {}
    // the command line number overrides the runnable number
    runnable.configuration.concurrent = concurrent || runnable.configuration.concurrent || 1

    const run = invokeLambda({})
    console.log('yoloooo')

    const actions = new Array(lambdas)
        .fill(runnable)
        .map(value => run(value))
    return promiseSettle(actions)
}
