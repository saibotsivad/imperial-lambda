import promiseMap from 'p-map'
import promiseReflect from 'p-reflect'
import promiseTry from 'p-try'

import runnable from './../.imperial-lambda/runnable.js'
import { concurrent, data } from './../.imperial-lambda/runnable.json'

const mapper = data => promiseReflect(promiseTry(runnable(data)))

export default {
    handler(event, context, callback) {
        const actions = new Array(concurrent || 1).fill({ data, event, context })
        return promiseMap(actions, mapper, { concurrency: concurrent })
            .then(() => callback())
            .catch(error => callback(error))
    }
}
