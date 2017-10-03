const fs = require('fs')
const path = require('path')
const mkdirp = require('mkdirp')
const promiseAll = require('p-all')
const promiseWhile = require('p-whilst')

const sendToSns = require('../lib/aws-send-sns-message.js')
const fetchSqsMessages = require('../lib/aws-read-sqs.js')
const deleteSqsMessage = require('../lib/aws-delete-from-sqs.js')

const helpText = `Launch the Imperial Lambda fleet.
  imperial-lambda launch [options] /path/to/configuration.json

Available options:
  short  long      default
  g      guns      1        Number of concurrent scripts to run per Lambda.
  b      bullets   1        Number of total times to run the script across all Lambdas.
  h      help               This help text.
`

module.exports = (filePath, argv) => {
    if (argv.h || argv.help || argv['?']) {
        console.log(helpText)
        process.exit(1)
    }

    if (!process.env.AWS_PROFILE) {
        console.log('WARN: No AWS profile selected.')
        console.log('You may want to invoke the launcher this way:')
        console.log('  AWS_PROFILE=imperial_lambda node bin/index.js launch ./example/number-adder/runnable.json -l 2 -c 10\n')
    }

    let runnable = {}
    if (!filePath) {
        return Promise.reject('No configuration file specified.\n\n' + helpText)
    } else {
        try {
            fs.accessSync(filePath)
            runnable = require(filePath)
        } catch (error) {
            return Promise.reject('Could not load configuration file at: ' + filePath)
        }
    }

    // the command line number overrides the configuration file numbers
    runnable.configuration = runnable.configuration || {}
    const guns = parseInt(argv.g || argv.guns || runnable.configuration.guns, 10) || 1
    const bullets = parseInt(argv.b || argv.bullets || runnable.configuration.bullets, 10) || 1

    runnable.configuration.guns = guns
    runnable.configuration.bullets = Math.round(bullets / guns)

    const totalBulletsAfterRounding = runnable.configuration.guns * runnable.configuration.bullets
    const leftoverBullets = bullets - totalBulletsAfterRounding
    if (leftoverBullets) {
        console.log(`Ships could not be loaded with all bullets. Remaining: ${totalBulletsAfterRounding}`)
    }

    const awsConfiguration = require(path.join(__dirname, '../docking-station/aws.json'))
    const send = sendToSns(awsConfiguration)

    const start = new Date()
    console.log(`Launching the Imperial Lambda fleet at ${start.toISOString()}`)
    console.log(`Bullets: ${totalBulletsAfterRounding}`)
    console.log(`Guns:    ${guns}`)

    const shots = new Array(runnable.configuration.bullets)
        .fill(runnable)
        .map((value, index) => () => send(value))

    return promiseAll(shots, { concurrency: 100 })
        .then(results => {
            const end = new Date()
            console.log(`Launch Completed:       ${end.toISOString()}`)
            console.log(`Mission Time (seconds): ${(end.getTime() - start.getTime()) / 1000}`)
            console.log(`Lambdas Launched:       ${runnable.configuration.bullets}`)
            console.log(`Shots Fired:            ${totalBulletsAfterRounding}`)
            return results
        })
}
