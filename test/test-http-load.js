const test = require('tape')
const app = require('../.imperial-lambda/build.js')

test('that the response is as expected', t => {
    app.handler({}, {}, (error, results) => {
        t.equal(results.length, 1)
        t.ok(results[0].isFulfilled || results[0].isRejected)
        t.end()
    })
})
