const promiseSettle = require('p-settle')
const promiseTry = require('p-try')

const sendSqsMessage = require('./aws-send-sqs-message.js')
const { region, QueueUrl } = require('../docking-station/aws.json')
const runnable = require('../docking-station/runnable.js')

// AWS Lambda requires the default export to be
// an object with the property 'handler', which
// has the method signature shown.
module.exports = {
    handler(event, context, callback) {
        const send = sendSqsMessage({ region, QueueUrl })

        promiseTry(() => {
            const concurrent = event && event.configuration && event.configuration.concurrent || 1

            const actions = new Array(concurrent || 1)
                .fill({ event, context })
                .map(runnable)

            return promiseSettle(actions)
        })
        .catch(error => ({ error }))
        .then(data => {
            return send(data)
                .then(() => {
                    callback(null, data)
                })
        })
    }
}
