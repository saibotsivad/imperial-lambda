const got = require('got')

/*
This demo shows what a simple script might
look like. It makes an HTTP request to a
defined URL, and records the length of time
it took to complete the request.

The property `data` is *not validated* and is
expected to contain an object like:

{
  request: {
    url: 'http://site.com',
    options: {
      // the options passed to the NodeJS `http` call
    }
  }
}

The response of this module is formatted to look like:

{
  status: 200,
  startTime: 1506618940691,
  endTime: 1506618952017
}

*/

const now = () => new Date().getTime()

module.exports = ({ data }) => {
    const startTime = now()
    return got(data.request.url, data.request.options)
        .then(response => {
            return {
                status: response.statusCode,
                message: response.statusMessage,
                url: response.url,
                startTime,
                endTime: now()
            }
        })
        .catch(error => {
            return {
                status: error.statusCode,
                error: error.message,
                startTime,
                endTime: now()
            }
        })
}
