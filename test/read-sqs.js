const config = require('../docking-station/aws.json')
const AWS = require('aws-sdk')

const sqs = new AWS.SQS()

sqs.config.update({
    region: config.region
})

const parameters = {
    QueueUrl: config.QueueUrl,
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

sqs.receiveMessage(parameters, (error, result) => {
    console.log('error', error)
    console.log('result', result)
})
