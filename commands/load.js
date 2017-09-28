const fs = require('fs')
const path = require('path')
const { waterfall, constant } = require('async')

const DEFAULT_REGION = 'us-west-2'

module.exports = ({ buildFolder, role, aws }) => {
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

    const awsCommands = aws({
        region: process.env.AWS_REGION || DEFAULT_REGION
    })

    const {
        createTopic,
        createQueue,
        getQueueArn,
        subscribeToTopic,
        setQueueAttributes,
        createLambda,
        deleteLambda
    } = awsCommands

    return new Promise((resolve, reject) => {
        waterfall([
            constant({}),
            createTopic,
            createQueue,
            getQueueArn,
            subscribeToTopic,
            setQueueAttributes
        ], (error, context) => {
            if (error) {
                reject(error)
            } else {
                fs.writeFileSync(path.join(buildFolder, 'aws.json'), JSON.stringify(context, undefined, 2), { encoding: 'utf8' })
                resolve()
            }
        })
    })
    .then(() => createLambda({ role, zipFile: path.join(buildFolder, 'build.zip') }))
    .catch(error => {
        if (error.name === 'ResourceConflictException') {
            // TODO in theory we could delete it and then create it?
            // http://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/Lambda.html#deleteFunction-property
            console.log('AWS Lambda function exists already. Delete it manually from AWS.')
            return { loggedErrors: true }
        }
        throw error
    })
}
