const config = require('../docking-station/aws.json')
const AWS = require('aws-sdk')

const DEFAULT_REGION = 'us-west-2'

const sns = new AWS.SNS({
    region: config.region || DEFAULT_REGION
})

const runnable = {
    configuration: {
        guns: 10,
        bullets: 10
    },
    data: {
        number: 4
    }
}

const parameters = {
    TopicArn: config.TopicArn,
    Message: JSON.stringify(runnable),
}

sns.publish(parameters, (error, result) => {
    console.log('error', error)
    console.log('result', result)
})
