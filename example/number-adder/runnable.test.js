const test = require('tape')
const add = require('./runnable.js')

test('number-adder', t => {
    add({ data: { number: 1 } })
        .then(result => {
            t.equal(result.number, 2)
            t.end()
        })
})
