const test = require('tape')
const proxyquire = require('proxyquire')

test('http-load', t => {
    t.test('basic http GET returns a well formed object', t => {
        const load = proxyquire('./http-load', {
            got: (url, options) => {
                t.equal(url, 'http://site.com')
                t.equal(options.headers['x-auth-token'], 'abc123')
                return Promise.resolve({
                    statusCode: 123,
                    statusMessage: 'hello',
                    url: 'world'
                })
            }
        })

        load({
            request: {
                url: 'http://site.com',
                options: {
                    headers: {
                        'x-auth-token': 'abc123'
                    }
                }
            }
        })
        .then(response => {
            t.equal(response.status, 123)
            t.equal(response.message, 'hello')
            t.equal(response.url, 'world', 'takes the url given by the request object internally')
            t.end()
        })
    })
})
