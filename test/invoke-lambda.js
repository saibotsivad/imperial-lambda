const config = require('../docking-station/aws.json')
const AWS = require('aws-sdk')

const DEFAULT_REGION = 'us-west-2'

const lambda = new AWS.Lambda({
    region: config.region || DEFAULT_REGION
})

const parameters = {
    FunctionName: 'imperialLambda',
    InvocationType: 'RequestResponse',
    LogType: 'None'
}

lambda.invoke(parameters, (error, result) => {
    console.log('error', error)
    console.log('result', result)
})
