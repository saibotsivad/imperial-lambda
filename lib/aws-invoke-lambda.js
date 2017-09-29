const fs = require('fs')
const AWS = require('aws-sdk')

const DEFAULT_REGION = 'us-west-2'

module.exports = ({ region }) => {
    const lambda = new AWS.Lambda({
        region: region || DEFAULT_REGION
    })

    return data => new Promise((resolve, reject) => {
            const parameters = {
                FunctionName: 'imperialLambda',
                InvocationType: 'RequestResponse',
                LogType: 'None',
                Payload: JSON.stringify(data)
            }
            lambda.invoke(parameters, (error, result) => {
                if (error) {
                    reject(error)
                } else {
                    resolve(result)
                }
            })
        })
}
