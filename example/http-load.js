import get from 'simple-get'

/*
The property `data` is *not validated* and is expected to
be an `option` object as you would pass to `simple-get`.

    {
      request: {
        url: 'http://site.com/?things=stuff',
        method: 'GET',
        headers: {
          'x-auth-key': 'my-secret-auth-key'
        }
      }
    }

The response of this module is formatted to look like:

{
  status: 200,
  milliseconds: 307
}

*/

const now = () => new Date().getTime()

export default data => {
    const start = now()
    return new Promise((resolve, reject) => {
        get(data.request, (error, response) => {
            const output = {
                status: response.statusCode,
                milliseconds: now() - start
            }
            if (error) {
                reject(output)
            } else {
                resolve(output)
            }
        })
    })
}
