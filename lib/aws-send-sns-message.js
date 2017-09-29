const AWS = require('aws-sdk')

const DEFAULT_REGION = 'us-west-2'

module.exports = ({ region, TopicArn }) => {
    const sns = new AWS.SNS({
        region: region || DEFAULT_REGION
    })

    return ({ configuration, data }) => new Promise((resolve, reject) => {
            const parameters = {
                TopicArn,
                Message: JSON.stringify({ configuration, data })
            }
            sns.publish(parameters, (error, result) => {
                if (error) {
                    reject(error)
                } else {
                    resolve(result)
                }
            })
        })
}
