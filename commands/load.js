const fs = require('fs')
const path = require('path')
const AWS = require('aws-sdk')
const { waterfall, constant } = require('async')

const SNS_TOPIC_NAME = 'imperial_lambda'
const SQS_QUEUE_NAME= 'imperial_lambda'
const DEFAULT_REGION = 'us-west-2'

const createTopic = sns => (context, cb) => {
    sns.createTopic({
        Name: SNS_TOPIC_NAME
    }, (error, result) => {
        if (error) {
            cb(error, context)
        } else {
            context.TopicArn = result.TopicArn
            cb(null, context)
        }
    })
}

const createQueue = sqs => (context, cb) => {
    sqs.createQueue({
        QueueName: SQS_QUEUE_NAME,
        Attributes: {
            VisibilityTimeout: '0',
            MessageRetentionPeriod: '300'
        }
    }, (error, result) => {
        if (error) {
            cb(error, context)
        } else {
            context.QueueUrl = result.QueueUrl
            cb(null, context)
        }
    })
}

const getQueueArn = sqs => (context, cb) => {
    sqs.getQueueAttributes({
        QueueUrl: context.QueueUrl,
        AttributeNames: [ 'QueueArn' ]
    }, (error, result) => {
        if (error) {
            cb(error, context)
        } else {
            context.QueueArn = result.Attributes.QueueArn
            cb(null, context)
        }
    })
}

const subscribeToTopic = sns => (context, cb) => {
    sns.subscribe({
        TopicArn: context.TopicArn,
        Protocol: 'sqs',
        Endpoint: context.QueueArn
    }, (error, result) => {
        cb(error, context)
    })
}

const setQueueAttributes = sqs => (context, cb) => {
    const attributes = {
        Version: '2008-10-17',
        Id: `${context.QueueArn}/SQSDefaultPolicy`,
        Statement: [{
            Sid: `Sid${new Date().getTime()}`,
            Effect: 'Allow',
            Principal: {
                AWS: '*'
            },
            Action: 'SQS:SendMessage',
            Resource: context.QueueArn,
            Condition: {
                ArnEquals: {
                    'aws:SourceArn': context.TopicArn
                }
            }
        }]
    }

    sqs.setQueueAttributes({
        QueueUrl: context.QueueUrl,
        Attributes: {
            Policy: JSON.stringify(attributes)
        }
    }, (error, result) => {
        cb(error, context)
    })
}

const createLambda = ({ buildFolder, role, lambda }) => new Promise((resolve, reject) => {
    const parameters = {
        Code: {
            ZipFile: fs.readFileSync(path.join(buildFolder, 'build.zip'))
        },
        FunctionName: 'imperialLambda',
        Handler: 'index.handler',
        Role: role,
        Runtime: 'nodejs6.10',
        Description: 'Imperial Lambda: https://github.com/saibotsivad/imperial-lambda',
        MemorySize: 512,
        Publish: true,
        Timeout: 300
    }

    lambda.createFunction(parameters, (error, data) => {
        if (error) {
            reject(error)
        } else {
            resolve(data)
        }
    })
})

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
