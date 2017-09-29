const SQS = require('aws-sdk/clients/sqs')
const sqs = new SQS()

sqs.config.update({
    region: 'us-west-2'
})

const parameters = {
    QueueUrl: "https://sqs.us-west-2.amazonaws.com/985731193180/imperial_lambda",
    MessageBody: 'yolo'
}

sqs.sendMessage(parameters, (error, result) => {
    console.log('error', error)
    console.log('result', result)
})
