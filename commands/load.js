const fs = require('fs')
const path = require('path')
const { waterfall, constant } = require('async')

const {
    createTopic,
    createQueue,
    getQueueArn,
    subscribeToTopic,
    setQueueAttributes,
    createLambda
} = require('./../lib/amazon-commands')

const DEFAULT_REGION = 'us-west-2'

module.exports = ({ cwd, buildFolder, script, role, lambdas, concurrent, data }) => {
    if (!process.env.AWS_REGION) {
        console.log(`AWS_REGION is not set, defaulting to "${DEFAULT_REGION}".`)
    }
    if (!process.env.AWS_PROFILE) {
        console.log('AWS_PROFILE is not set, this is an error.')
        console.log('You will probably want to set it before running, like this: AWS_PROFILE=imperial_lambda')
        process.exit(1)
    }
    if (!role) {
        console.log('You must include a role with `-r`/`--role`')
        process.exit(1)
    }

    // Configure AWS region. NOTE: This means you can only test from one region at a time.
    AWS.config.update({
        region: process.env.AWS_REGION || DEFAULT_REGION
    })

    // Create the Amazon services
    const sns = new AWS.SNS()
    const sqs = new AWS.SQS()
    const lambda = new AWS.Lambda()

    return new Promise((resolve, reject) => {
        waterfall([
            constant({}),
            createTopic(sns),
            createQueue(sqs),
            getQueueArn(sqs),
            subscribeToTopic(sns),
            setQueueAttributes(sqs)
        ], (error, context) => {
            if (error) {
                reject(error)
            } else {
                fs.writeFileSync(path.join(buildFolder, 'aws.json'), JSON.stringify(context, undefined, 2), { encoding: 'utf8' })
                resolve()
            }
        })
    })
    .then(() => createLambda({ buildFolder, role, lambda }))
}
