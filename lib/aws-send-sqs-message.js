const fs = require('fs')
const AWS = require('aws-sdk')

const DEFAULT_REGION = 'us-west-2'

module.exports = ({ region, QueueUrl }) => {
    const sqs = new AWS.SQS()

    sqs.config.update({
        region: region || DEFAULT_REGION
    })

    return data => new Promise((resolve, reject) => {
            const parameters = {
                QueueUrl,
                MessageBody: JSON.stringify(data)
            }
            sqs.sendMessage(parameters, (error, result) => {
                if (error) {
                    reject(error)
                } else {
                    resolve(result)
                }
            })
        })
}
