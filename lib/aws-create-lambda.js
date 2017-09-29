const fs = require('fs')
const AWS = require('aws-sdk')

const DEFAULT_REGION = 'us-west-2'

module.exports = (zipFile, { region, role, force }) => {
    const lambda = new AWS.Lambda({
        region: region || DEFAULT_REGION
    })

    const ZipFile = fs.readFileSync(zipFile)

    const parameters = {
        Code: { ZipFile },
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
        const handle = (error, data) => {
            if (error) {
                reject(error)
            } else {
                resolve(data)
            }
        }

        if (force) {
            lambda.updateFunctionCode({
                FunctionName: 'imperialLambda',
                ZipFile
            }, handle)
        } else {
            lambda.createFunction(parameters, handle)
        }
    })
}
