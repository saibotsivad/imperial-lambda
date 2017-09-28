const test = require('tape')
const app = require('../.imperial-lambda/build.js')

test('that the response is as expected', t => {
    app().then(output => {
        console.log('output', output)
        t.end()
    })
})
