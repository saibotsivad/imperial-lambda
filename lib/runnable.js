const promiseAll = require('p-all')

const sendSqsMessage = require('./aws-send-sqs-message.js')
const { region, QueueUrl } = require('../docking-station/aws.json')
const runnable = require('../docking-station/runnable.js')

// AWS Lambda requires the default export to be
// an object with the property 'handler', which
// has the method signature shown.
module.exports = {
    handler(event, context, callback) {
        const send = sendSqsMessage({ region, QueueUrl })

        const message = event && event.Records && event.Records[0] && event.Records[0].Sns && event.Records[0].Sns.Message
        const payload = message && JSON.parse(message)

        const guns = payload && payload.configuration && payload.configuration.guns || 1

        const shots = new Array(guns)
            .fill({ payload, event, context })
            .map(value => () => {
                return runnable(value).then(send)
            })

        return promiseAll(shots, { concurrency: guns })
            .then(data => {
                callback(null, data)
            })
    }
}
