const AWS = require('aws-sdk')

const SNS_TOPIC_NAME = 'imperial_lambda'
const SQS_QUEUE_NAME= 'imperial_lambda'

module.exports.createTopic = (sns) => (context, cb) => {
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

module.exports.createQueue = sqs => (context, cb) => {
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

module.exports.getQueueArn = sqs => (context, cb) => {
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

module.exports.subscribeToTopic = sns => (context, cb) => {
    sns.subscribe({
        TopicArn: context.TopicArn,
        Protocol: 'sqs',
        Endpoint: context.QueueArn
    }, (error, result) => {
        cb(error, context)
    })
}

module.exports.setQueueAttributes = sqs => (context, cb) => {
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

module.exports.createLambda = ({ buildFolder, role, lambda }) => new Promise((resolve, reject) => {
    const parameters = {
        Code: {
            
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
