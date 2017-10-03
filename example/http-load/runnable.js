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

const shift = (num, fuzz = 100) => {
    return Math.round(num - (Math.random() * fuzz))
}

module.exports = ({ payload }) => {
    const now = () => new Date().getTime()

    const request = payload.data.request
    const startTime = now()

    const timestampCenter = request.timestampCenter || 0

    const url = timestampCenter
        ? `${request.url}?fetchTimestamp=${shift(timestampCenter, request.centerFuzziness)}`
        : request.url

    return got(url, request.options)
        .then(response => {
            const endTime = now()
            return {
                status: response.statusCode,
                message: response.statusMessage,
                url,
                configuration: payload.configuration,
                startTime,
                endTime,
                runTime: endTime - startTime
            }
        })
        .catch(error => {
            const endTime = now()
            return {
                status: error.statusCode,
                error: error.message,
                url,
                configuration: payload.configuration,
                startTime,
                endTime,
                runTime: endTime - startTime
            }
        })
}
