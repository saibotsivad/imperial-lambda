import promiseMap from 'p-map'
import promiseReflect from 'p-reflect'
import promiseTry from 'p-try'

import sendSqsMessage from './aws-send-sqs-message.js'
import { region, QueueUrl } from '../docking-station/aws.json'
import runnable from '../docking-station/runnable.js'

const mapper = data => promiseReflect(promiseTry(() => runnable(data)))

// AWS Lambda requires the default export to be
// an object with the property 'handler', which
// has the method signature shown.
export default {
    handler(event, context, callback) {
        const send = sendSqsMessage({ region, QueueUrl })

        const { configuration } = event

        const actions = new Array(configuration.concurrent || 1).fill({ event, context })
        return promiseMap(actions, mapper, { concurrency: configuration.concurrent })
            .then(data => {
                // `event` is the thing that comes in on the lambda request
                return send(data)
            })
            .then(data => {
                callback(null, data)
            })
    }
}
