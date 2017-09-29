const fs = require('fs')
const AWS = require('aws-sdk')

const SNS_TOPIC_NAME = 'imperial_lambda'
const SQS_QUEUE_NAME= 'imperial_lambda'
const DEFAULT_REGION = 'us-west-2'

const handle = (resolve, reject) => (error, result) => {
    if (error) {
        reject(error)
    } else {
        resolve(result)
    }
}

module.exports = (configuration = {}) => {
    const { region, queueName } = configuration

    AWS.config.update({
        region: region || DEFAULT_REGION
    })

    const sqs = new AWS.SQS()

    function createQueue(parameters) {
        return new Promise((resolve, reject) => {
            sqs.createQueue(parameters, handle(resolve, reject))
        })
    }

    function getQueueAttributes(parameters) {
        return new Promise((resolve, reject) => {
            sqs.getQueueAttributes(parameters, handle(resolve, reject))
        })
    }

    function setQueueAttributes(parameters) {
        return new Promise((resolve, reject) => {
            sqs.setQueueAttributes(parameters, handle(resolve, reject))
        })
    }

    const endResults = {
        region: region || DEFAULT_REGION
    }

    return createQueue({
            QueueName: queueName || SQS_QUEUE_NAME,
            Attributes: {
                VisibilityTimeout: '0',
                MessageRetentionPeriod: '300'
            }
        })
        .then(result => {
            endResults.QueueUrl = result.QueueUrl

            return getQueueAttributes({
                QueueUrl: endResults.QueueUrl,
                AttributeNames: [ 'QueueArn' ]
            })
        })
        .then(result => {
            endResults.QueueArn = result.Attributes.QueueArn

            return setQueueAttributes({
                QueueUrl: endResults.QueueUrl,
                Attributes: {
                    Policy: JSON.stringify({
                        Version: '2012-10-17',
                        Id: `${endResults.QueueArn}/SQSDefaultPolicy`,
                        Statement: [{
                            Sid: `Sid${new Date().getTime()}`,
                            Effect: 'Allow',
                            Principal: {
                                AWS: '*'
                            },
                            Action: 'SQS:SendMessage',
                            Resource: endResults.QueueArn
                            // TODO did we need 'Condition'
                        }]
                    })
                }
            })
        })
        .then(() => endResults)
}
