const fs = require('fs')
const AWS = require('aws-sdk')

const SNS_TOPIC_NAME = 'imperial_lambda'
const SQS_QUEUE_NAME= 'imperial_lambda'
const DEFAULT_REGION = 'us-west-2'

module.exports = ({ region, QueueUrl }) => {
    const sqs = new AWS.SQS()

    sqs.config.update({
        region: region || DEFAULT_REGION
    })

    const parameters = {
        QueueUrl,
        AttributeNames: [
            'SentTimestamp',
            'SequenceNumber',
            'MessageDeduplicationId'
        ],
        MaxNumberOfMessages: 10,
        MessageAttributeNames: [
            'All'
        ],
        VisibilityTimeout: 0,
        WaitTimeSeconds: 5
    }

    return new Promise((resolve, reject) => {
        sqs.receiveMessage(parameters, (error, data) => {
            if (error) {
                reject(error)
            } else {
                resolve(data)
            }
        })
    })
}
