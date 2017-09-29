const fs = require('fs')
const AWS = require('aws-sdk')

const DEFAULT_REGION = 'us-west-2'

module.exports = (zipFile, { region, role }) => {
    const lambda = new AWS.Lambda()

    lambda.config.update({
        region: region || DEFAULT_REGION
    })

    const parameters = {
        Code: {
            ZipFile: fs.readFileSync(zipFile)
        },
        FunctionName: 'imperialLambda',
        Handler: 'index.handler',
        Role: role,
        Runtime: 'nodejs6.10',
        Description: 'Imperial Lambda: https://github.com/saibotsivad/imperial-lambda',
        MemorySize: 512,
        Publish: true,
        Timeout: 300
    }

    return new Promise((resolve, reject) => {
        lambda.createFunction(parameters, (error, data) => {
            if (error) {
                reject(error)
            } else {
                resolve(data)
            }
        })
    })
}
